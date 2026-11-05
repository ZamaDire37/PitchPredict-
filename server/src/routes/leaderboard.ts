import { Router } from 'express';
import { queryAll } from '../db/database.js';

const router = Router();

// GET /api/leaderboard/basic - Leaderboard for Basic Mode with Section Filtering, Weekly Ranking & Streaks
router.get('/basic', (req, res) => {
  try {
    const section = (req.query.section as string) || 'points';

    const rawLeaders = queryAll<{
      id: number;
      username: string;
      basic_points: number;
      basic_streak: number;
      basic_best_streak: number;
      correct_count: number;
      incorrect_count: number;
      pending_count: number;
      weekly_history_points: number;
      weekly_preds_points: number;
    }>(`
      SELECT u.id, u.username, u.basic_points, u.basic_streak, u.basic_best_streak,
             (SELECT COUNT(*) FROM predictions p WHERE p.user_id = u.id AND p.mode = 'BASIC' AND p.status = 'CORRECT') as correct_count,
             (SELECT COUNT(*) FROM predictions p WHERE p.user_id = u.id AND p.mode = 'BASIC' AND p.status = 'INCORRECT') as incorrect_count,
             (SELECT COUNT(*) FROM predictions p WHERE p.user_id = u.id AND p.mode = 'BASIC' AND p.status = 'PENDING') as pending_count,
             (SELECT COALESCE(SUM(delta), 0) FROM points_history ph WHERE ph.user_id = u.id AND ph.mode = 'BASIC' AND ph.delta > 0 AND ph.created_at >= datetime('now', '-7 days')) as weekly_history_points,
             (SELECT COALESCE(SUM(points_awarded), 0) FROM predictions pr WHERE pr.user_id = u.id AND pr.mode = 'BASIC' AND pr.status = 'CORRECT' AND (pr.resolved_at >= datetime('now', '-7 days') OR pr.created_at >= datetime('now', '-7 days'))) as weekly_preds_points
      FROM users u
    `);

    const enriched = rawLeaders.map((u) => {
      const correct = u.correct_count || 0;
      const incorrect = u.incorrect_count || 0;
      const totalGraded = correct + incorrect;
      const accuracy = totalGraded > 0 ? Math.round((correct / totalGraded) * 100) : 0;
      const streak = u.basic_streak || 0;
      const bestStreak = u.basic_best_streak || 0;
      const weeklyPoints = Math.max(u.weekly_history_points || 0, u.weekly_preds_points || 0);

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
        pending_count: u.pending_count || 0,
        total_graded: totalGraded,
        accuracy,
        is_on_fire: streak >= 2,
        streak_tier: streakTier,
        basic_points: u.basic_points,
        basic_streak: streak,
        basic_best_streak: bestStreak,
      };
    });

    // Compute Hall of Fame Spotlights
    const topWeekly = enriched.slice().sort((a, b) => b.weekly_points - a.weekly_points || b.points - a.points)[0] || null;
    const topPoints = enriched.slice().sort((a, b) => b.points - a.points)[0] || null;
    const hottestStreak =
      enriched.slice().sort((a, b) => b.streak - a.streak || b.best_streak - a.best_streak || b.points - a.points)[0] || null;
    const bestStreakRecord =
      enriched.slice().sort((a, b) => b.best_streak - a.best_streak || b.streak - a.streak)[0] || null;
    const highestAccuracy =
      enriched
        .filter((u) => u.total_graded >= 1)
        .sort((a, b) => b.accuracy - a.accuracy || b.correct_count - a.correct_count || b.points - a.points)[0] || null;
    const mostWins =
      enriched.slice().sort((a, b) => b.correct_count - a.correct_count || b.points - a.points)[0] || null;

    // Hottest active streak showcase list (users currently on a streak)
    const hotStreakers = enriched
      .filter((u) => u.streak > 0)
      .sort((a, b) => b.streak - a.streak || b.best_streak - a.best_streak || b.points - a.points)
      .slice(0, 6);

    // Sort according to section
    let sorted = enriched.slice();
    if (section === 'weekly') {
      sorted.sort(
        (a, b) =>
          b.weekly_points - a.weekly_points ||
          b.points - a.points ||
          b.accuracy - a.accuracy
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
          b.accuracy - a.accuracy ||
          b.correct_count - a.correct_count ||
          b.points - a.points
      );
    } else if (section === 'wins') {
      sorted.sort(
        (a, b) =>
          b.correct_count - a.correct_count ||
          b.points - a.points ||
          b.accuracy - a.accuracy
      );
    } else {
      // Default: points (general)
      sorted.sort(
        (a, b) =>
          b.points - a.points ||
          b.weekly_points - a.weekly_points ||
          b.streak - a.streak
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
    res.status(500).json({ error: 'Failed to retrieve basic leaderboard' });
  }
});

// GET /api/leaderboard/serious - Leaderboard for Serious Mode with Section Filtering, Weekly Ranking & Streaks
router.get('/serious', (req, res) => {
  try {
    const section = (req.query.section as string) || 'points';

    const rawLeaders = queryAll<{
      id: number;
      username: string;
      serious_points: number;
      serious_streak: number;
      serious_best_streak: number;
      won_sets: number;
      lost_sets: number;
      pending_sets: number;
      weekly_history_points: number;
      weekly_sets_points: number;
    }>(`
      SELECT u.id, u.username, u.serious_points, u.serious_streak, u.serious_best_streak,
             (SELECT COUNT(*) FROM serious_sets s WHERE s.user_id = u.id AND s.status = 'WON') as won_sets,
             (SELECT COUNT(*) FROM serious_sets s WHERE s.user_id = u.id AND s.status = 'LOST') as lost_sets,
             (SELECT COUNT(*) FROM serious_sets s WHERE s.user_id = u.id AND s.status = 'PENDING') as pending_sets,
             (SELECT COALESCE(SUM(delta), 0) FROM points_history ph WHERE ph.user_id = u.id AND ph.mode = 'SERIOUS' AND ph.delta > 0 AND ph.created_at >= datetime('now', '-7 days')) as weekly_history_points,
             (SELECT COALESCE(SUM(potential_points), 0) FROM serious_sets ss WHERE ss.user_id = u.id AND ss.status = 'WON' AND (ss.resolved_at >= datetime('now', '-7 days') OR ss.created_at >= datetime('now', '-7 days'))) as weekly_sets_points
      FROM users u
    `);

    const enriched = rawLeaders.map((u) => {
      const won = u.won_sets || 0;
      const lost = u.lost_sets || 0;
      const totalSets = won + lost;
      const accuracy = totalSets > 0 ? Math.round((won / totalSets) * 100) : 0;
      const streak = u.serious_streak || 0;
      const bestStreak = u.serious_best_streak || 0;
      const weeklyPoints = Math.max(u.weekly_history_points || 0, u.weekly_sets_points || 0);

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
        pending_sets: u.pending_sets || 0,
        total_sets: totalSets,
        accuracy,
        is_on_fire: streak >= 2,
        streak_tier: streakTier,
        serious_points: u.serious_points,
        serious_streak: streak,
        serious_best_streak: bestStreak,
      };
    });

    // Compute Hall of Fame Spotlights for Serious Mode
    const topWeekly = enriched.slice().sort((a, b) => b.weekly_points - a.weekly_points || b.points - a.points)[0] || null;
    const topPoints = enriched.slice().sort((a, b) => b.points - a.points)[0] || null;
    const hottestStreak =
      enriched.slice().sort((a, b) => b.streak - a.streak || b.best_streak - a.best_streak || b.points - a.points)[0] || null;
    const bestStreakRecord =
      enriched.slice().sort((a, b) => b.best_streak - a.best_streak || b.streak - a.streak)[0] || null;
    const highestAccuracy =
      enriched
        .filter((u) => u.total_sets >= 1)
        .sort((a, b) => b.accuracy - a.accuracy || b.won_sets - a.won_sets || b.points - a.points)[0] || null;
    const mostWins =
      enriched.slice().sort((a, b) => b.won_sets - a.won_sets || b.points - a.points)[0] || null;

    // Hottest active streak showcase list
    const hotStreakers = enriched
      .filter((u) => u.streak > 0)
      .sort((a, b) => b.streak - a.streak || b.best_streak - a.best_streak || b.points - a.points)
      .slice(0, 6);

    // Sort according to section
    let sorted = enriched.slice();
    if (section === 'weekly') {
      sorted.sort(
        (a, b) =>
          b.weekly_points - a.weekly_points ||
          b.points - a.points ||
          b.accuracy - a.accuracy
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
          b.accuracy - a.accuracy ||
          b.won_sets - a.won_sets ||
          b.points - a.points
      );
    } else if (section === 'wins') {
      sorted.sort(
        (a, b) =>
          b.won_sets - a.won_sets ||
          b.points - a.points ||
          b.accuracy - a.accuracy
      );
    } else {
      // Default: points (general)
      sorted.sort(
        (a, b) =>
          b.points - a.points ||
          b.weekly_points - a.weekly_points ||
          b.streak - a.streak
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
    res.status(500).json({ error: 'Failed to retrieve serious leaderboard' });
  }
});

export default router;
