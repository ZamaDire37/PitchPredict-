import {
  requireSupabase,
  assertSupabaseOk,
  insertRowWithAutoId,
} from '../db/supabaseClient.js';
import { getMarketDefinition } from './marketRegistry.js';
import { resolveAndGradePastMatches } from './scoringEngine.js';

export interface CreatePredictionItem {
  matchId: number;
  marketType: string;
  selection: string;
}

function getTodayUtcStartIso(): string {
  const todayYmd = new Date().toISOString().split('T')[0];
  return `${todayYmd}T00:00:00.000Z`;
}

export class PredictionService {
  /**
   * Returns point value for a specific market & selection
   */
  public static getMarketOddsPoints(marketType: string, selection: string): number {
    const def = getMarketDefinition(marketType);
    if (def) {
      return def.defaultOdds(selection);
    }

    switch (marketType) {
      case 'EXACT_SCORE':
        return 30;
      case 'CORNERS_OVER_UNDER':
        return 12;
      case 'BTTS':
        return 10;
      case 'GOALS_OVER_UNDER':
        if (selection.includes('1.5')) return 8;
        if (selection.includes('2.5')) return 10;
        if (selection.includes('3.5')) return 12;
        return 10;
      case 'DOUBLE_CHANCE':
        return 6;
      case 'MATCH_WINNER':
        return selection === 'DRAW' ? 15 : 10;
      default:
        return 10;
    }
  }

  /**
   * Validate that the match exists in Supabase and has not started yet.
   */
  public static async validateMatchForPrediction(matchId: number) {
    const client = requireSupabase();
    const { data: match, error } = await client
      .from('matches')
      .select('id, utc_date, status, home_team_name, away_team_name')
      .eq('id', matchId)
      .maybeSingle();

    assertSupabaseOk(error, 'Validate match for prediction');

    if (!match) {
      throw new Error(`Match #${matchId} not found.`);
    }

    const kickoff = new Date(match.utc_date).getTime();
    const now = Date.now();

    if (kickoff <= now) {
      throw new Error(
        `Match ${match.home_team_name} vs ${match.away_team_name} has already started. Predictions are locked.`
      );
    }

    if (match.status !== 'TIMED' && match.status !== 'SCHEDULED') {
      throw new Error(
        `Match ${match.home_team_name} vs ${match.away_team_name} is no longer accepting predictions (status: ${match.status}).`
      );
    }

    return match;
  }

