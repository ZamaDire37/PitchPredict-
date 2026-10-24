import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { queryAll, queryOne } from '../db/database.js';

const router = Router();

// GET /api/history/ledger - full audit trail of points transactions
router.get('/ledger', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { mode, limit = 50 } = req.query;
    let sql = `
      SELECT ph.*,
             p.market_type, p.selection, p.actual_result,
             s.name as set_name
      FROM points_history ph
      LEFT JOIN predictions p ON ph.prediction_id = p.id
      LEFT JOIN serious_sets s ON ph.serious_set_id = s.id
      WHERE ph.user_id = ?
    `;
    const params: any[] = [req.user!.id];

    if (mode && (mode === 'BASIC' || mode === 'SERIOUS')) {
      sql += ' AND ph.mode = ?';
      params.push(mode);
    }

    sql += ' ORDER BY ph.created_at DESC, ph.id DESC LIMIT ?';
    params.push(parseInt(limit as string, 10) || 50);

    const history = queryAll(sql, params);
    res.json({ history });
  } catch (err: any) {
    console.error('Points ledger error:', err);
    res.status(500).json({ error: 'Failed to retrieve points history' });
  }
});

// GET /api/history/progression - time-series points balance for charts
router.get('/progression', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Retrieve ledger entries in chronological order
    const basicEntries = queryAll<{
      id: number;
      delta: number;
      balance_after: number;
      created_at: string;
      reason: string;
    }>(
      `SELECT id, delta, balance_after, created_at, reason
       FROM points_history
       WHERE user_id = ? AND mode = 'BASIC'
       ORDER BY created_at ASC, id ASC`,
      [userId]
    );

    const seriousEntries = queryAll<{
      id: number;
      delta: number;
      balance_after: number;
      created_at: string;
      reason: string;
    }>(
      `SELECT id, delta, balance_after, created_at, reason
       FROM points_history
       WHERE user_id = ? AND mode = 'SERIOUS'
       ORDER BY created_at ASC, id ASC`,
      [userId]
    );

    res.json({
      basicProgression: basicEntries,
      seriousProgression: seriousEntries,
    });
  } catch (err: any) {
    console.error('Progression error:', err);
    res.status(500).json({ error: 'Failed to retrieve progression data' });
  }
});

// GET /api/history/stats - user prediction statistics for both modes
router.get('/stats', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = queryOne<{
      basic_points: number;
      serious_points: number;
      basic_streak: number;
      basic_best_streak: number;
      serious_streak: number;
      serious_best_streak: number;
    }>(
      `SELECT basic_points, serious_points, basic_streak, basic_best_streak, serious_streak, serious_best_streak
       FROM users WHERE id = ?`,
      [userId]
    );

    const basicCounts = queryOne<{ total: number; correct: number; incorrect: number; pending: number }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'CORRECT' THEN 1 ELSE 0 END) as correct,
        SUM(CASE WHEN status = 'INCORRECT' THEN 1 ELSE 0 END) as incorrect,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
      FROM predictions
      WHERE user_id = ? AND mode = 'BASIC'
    `, [userId]);

    const seriousSetCounts = queryOne<{ total: number; won: number; lost: number; pending: number }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'WON' THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN status = 'LOST' THEN 1 ELSE 0 END) as lost,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
      FROM serious_sets
      WHERE user_id = ?
    `, [userId]);

    res.json({
      user,
      basic: {
        points: user?.basic_points ?? 100,
        streak: user?.basic_streak ?? 0,
        bestStreak: user?.basic_best_streak ?? 0,
        total: basicCounts?.total ?? 0,
        correct: basicCounts?.correct ?? 0,
        incorrect: basicCounts?.incorrect ?? 0,
        pending: basicCounts?.pending ?? 0,
        winRate: (basicCounts?.correct ?? 0) + (basicCounts?.incorrect ?? 0) > 0
          ? Math.round(((basicCounts?.correct ?? 0) / ((basicCounts?.correct ?? 0) + (basicCounts?.incorrect ?? 0))) * 100)
          : 0,
      },
      serious: {
        points: user?.serious_points ?? 100,
        streak: user?.serious_streak ?? 0,
        bestStreak: user?.serious_best_streak ?? 0,
        totalSets: seriousSetCounts?.total ?? 0,
        wonSets: seriousSetCounts?.won ?? 0,
        lostSets: seriousSetCounts?.lost ?? 0,
        pendingSets: seriousSetCounts?.pending ?? 0,
        winRate: (seriousSetCounts?.won ?? 0) + (seriousSetCounts?.lost ?? 0) > 0
          ? Math.round(((seriousSetCounts?.won ?? 0) / ((seriousSetCounts?.won ?? 0) + (seriousSetCounts?.lost ?? 0))) * 100)
          : 0,
      },
    });
  } catch (err: any) {
    console.error('History stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

export default router;
