import { Router } from 'express';
import {
  fetchAllRows,
  sendRouteError,
} from '../db/supabaseClient.js';
import { resolveAndGradePastMatches } from '../services/scoringEngine.js';

const router = Router();

// GET /api/leaderboard/basic - Leaderboard for Basic Mode directly from Supabase
router.get('/basic', async (req, res) => {
  try {
    await resolveAndGradePastMatches();
    const section = (req.query.section as string) || 'points';
    const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgoMs = Date.parse(sevenDaysAgoIso);

    const [users, basicPreds, basicHistory] = await Promise.all([
      fetchAllRows<{
        id: number;
        username: string;
        basic_points: number;
        basic_streak: number;
        basic_best_streak: number;
      }>(
        (c) => c.from('users').select('id, username, basic_points, basic_streak, basic_best_streak'),
        'Fetch users for Basic leaderboard'
      ),
      fetchAllRows<{
        user_id: number;
        status: string;
        points_awarded: number;
        created_at: string | null;
        resolved_at: string | null;
      }>(
        (c) =>
          c
            .from('predictions')
            .select('user_id, status, points_awarded, created_at, resolved_at')
            .eq('mode', 'BASIC'),
        'Fetch Basic predictions for leaderboard'
      ),
      fetchAllRows<{
        user_id: number;
        delta: number;
        created_at: string;
      }>(
        (c) =>
          c
            .from('points_history')
            .select('user_id, delta, created_at')
            .eq('mode', 'BASIC')
            .gt('delta', 0)
            .gte('created_at', sevenDaysAgoIso),
        'Fetch weekly Basic points history'
      ),
    ]);

    const predStats = new Map<
      number,
      { correct: number; incorrect: number; pending: number; weeklyPredsPoints: number }
    >();
    for (const p of basicPreds) {
      let st = predStats.get(p.user_id);
      if (!st) {
        st = { correct: 0, incorrect: 0, pending: 0, weeklyPredsPoints: 0 };
        predStats.set(p.user_id, st);
      }
      if (p.status === 'CORRECT') {
        st.correct++;
        const resolvedMs = p.resolved_at ? Date.parse(p.resolved_at) : 0;
        const createdMs = p.created_at ? Date.parse(p.created_at) : 0;
        if (resolvedMs >= sevenDaysAgoMs || createdMs >= sevenDaysAgoMs) {
          st.weeklyPredsPoints += p.points_awarded || 0;
        }
      } else if (p.status === 'INCORRECT') {
        st.incorrect++;
      } else if (p.status === 'PENDING') {
        st.pending++;
      }
    }

    const weeklyHistByUser = new Map<number, number>();
    for (const h of basicHistory) {
      weeklyHistByUser.set(h.user_id, (weeklyHistByUser.get(h.user_id) || 0) + (h.delta || 0));
    }

    const enriched = users.map((u) => {
      const st = predStats.get(u.id);
      const correct = st?.correct || 0;
      const incorrect = st?.incorrect || 0;
      const pendingCount = st?.pending || 0;
      const totalGraded = correct + incorrect;
      const accuracy = totalGraded > 0 ? Math.round((correct / totalGraded) * 100) : 0;
      const streak = u.basic_streak || 0;
      const bestStreak = u.basic_best_streak || 0;
      const weeklyPoints = Math.max(
        weeklyHistByUser.get(u.id) || 0,
        st?.weeklyPredsPoints || 0
      );

      let streakTier: 'BLAZING' | 'HOT' | 'WARMING' | 'COLD' = 'COLD';
      if (streak >= 5) streakTier = 'BLAZING';
      else if (streak >= 3) streakTier = 'HOT';
      else if (streak >= 1) streakTier = 'WARMING';

      return {
        id: u.id,
        username: u.username,
        points: u.basic_points,
        weekly_points: weeklyPoints,
        streak,
        best_streak: bestStreak,
        correct_count: correct,
        incorrect_count: incorrect,
        pending_count: pendingCount,
        total_graded: totalGraded,
        accuracy,
        is_on_fire: streak >= 2,
        streak_tier: streakTier,
        basic_points: u.basic_points,
        basic_streak: streak,
        basic_best_streak: bestStreak,
      };
    });

    const topWeekly =
      enriched.slice().sort((a, b) => b.weekly_points - a.weekly_points || b.points - a.points)[0] ||
      null;
    const topPoints = enriched.slice().sort((a, b) => b.points - a.points)[0] || null;
    const hottestStreak =
      enriched
        .slice()
        .sort((a, b) => b.streak - a.streak || b.best_streak - a.best_streak || b.points - a.points)[0] ||
      null;
    const bestStreakRecord =
      enriched.slice().sort((a, b) => b.best_streak - a.best_streak || b.streak - a.streak)[0] ||
      null;
    const highestAccuracy =
      enriched
        .filter((u) => u.total_graded >= 1)
        .sort((a, b) => b.accuracy - a.accuracy || b.correct_count - a.correct_count || b.points - a.points)[0] ||
      null;
    const mostWins =
      enriched.slice().sort((a, b) => b.correct_count - a.correct_count || b.points - a.points)[0] ||
      null;

    const hotStreakers = enriched
      .filter((u) => u.streak > 0)
      .sort((a, b) => b.streak - a.streak || b.best_streak - a.best_streak || b.points - a.points)
      .slice(0, 6);

    const sorted = enriched.slice();
    if (section === 'weekly') {
      sorted.sort(
        (a, b) =>
          b.weekly_points - a.weekly_points || b.points - a.points || b.accuracy - a.accuracy
      );
    } else if (section === 'streak') {
      sorted.sort(
        (a, b) =>
          b.streak - a.streak ||
          b.best_streak - a.best_streak ||
          b.points - a.points ||
          b.accuracy - a.accuracy
      );
    } else if (section === 'accuracy') {
      sorted.sort(
        (a, b) =>
          b.accuracy - a.accuracy || b.correct_count - a.correct_count || b.points - a.points
      );
    } else if (section === 'wins') {
      sorted.sort(
        (a, b) =>
          b.correct_count - a.correct_count || b.points - a.points || b.accuracy - a.accuracy
      );
    } else {
      sorted.sort(
        (a, b) =>
          b.points - a.points || b.weekly_points - a.weekly_points || b.streak - a.streak
      );
    }

    const leaderboard = sorted.slice(0, 50).map((u, idx) => ({
      rank: idx + 1,
      ...u,
    }));

    res.json({
      mode: 'BASIC',
      section,
      leaderboard,
      spotlights: {
        topWeekly,
        topPoints,
        hottestStreak,
        bestStreakRecord,
        highestAccuracy,
        mostWins,
      },
      hotStreakers,
    });
  } catch (err: any) {
    console.error('Basic leaderboard error:', err);
    return sendRouteError(res, err, 'Failed to retrieve basic leaderboard');
  }
});

