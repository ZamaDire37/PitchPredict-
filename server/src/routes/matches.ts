import { Router } from 'express';
import { queryAll, queryOne } from '../db/database.js';
import { FootballApiService } from '../services/footballApi.js';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/matches
router.get('/', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { filter = 'upcoming', competition, date } = req.query;
    const nowIso = new Date().toISOString();

    let sql = `
      SELECT m.*,
             (SELECT COUNT(*) FROM predictions p WHERE p.match_id = m.id) as prediction_count
      FROM matches m
      WHERE 1=1
    `;
    const params: any[] = [];

    if (competition && competition !== 'ALL') {
      sql += ' AND m.competition_id = ?';
      params.push(competition);
    }

    if (date) {
      sql += ' AND date(m.utc_date) = date(?)';
      params.push(date);
    } else if (filter === 'today') {
      sql += ' AND date(m.utc_date) = date(?)';
      params.push(nowIso);
    } else if (filter === 'upcoming') {
      sql += " AND m.status IN ('TIMED', 'SCHEDULED', 'IN_PLAY')";
    } else if (filter === 'finished') {
      sql += " AND m.status = 'FINISHED'";
    }

    sql += ' ORDER BY m.utc_date ASC';

    const matches = queryAll(sql, params);

    // If user is authenticated, attach user's predictions for each match
    if (req.user) {
      const userPreds = queryAll<{ match_id: number; id: number; mode: string; market_type: string; selection: string; status: string; points_awarded: number }>(
        'SELECT id, match_id, mode, market_type, selection, status, points_awarded FROM predictions WHERE user_id = ?',
        [req.user.id]
      );
      const predsByMatch: Record<number, any[]> = {};
      for (const p of userPreds) {
        if (!predsByMatch[p.match_id]) predsByMatch[p.match_id] = [];
        predsByMatch[p.match_id].push(p);
      }

      const matchesWithUserPreds = matches.map((m) => ({
        ...m,
        userPredictions: predsByMatch[m.id] || [],
      }));

      return res.json({ matches: matchesWithUserPreds });
    }

    res.json({ matches });
  } catch (err: any) {
    console.error('Fetch matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/matches/:id
router.get('/:id', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const match = queryOne('SELECT * FROM matches WHERE id = ?', [matchId]);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    let userPredictions = [];
    if (req.user) {
      userPredictions = queryAll(
        'SELECT * FROM predictions WHERE user_id = ? AND match_id = ?',
        [req.user.id, matchId]
      );
    }

    res.json({ match, userPredictions });
  } catch (err: any) {
    console.error('Fetch match error:', err);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// POST /api/matches/sync
router.post('/sync', async (req, res) => {
  try {
    const result = await FootballApiService.syncFromApi();
    res.json(result);
  } catch (err: any) {
    console.error('Manual sync error:', err);
    res.status(500).json({ error: 'Failed to sync football data' });
  }
});

// POST /api/matches/:id/simulate-result (for testing & interactive grading demo)
router.post('/:id/simulate-result', (req, res) => {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const { homeScore, awayScore, homeCorners = 6, awayCorners = 4 } = req.body;

    if (homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ error: 'homeScore and awayScore are required' });
    }

    const gradingResult = FootballApiService.updateMatchResult(
      matchId,
      parseInt(homeScore, 10),
      parseInt(awayScore, 10),
      parseInt(homeCorners, 10),
      parseInt(awayCorners, 10),
      'FINISHED'
    );

    const updatedMatch = queryOne('SELECT * FROM matches WHERE id = ?', [matchId]);

    res.json({
      success: true,
      match: updatedMatch,
      gradingResult,
      message: `Match finished! Score: ${homeScore}-${awayScore}. Graded ${gradingResult.graded} predictions.`,
    });
  } catch (err: any) {
    console.error('Simulate result error:', err);
    res.status(500).json({ error: 'Failed to simulate match result' });
  }
});

// GET /api/competitions
router.get('/competitions/list', (req, res) => {
  try {
    const comps = queryAll(`
      SELECT competition_id as id,
             competition_name as name,
             competition_emblem as emblem,
             COUNT(*) as match_count
      FROM matches
      GROUP BY competition_id
      ORDER BY match_count DESC
    `);
    res.json({ competitions: comps });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// Settings: API Key management
router.get('/settings/football-api-key', (req, res) => {
  const setting = queryOne<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'FOOTBALL_DATA_API_KEY'"
  );
  const hasKey = Boolean(setting?.value);
  res.json({
    configured: hasKey,
    maskedKey: hasKey ? `${setting!.value.slice(0, 4)}...${setting!.value.slice(-4)}` : null,
  });
});

router.post('/settings/football-api-key', (req, res) => {
  try {
    const { apiKey } = req.body;
    FootballApiService.setApiKey(apiKey ? apiKey.trim() : '');
    res.json({ success: true, message: 'Football-Data.org API key updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

export default router;
