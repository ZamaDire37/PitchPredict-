import { Router } from 'express';
import { queryAll } from '../db/database.js';

const router = Router();

// GET /api/leaderboard/basic - Leaderboard for Basic Mode
router.get('/basic', (req, res) => {
  try {
    const leaders = queryAll(`
      SELECT u.id, u.username, u.basic_points, u.basic_streak, u.basic_best_streak,
             (SELECT COUNT(*) FROM predictions p WHERE p.user_id = u.id AND p.mode = 'BASIC' AND p.status = 'CORRECT') as correct_count,
             (SELECT COUNT(*) FROM predictions p WHERE p.user_id = u.id AND p.mode = 'BASIC' AND p.status = 'INCORRECT') as incorrect_count
      FROM users u
      ORDER BY u.basic_points DESC, u.basic_best_streak DESC
      LIMIT 50
    `);

    res.json({
      mode: 'BASIC',
      leaderboard: leaders.map((leader, index) => ({
        rank: index + 1,
        ...leader,
      })),
    });
  } catch (err: any) {
    console.error('Basic leaderboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve basic leaderboard' });
  }
});

// GET /api/leaderboard/serious - Leaderboard for Serious Mode
router.get('/serious', (req, res) => {
  try {
    const leaders = queryAll(`
      SELECT u.id, u.username, u.serious_points, u.serious_streak, u.serious_best_streak,
             (SELECT COUNT(*) FROM serious_sets s WHERE s.user_id = u.id AND s.status = 'WON') as won_sets,
             (SELECT COUNT(*) FROM serious_sets s WHERE s.user_id = u.id AND s.status = 'LOST') as lost_sets
      FROM users u
      ORDER BY u.serious_points DESC, u.serious_best_streak DESC
      LIMIT 50
    `);

    res.json({
      mode: 'SERIOUS',
      leaderboard: leaders.map((leader, index) => ({
        rank: index + 1,
        ...leader,
      })),
    });
  } catch (err: any) {
    console.error('Serious leaderboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve serious leaderboard' });
  }
});

export default router;
