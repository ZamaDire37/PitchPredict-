import { Router } from 'express';
import {
  requireSupabase,
  assertSupabaseOk,
  fetchAllRows,
  sendRouteError,
} from '../db/supabaseClient.js';
import { RealFootballApiService } from '../services/realFootballApi.js';
import { FootballApiService } from '../services/footballApi.js';
import { resolveAndGradePastMatches } from '../services/scoringEngine.js';
import { optionalAuthMiddleware, adminAuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { normalizeCompetition } from '../services/leagueRanking.js';

const router = Router();

function computeUtcRangeForLocalDate(ymd: string, tzOffsetMinutes: number): {
  startIso: string;
  endIso: string;
} {
  const startMs = Date.parse(`${ymd}T00:00:00.000Z`) - tzOffsetMinutes * 60_000;
  const endMs = Date.parse(`${ymd}T23:59:59.999Z`) - tzOffsetMinutes * 60_000;
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
}

// GET /api/matches - Retrieve real football fixtures from Supabase
router.get('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await resolveAndGradePastMatches();
    const {
      filter = 'upcoming',
      competition,
      date,
      team,
      tzOffset,
      clientDate,
      limit = 350,
    } = req.query;

    const client = requireSupabase();
    const nowIso = new Date().toISOString();
    const tzOffsetMinutes = parseInt((tzOffset as string) || '0', 10) || 0;
    const rowLimit = Math.min(Math.max(parseInt(limit as string, 10) || 350, 1), 1000);

    let query = client.from('matches').select('*');

    if (competition && competition !== 'ALL') {
      query = query.eq('competition_id', String(competition));
    }

    if (team && typeof team === 'string' && team.trim()) {
      const cleanTeam = team.trim().replace(/[,%()]/g, '');
      if (cleanTeam) {
        query = query.or(
          `home_team_name.ilike.%${cleanTeam}%,away_team_name.ilike.%${cleanTeam}%`
        );
      }
    }

    if (date && typeof date === 'string') {
      const { startIso, endIso } = computeUtcRangeForLocalDate(date, tzOffsetMinutes);
      query = query.gte('utc_date', startIso).lte('utc_date', endIso);
    } else if (filter === 'today') {
      const todayStr = (clientDate as string) || nowIso.split('T')[0];
      const { startIso, endIso } = computeUtcRangeForLocalDate(todayStr, tzOffsetMinutes);
      query = query.gte('utc_date', startIso).lte('utc_date', endIso);
    } else if (filter === 'upcoming') {
      query = query.in('status', ['TIMED', 'SCHEDULED']).gt('utc_date', nowIso);
    } else if (filter === 'finished') {
      query = query.eq('status', 'FINISHED');
    }

    query = query
      .not('home_team_name', 'like', 'Test Team%')
      .not('home_team_name', 'like', 'Team %')
      .neq('home_team_name', 'Live Home')
      .order('utc_date', { ascending: true })
      .order('competition_name', { ascending: true })
      .limit(rowLimit);

    const { data: rawMatches, error } = await query;
    assertSupabaseOk(error, 'Fetch matches');

    const matches = (rawMatches || [])
      .filter(
        (m: any) =>
          !(
            m.external_id >= 501000 &&
            m.external_id < 600000 &&
            (m.status === 'TIMED' || m.status === 'SCHEDULED')
          )
      )
      .map((m: any) => {
        const norm = normalizeCompetition(m.competition_id, m.competition_name, m.competition_emblem);
        return {
          ...m,
          competition_id: norm.id,
          competition_name: norm.name,
          competition_emblem: norm.emblem,
        };
      });

    const matchIds = matches.map((m: any) => m.id);
    const predCountByMatch: Record<number, number> = {};

    if (matchIds.length > 0) {
      const matchPredsRes = await client
        .from('predictions')
        .select('match_id')
        .in('match_id', matchIds);
      assertSupabaseOk(matchPredsRes.error, 'Count match predictions');
      for (const row of matchPredsRes.data || []) {
        predCountByMatch[row.match_id] = (predCountByMatch[row.match_id] || 0) + 1;
      }
    }

    let predsByMatch: Record<number, any[]> | null = null;
    if (req.user) {
      const userPredsRes = await client
        .from('predictions')
        .select('id, match_id, mode, market_type, selection, status, points_awarded')
        .eq('user_id', req.user.id);
      assertSupabaseOk(userPredsRes.error, 'Fetch user match predictions');

      predsByMatch = {};
      for (const p of userPredsRes.data || []) {
        if (!predsByMatch[p.match_id]) predsByMatch[p.match_id] = [];
        predsByMatch[p.match_id].push(p);
      }
    }

    const enrichedMatches = matches.map((m: any) => ({
      ...m,
      prediction_count: predCountByMatch[m.id] || 0,
      ...(predsByMatch ? { userPredictions: predsByMatch[m.id] || [] } : {}),
    }));

    res.json({ matches: enrichedMatches });
  } catch (err: any) {
    console.error('Fetch matches error:', err);
    return sendRouteError(res, err, 'Failed to fetch matches');
  }
});

