import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  requireSupabase,
  assertSupabaseOk,
  sendRouteError,
} from '../db/supabaseClient.js';

const router = Router();

// GET /api/history/ledger - full audit trail of points transactions from Supabase
router.get('/ledger', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { mode, limit = 50 } = req.query;
    const client = requireSupabase();
    const rowLimit = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 250);

    let query = client.from('points_history').select('*').eq('user_id', req.user!.id);
    if (mode && (mode === 'BASIC' || mode === 'SERIOUS')) {
      query = query.eq('mode', mode);
    }

    const { data: rows, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(rowLimit);
    assertSupabaseOk(error, 'Fetch points ledger');

    const entries = rows || [];
    const predIds = Array.from(new Set(entries.map((e) => e.prediction_id).filter(Boolean)));
    const setIds = Array.from(new Set(entries.map((e) => e.serious_set_id).filter(Boolean)));

    const [predsRes, setsRes] = await Promise.all([
      predIds.length > 0
        ? client.from('predictions').select('id, market_type, selection, actual_result').in('id', predIds)
        : Promise.resolve({ data: [], error: null }),
      setIds.length > 0
        ? client.from('serious_sets').select('id, name').in('id', setIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    assertSupabaseOk(predsRes.error, 'Fetch ledger prediction details');
    assertSupabaseOk(setsRes.error, 'Fetch ledger set details');

    const predMap = new Map<number, any>((predsRes.data || []).map((p: any) => [p.id, p]));
    const setMap = new Map<number, any>((setsRes.data || []).map((s: any) => [s.id, s]));

    const history = entries.map((ph: any) => {
      const p = ph.prediction_id ? predMap.get(ph.prediction_id) : null;
      const s = ph.serious_set_id ? setMap.get(ph.serious_set_id) : null;
      return {
        ...ph,
        market_type: p?.market_type ?? null,
        selection: p?.selection ?? null,
        actual_result: p?.actual_result ?? null,
        set_name: s?.name ?? null,
      };
    });

    res.json({ history });
  } catch (err: any) {
    console.error('Points ledger error:', err);
    return sendRouteError(res, err, 'Failed to retrieve points history');
  }
});

// GET /api/history/progression - time-series points balance for charts
router.get('/progression', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const client = requireSupabase();

    const [basicRes, seriousRes] = await Promise.all([
      client
        .from('points_history')
        .select('id, delta, balance_after, created_at, reason')
        .eq('user_id', userId)
        .eq('mode', 'BASIC')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true }),
      client
        .from('points_history')
        .select('id, delta, balance_after, created_at, reason')
        .eq('user_id', userId)
        .eq('mode', 'SERIOUS')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true }),
    ]);

    assertSupabaseOk(basicRes.error, 'Fetch Basic progression');
    assertSupabaseOk(seriousRes.error, 'Fetch Serious progression');

    res.json({
      basicProgression: basicRes.data || [],
      seriousProgression: seriousRes.data || [],
    });
  } catch (err: any) {
    console.error('Progression error:', err);
    return sendRouteError(res, err, 'Failed to retrieve progression data');
  }
});

// GET /api/history/stats - user prediction statistics for both modes
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const client = requireSupabase();

    const [userRes, basicPredsRes, seriousSetsRes] = await Promise.all([
      client
        .from('users')
        .select(
          'basic_points, serious_points, basic_streak, basic_best_streak, serious_streak, serious_best_streak'
        )
        .eq('id', userId)
        .maybeSingle(),
      client
        .from('predictions')
        .select('status')
        .eq('user_id', userId)
        .eq('mode', 'BASIC'),
      client
        .from('serious_sets')
        .select('status')
        .eq('user_id', userId),
    ]);

    assertSupabaseOk(userRes.error, 'Fetch user stats');
    assertSupabaseOk(basicPredsRes.error, 'Fetch Basic stats');
    assertSupabaseOk(seriousSetsRes.error, 'Fetch Serious stats');

    const user = userRes.data;
    const basicPreds = basicPredsRes.data || [];
    const seriousSets = seriousSetsRes.data || [];

    const basicTotal = basicPreds.length;
    const basicCorrect = basicPreds.filter((p) => p.status === 'CORRECT').length;
    const basicIncorrect = basicPreds.filter((p) => p.status === 'INCORRECT').length;
    const basicPending = basicPreds.filter((p) => p.status === 'PENDING').length;

    const totalSets = seriousSets.length;
    const wonSets = seriousSets.filter((s) => s.status === 'WON').length;
    const lostSets = seriousSets.filter((s) => s.status === 'LOST').length;
    const pendingSets = seriousSets.filter((s) => s.status === 'PENDING').length;

    res.json({
      user,
      basic: {
        points: user?.basic_points ?? 0,
        streak: user?.basic_streak ?? 0,
        bestStreak: user?.basic_best_streak ?? 0,
        total: basicTotal,
        correct: basicCorrect,
        incorrect: basicIncorrect,
        pending: basicPending,
        winRate:
          basicCorrect + basicIncorrect > 0
            ? Math.round((basicCorrect / (basicCorrect + basicIncorrect)) * 100)
            : 0,
      },
      serious: {
        points: user?.serious_points ?? 0,
        streak: user?.serious_streak ?? 0,
        bestStreak: user?.serious_best_streak ?? 0,
        totalSets,
        wonSets,
        lostSets,
        pendingSets,
        winRate:
          wonSets + lostSets > 0 ? Math.round((wonSets / (wonSets + lostSets)) * 100) : 0,
      },
    });
  } catch (err: any) {
    console.error('History stats error:', err);
    return sendRouteError(res, err, 'Failed to retrieve stats');
  }
});

export default router;