  /**
   * Create a single or multiple Basic Mode predictions directly in Supabase.
   * Users can place up to 10 Basic selections per UTC day.
   */
  public static async createBasicPredictions(userId: number, items: CreatePredictionItem[]) {
    if (!items || items.length === 0) {
      throw new Error('No predictions submitted');
    }

    if (items.length > 10) {
      throw new Error('In Basic Mode, users can only have 10 selections per day (limit of 10 selections).');
    }

    const client = requireSupabase();
    const todayStartIso = getTodayUtcStartIso();

    const dailyRes = await client
      .from('predictions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('mode', 'BASIC')
      .gte('created_at', todayStartIso);
    assertSupabaseOk(dailyRes.error, 'Count daily Basic predictions');
    const currentDailyCount = dailyRes.count ?? 0;

    // Fetch existing Basic predictions for these matches by this user
    const itemMatchIds = Array.from(new Set(items.map((i) => i.matchId)));
    const existingRes = await client
      .from('predictions')
      .select('id, match_id, market_type, status')
      .eq('user_id', userId)
      .eq('mode', 'BASIC')
      .in('match_id', itemMatchIds);
    assertSupabaseOk(existingRes.error, 'Check existing Basic predictions');

    const existingMap = new Map<string, { id: number; status: string }>();
    for (const row of existingRes.data || []) {
      existingMap.set(`${row.match_id}::${row.market_type}`, { id: row.id, status: row.status });
    }

    let newSelectionsCount = 0;
    for (const item of items) {
      const existing = existingMap.get(`${item.matchId}::${item.marketType}`);
      if (!existing || existing.status !== 'PENDING') {
        newSelectionsCount++;
      }
    }

    if (currentDailyCount + newSelectionsCount > 10) {
      throw new Error(
        `In Basic Mode, users can only have 10 selections per day (limit of 10 selections). You have already made ${currentDailyCount} selection(s) today and are attempting to add ${newSelectionsCount} new pick(s) (total ${currentDailyCount + newSelectionsCount} exceeds the daily limit of 10). Your daily limit resets at 00:00 UTC.`
      );
    }

    const results = [];

    for (const item of items) {
      await this.validateMatchForPrediction(item.matchId);
      const oddsPoints = this.getMarketOddsPoints(item.marketType, item.selection);
      const existing = existingMap.get(`${item.matchId}::${item.marketType}`);

      if (existing) {
        if (existing.status !== 'PENDING') {
          throw new Error(`Prediction #${existing.id} has already been graded.`);
        }

        const updRes = await client
          .from('predictions')
          .update({
            selection: item.selection,
            odds_points: oddsPoints,
            is_verified_account: true,
          })
          .eq('id', existing.id);
        assertSupabaseOk(updRes.error, 'Update Basic prediction');

        results.push({
          id: existing.id,
          updated: true,
          matchId: item.matchId,
          marketType: item.marketType,
          selection: item.selection,
          oddsPoints,
        });
      } else {
        const inserted = await insertRowWithAutoId<{ id: number }>('predictions', {
          user_id: userId,
          match_id: item.matchId,
          mode: 'BASIC',
          serious_set_id: null,
          market_type: item.marketType,
          selection: item.selection,
          odds_points: oddsPoints,
          status: 'PENDING',
          points_awarded: 0,
          is_verified_account: true,
          created_at: new Date().toISOString(),
        }, 'id');

        existingMap.set(`${item.matchId}::${item.marketType}`, { id: inserted.id, status: 'PENDING' });
        results.push({
          id: inserted.id,
          updated: false,
          matchId: item.matchId,
          marketType: item.marketType,
          selection: item.selection,
          oddsPoints,
        });
      }
    }

    return results;
  }

  /**
   * Create a Serious Mode Set (grouped predictions) directly in Supabase.
   */
  public static async createSeriousSet(userId: number, setName: string, items: CreatePredictionItem[]) {
    if (!items || items.length < 1) {
      throw new Error('Serious Mode sets require at least 1 prediction. You can add as many selections as you want!');
    }

    const trimmedName = setName?.trim() || `Serious Set (${items.length} picks)`;

    let totalPotentialPoints = 0;
    const validatedItems: Array<{ matchId: number; marketType: string; selection: string; oddsPoints: number }> = [];

    for (const item of items) {
      await this.validateMatchForPrediction(item.matchId);
      const oddsPoints = this.getMarketOddsPoints(item.marketType, item.selection);
      totalPotentialPoints += oddsPoints;
      validatedItems.push({
        matchId: item.matchId,
        marketType: item.marketType,
        selection: item.selection,
        oddsPoints,
      });
    }

    const nowIso = new Date().toISOString();
    const createdSet = await insertRowWithAutoId<{ id: number }>(
      'serious_sets',
      {
        user_id: userId,
        name: trimmedName,
        status: 'PENDING',
        potential_points: totalPotentialPoints,
        points_delta: 0,
        total_predictions: validatedItems.length,
        correct_predictions: 0,
        incorrect_predictions: 0,
        created_at: nowIso,
      },
      'id'
    );

    const setId = createdSet.id;

    for (const val of validatedItems) {
      await insertRowWithAutoId(
        'predictions',
        {
          user_id: userId,
          match_id: val.matchId,
          mode: 'SERIOUS',
          serious_set_id: setId,
          market_type: val.marketType,
          selection: val.selection,
          odds_points: val.oddsPoints,
          status: 'PENDING',
          points_awarded: 0,
          is_verified_account: true,
          created_at: nowIso,
        },
        'id'
      );
    }

    return {
      setId,
      setName: trimmedName,
      potentialPoints: totalPotentialPoints,
      predictionsCount: validatedItems.length,
    };
  }

  /**
   * Helper to enrich raw prediction rows with flat match & serious_set fields expected by UI
   */
  private static async enrichPredictionRows(
    preds: any[],
    options: { includeUsers?: boolean } = {}
  ): Promise<any[]> {
    if (preds.length === 0) return [];
    const client = requireSupabase();

    const matchIds = Array.from(new Set(preds.map((p) => p.match_id).filter(Boolean)));
    const setIds = Array.from(new Set(preds.map((p) => p.serious_set_id).filter(Boolean)));
    const userIds = options.includeUsers
      ? Array.from(new Set(preds.map((p) => p.user_id).filter(Boolean)))
      : [];

    const [matchesRes, setsRes, usersRes] = await Promise.all([
      matchIds.length > 0
        ? client.from('matches').select('*').in('id', matchIds)
        : Promise.resolve({ data: [], error: null }),
      setIds.length > 0
        ? client.from('serious_sets').select('id, name, status, points_delta').in('id', setIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length > 0
        ? client
            .from('users')
            .select('id, username, basic_points, serious_points, basic_streak, serious_streak')
            .in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    assertSupabaseOk(matchesRes.error, 'Fetch matches for predictions');
    assertSupabaseOk(setsRes.error, 'Fetch serious sets for predictions');
    assertSupabaseOk(usersRes.error, 'Fetch users for predictions');

    const matchMap = new Map<number, any>((matchesRes.data || []).map((m: any) => [m.id, m]));
    const setMap = new Map<number, any>((setsRes.data || []).map((s: any) => [s.id, s]));
    const userMap = new Map<number, any>((usersRes.data || []).map((u: any) => [u.id, u]));

    return preds
      .map((p) => {
        const m = matchMap.get(p.match_id);
        if (!m) return null;
        const s = p.serious_set_id ? setMap.get(p.serious_set_id) : null;
        const u = options.includeUsers ? userMap.get(p.user_id) : null;

        return {
          ...p,
          ...(u
            ? {
                username: u.username,
                basic_points: u.basic_points,
                serious_points: u.serious_points,
                basic_streak: u.basic_streak,
                serious_streak: u.serious_streak,
              }
            : {}),
          home_team_name: m.home_team_name,
          home_team_short: m.home_team_short,
          home_team_crest: m.home_team_crest,
          away_team_name: m.away_team_name,
          away_team_short: m.away_team_short,
          away_team_crest: m.away_team_crest,
          competition_name: m.competition_name,
          competition_emblem: m.competition_emblem,
          match_date: m.utc_date,
          match_status: m.status,
          home_score: m.home_score,
          away_score: m.away_score,
          home_corners: m.home_corners,
          away_corners: m.away_corners,
          set_name: s?.name ?? null,
          set_status: s?.status ?? null,
          set_points_delta: s?.points_delta ?? null,
        };
      })
      .filter(Boolean);
  }

  /**
   * Get all predictions for a user, optionally filtered by mode and status
   */
  public static async getUserPredictions(userId: number, mode?: 'BASIC' | 'SERIOUS', status?: string) {
    await resolveAndGradePastMatches();
    const client = requireSupabase();

    let query = client.from('predictions').select('*').eq('user_id', userId);

    if (mode) {
      query = query.eq('mode', mode);
    }

    if (status === 'DONE' || status === 'COMPLETED') {
      query = query.in('status', ['CORRECT', 'INCORRECT']);
    } else if (status === 'PENDING') {
      query = query.eq('status', 'PENDING');
    } else if (status === 'CORRECT' || status === 'INCORRECT') {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    assertSupabaseOk(error, 'Fetch user predictions');

    let enriched = await this.enrichPredictionRows(data || []);
    if (status === 'DONE' || status === 'COMPLETED') {
      enriched = enriched.filter((p) => p.match_status === 'FINISHED');
    }

    enriched.sort((a, b) => {
      const ta = new Date(a.resolved_at || a.created_at || 0).getTime();
      const tb = new Date(b.resolved_at || b.created_at || 0).getTime();
      return tb - ta;
    });

    return enriched;
  }

  /**
   * Get all Serious Sets for a user with their nested predictions
   */
  public static async getUserSeriousSets(userId: number) {
    await resolveAndGradePastMatches();
    const client = requireSupabase();

    const setsRes = await client
      .from('serious_sets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    assertSupabaseOk(setsRes.error, 'Fetch user serious sets');

    const sets = setsRes.data || [];
    const setIds = sets.map((s) => s.id);
    if (setIds.length === 0) return [];

    const predsRes = await client
      .from('predictions')
      .select('*')
      .in('serious_set_id', setIds)
      .order('id', { ascending: true });
    assertSupabaseOk(predsRes.error, 'Fetch serious set items');

    const enrichedPreds = await this.enrichPredictionRows(predsRes.data || []);

    const predsBySet: Record<number, any[]> = {};
    for (const p of enrichedPreds) {
      if (!predsBySet[p.serious_set_id]) predsBySet[p.serious_set_id] = [];
      predsBySet[p.serious_set_id].push(p);
    }

    return sets.map((s) => ({
      ...s,
      predictions: predsBySet[s.id] || [],
    }));
  }

  /**
   * Get full public profile and past predictions for a specific user.
   */
  public static async getUserProfile(userId: number) {
    await resolveAndGradePastMatches();
    const client = requireSupabase();

    const userRes = await client
      .from('users')
      .select(
        'id, username, basic_points, serious_points, basic_streak, basic_best_streak, serious_streak, serious_best_streak, created_at'
      )
      .eq('id', userId)
      .maybeSingle();
    assertSupabaseOk(userRes.error, 'Fetch user profile');

    const user = userRes.data;
    if (!user) {
      throw new Error(`User #${userId} not found`);
    }

    const [predictions, allSeriousSets, higherBasicRes, higherSeriousRes] = await Promise.all([
      this.getUserPredictions(userId, undefined, 'DONE'),
      this.getUserSeriousSets(userId),
      client
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gt('basic_points', user.basic_points),
      client
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gt('serious_points', user.serious_points),
    ]);

    assertSupabaseOk(higherBasicRes.error, 'Compute Basic rank');
    assertSupabaseOk(higherSeriousRes.error, 'Compute Serious rank');

    const seriousSets = allSeriousSets.filter(
      (s: any) => s.status === 'WON' || s.status === 'LOST'
    );

    const correctCount = predictions.filter((p: any) => p.status === 'CORRECT').length;
    const incorrectCount = predictions.filter((p: any) => p.status === 'INCORRECT').length;
    const totalResolved = correctCount + incorrectCount;
    const winRate = totalResolved > 0 ? Math.round((correctCount / totalResolved) * 100) : 0;

    const wonSets = seriousSets.filter((s: any) => s.status === 'WON').length;
    const lostSets = seriousSets.filter((s: any) => s.status === 'LOST').length;

    return {
      user: {
        ...user,
        basicRank: (higherBasicRes.count ?? 0) + 1,
        seriousRank: (higherSeriousRes.count ?? 0) + 1,
      },
      stats: {
        totalPredictions: predictions.length,
        correctCount,
        incorrectCount,
        pendingCount: 0,
        winRate,
        totalSets: seriousSets.length,
        wonSets,
        lostSets,
      },
      predictions,
      seriousSets,
    };
  }

  /**
   * Get community feed of other users' completed predictions across finished matches.
   */
  public static async getCommunityPredictions(
    mode?: 'BASIC' | 'SERIOUS',
    status?: string,
    limit: number = 60
  ) {
    await resolveAndGradePastMatches();
    const client = requireSupabase();

    let query = client.from('predictions').select('*');

    if (status === 'CORRECT' || status === 'INCORRECT') {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['CORRECT', 'INCORRECT']);
    }

    if (mode) {
      query = query.eq('mode', mode);
    }

    const { data, error } = await query
      .order('resolved_at', { ascending: false })
      .limit(Math.max(limit * 2, 120));
    assertSupabaseOk(error, 'Fetch community predictions');

    const enriched = await this.enrichPredictionRows(data || [], { includeUsers: true });
    return enriched
      .filter((p) => p.match_status === 'FINISHED' && Boolean(p.username))
      .sort((a, b) => {
        const ta = new Date(a.resolved_at || a.match_date || 0).getTime();
        const tb = new Date(b.resolved_at || b.match_date || 0).getTime();
        return tb - ta;
      })
      .slice(0, limit);
  }

  /**
   * Get all completed predictions made on a specific finished match.
   */
  public static async getMatchCommunityPredictions(matchId: number) {
    const client = requireSupabase();

    const { data, error } = await client
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)
      .in('status', ['CORRECT', 'INCORRECT'])
      .order('resolved_at', { ascending: false });
    assertSupabaseOk(error, 'Fetch match community predictions');

    const enriched = await this.enrichPredictionRows(data || [], { includeUsers: true });
    return enriched.filter((p) => p.match_status === 'FINISHED' && Boolean(p.username));
  }
}