// GET /api/leaderboard/serious - Leaderboard for Serious Mode directly from Supabase
router.get('/serious', async (req, res) => {
  try {
    await resolveAndGradePastMatches();
    const section = (req.query.section as string) || 'points';
    const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgoMs = Date.parse(sevenDaysAgoIso);

    const [users, seriousSets, seriousHistory] = await Promise.all([
      fetchAllRows<{
        id: number;
        username: string;
        serious_points: number;
        serious_streak: number;
        serious_best_streak: number;
      }>(
        (c) =>
          c
            .from('users')
            .select('id, username, serious_points, serious_streak, serious_best_streak'),
        'Fetch users for Serious leaderboard'
      ),
      fetchAllRows<{
        user_id: number;
        status: string;
        potential_points: number;
        created_at: string | null;
        resolved_at: string | null;
      }>(
        (c) =>
          c
            .from('serious_sets')
            .select('user_id, status, potential_points, created_at, resolved_at'),
        'Fetch Serious sets for leaderboard'
      ),
      fetchAllRows<{
        user_id: number;
        delta: number;
        created_at: string;
      }>(
        (c) =>
          c
            .from('points_history')
            .select('user_id, delta, created_at')
            .eq('mode', 'SERIOUS')
            .gt('delta', 0)
            .gte('created_at', sevenDaysAgoIso),
        'Fetch weekly Serious points history'
      ),
    ]);

    const setStats = new Map<
      number,
      { won: number; lost: number; pending: number; weeklySetsPoints: number }
    >();
    for (const s of seriousSets) {
      let st = setStats.get(s.user_id);
      if (!st) {
        st = { won: 0, lost: 0, pending: 0, weeklySetsPoints: 0 };
        setStats.set(s.user_id, st);
      }
      if (s.status === 'WON') {
        st.won++;
        const resolvedMs = s.resolved_at ? Date.parse(s.resolved_at) : 0;
        const createdMs = s.created_at ? Date.parse(s.created_at) : 0;
        if (resolvedMs >= sevenDaysAgoMs || createdMs >= sevenDaysAgoMs) {
          st.weeklySetsPoints += s.potential_points || 0;
        }
      } else if (s.status === 'LOST') {
        st.lost++;
      } else if (s.status === 'PENDING') {
        st.pending++;
      }
    }

    const weeklyHistByUser = new Map<number, number>();
    for (const h of seriousHistory) {
      weeklyHistByUser.set(h.user_id, (weeklyHistByUser.get(h.user_id) || 0) + (h.delta || 0));
    }

    const enriched = users.map((u) => {
      const st = setStats.get(u.id);
      const won = st?.won || 0;
      const lost = st?.lost || 0;
      const pendingSets = st?.pending || 0;
      const totalSets = won + lost;
      const accuracy = totalSets > 0 ? Math.round((won / totalSets) * 100) : 0;
      const streak = u.serious_streak || 0;
      const bestStreak = u.serious_best_streak || 0;
      const weeklyPoints = Math.max(
        weeklyHistByUser.get(u.id) || 0,
        st?.weeklySetsPoints || 0
      );

      let streakTier: 'BLAZING' | 'HOT' | 'WARMING' | 'COLD' = 'COLD';
      if (streak >= 5) streakTier = 'BLAZING';
      else if (streak >= 3) streakTier = 'HOT';
      else if (streak >= 1) streakTier = 'WARMING';

      return {
        id: u.id,
        username: u.username,
        points: u.serious_points,
        weekly_points: weeklyPoints,
        streak,
        best_streak: bestStreak,
        won_sets: won,
        lost_sets: lost,
        pending_sets: pendingSets,
        total_sets: totalSets,
        accuracy,
        is_on_fire: streak >= 2,
        streak_tier: streakTier,
        serious_points: u.serious_points,
        serious_streak: streak,
        serious_best_streak: bestStreak,
      };
    });

    const topWeekly =
      enriched.slice().sort((a, b) => b.weekly_points - a.weekly_points || b.points - a.points)[0] ||
      null;
    const topPoints = enriched.slice().sort((a, b) => b.points - a.points)[0] || null;
    const hottestStreak =
      enriched
        .slice()
        .sort((a, b) => b.streak - a.streak || b.best_streak - a.best_streak || b.points - a.points)[0] ||
      null;
    const bestStreakRecord =
      enriched.slice().sort((a, b) => b.best_streak - a.best_streak || b.streak - a.streak)[0] ||
      null;
    const highestAccuracy =
      enriched
        .filter((u) => u.total_sets >= 1)
        .sort((a, b) => b.accuracy - a.accuracy || b.won_sets - a.won_sets || b.points - a.points)[0] ||
      null;
    const mostWins =
      enriched.slice().sort((a, b) => b.won_sets - a.won_sets || b.points - a.points)[0] || null;

    const hotStreakers = enriched
      .filter((u) => u.streak > 0)
      .sort((a, b) => b.streak - a.streak || b.best_streak - a.best_streak || b.points - a.points)
      .slice(0, 6);

    const sorted = enriched.slice();
    if (section === 'weekly') {
      sorted.sort(
        (a, b) =>
          b.weekly_points - a.weekly_points || b.points - a.points || b.accuracy - a.accuracy
      );
    } else if (section === 'streak') {
      sorted.sort(
        (a, b) =>
          b.streak - a.streak ||
          b.best_streak - a.best_streak ||
          b.points - a.points ||
          b.accuracy - a.accuracy
      );
    } else if (section === 'accuracy') {
      sorted.sort(
        (a, b) => b.accuracy - a.accuracy || b.won_sets - a.won_sets || b.points - a.points
      );
    } else if (section === 'wins') {
      sorted.sort(
        (a, b) => b.won_sets - a.won_sets || b.points - a.points || b.accuracy - a.accuracy
      );
    } else {
      sorted.sort(
        (a, b) =>
          b.points - a.points || b.weekly_points - a.weekly_points || b.streak - a.streak
      );
    }

    const leaderboard = sorted.slice(0, 50).map((u, idx) => ({
      rank: idx + 1,
      ...u,
    }));

    res.json({
      mode: 'SERIOUS',
      section,
      leaderboard,
      spotlights: {
        topWeekly,
        topPoints,
        hottestStreak,
        bestStreakRecord,
        highestAccuracy,
        mostWins,
      },
      hotStreakers,
    });
  } catch (err: any) {
    console.error('Serious leaderboard error:', err);
    return sendRouteError(res, err, 'Failed to retrieve serious leaderboard');
  }
});

export default router;