// GET /api/matches/api-diagnostics (Admin-only technical diagnostics)
router.get('/api-diagnostics', adminAuthMiddleware, async (_req, res) => {
  try {
    const diagnostics = await RealFootballApiService.getDiagnostics();
    res.json({ diagnostics });
  } catch (err: any) {
    return sendRouteError(res, err, 'Failed to retrieve API diagnostics');
  }
});

// GET /api/matches/competitions/list - All competitions with match counts
router.get('/competitions/list', async (_req, res) => {
  try {
    const rows = await fetchAllRows<{
      competition_id: string;
      competition_name: string;
      competition_emblem: string | null;
    }>(
      (c) => c.from('matches').select('competition_id, competition_name, competition_emblem'),
      'Fetch competitions list'
    );

    const map = new Map<
      string,
      { id: string; name: string; emblem?: string | null; match_count: number }
    >();
    for (const r of rows) {
      const existing = map.get(r.competition_id);
      if (existing) {
        existing.match_count++;
        if (!existing.emblem && r.competition_emblem) {
          existing.emblem = r.competition_emblem;
        }
      } else {
        map.set(r.competition_id, {
          id: r.competition_id,
          name: r.competition_name,
          emblem: r.competition_emblem,
          match_count: 1,
        });
      }
    }

    const competitions = Array.from(map.values()).sort((a, b) => b.match_count - a.match_count);
    res.json({ competitions });
  } catch (err: any) {
    return sendRouteError(res, err, 'Failed to fetch competitions');
  }
});

// Settings: API Key status & runtime update (Admin only)
router.get('/settings/football-api-key', adminAuthMiddleware, (_req, res) => {
  res.json(FootballApiService.getApiKeyMasked());
});

router.post('/settings/football-api-key', adminAuthMiddleware, (req, res) => {
  try {
    const { apiKey } = req.body;
    FootballApiService.setApiKey(apiKey ? String(apiKey).trim() : '');
    res.json({ success: true, message: 'Football-Data.org API key updated for active server session.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// POST /api/matches/sync - Sync directly from live real football APIs into Supabase (Admin only)
router.post('/sync', adminAuthMiddleware, async (_req, res) => {
  try {
    const result = await RealFootballApiService.syncRealMatches();
    res.json(result);
  } catch (err: any) {
    console.error('Real football API sync error:', err.message);
    return sendRouteError(
      res,
      err,
      `Live Football API error: ${err.message}. No fake matches will be created.`,
      502
    );
  }
});

// GET /api/matches/:id - Single match details
router.get('/:id', optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    if (isNaN(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }

    const client = requireSupabase();
    const matchRes = await client.from('matches').select('*').eq('id', matchId).maybeSingle();
    assertSupabaseOk(matchRes.error, 'Fetch match details');

    if (!matchRes.data) {
      return res.status(404).json({ error: 'Match not found' });
    }

    let userPredictions: any[] = [];
    if (req.user) {
      const predsRes = await client
        .from('predictions')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('match_id', matchId);
      assertSupabaseOk(predsRes.error, 'Fetch user match predictions');
      userPredictions = predsRes.data || [];
    }

    res.json({ match: matchRes.data, userPredictions });
  } catch (err: any) {
    console.error('Fetch match error:', err);
    return sendRouteError(res, err, 'Failed to fetch match');
  }
});

// POST /api/matches/:id/simulate-result (Admin only)
router.post('/:id/simulate-result', adminAuthMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const { homeScore, awayScore, homeCorners = 6, awayCorners = 4 } = req.body;

    if (homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ error: 'homeScore and awayScore are required' });
    }

    const gradingResult = await FootballApiService.updateMatchResult(
      matchId,
      parseInt(homeScore, 10),
      parseInt(awayScore, 10),
      parseInt(homeCorners, 10),
      parseInt(awayCorners, 10),
      'FINISHED'
    );

    const client = requireSupabase();
    const updatedRes = await client.from('matches').select('*').eq('id', matchId).maybeSingle();
    assertSupabaseOk(updatedRes.error, 'Fetch updated simulated match');

    res.json({
      success: true,
      match: updatedRes.data,
      gradingResult,
      message: `Match finished! Score: ${homeScore}-${awayScore}. Graded ${gradingResult.graded} predictions.`,
    });
  } catch (err: any) {
    console.error('Simulate result error:', err);
    return sendRouteError(res, err, 'Failed to simulate match result');
  }
});

export default router;
