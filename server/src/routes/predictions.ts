import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { PredictionService } from '../services/predictionService.js';
import { queryOne, run } from '../db/database.js';

const router = Router();

// POST /api/predictions/basic - submit one or more Basic Mode predictions
router.post('/basic', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { predictions } = req.body;
    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one prediction.' });
    }

    const results = PredictionService.createBasicPredictions(req.user!.id, predictions);
    res.json({
      success: true,
      message: `Successfully placed ${results.length} Basic Mode prediction(s).`,
      predictions: results,
    });
  } catch (err: any) {
    console.error('Create basic prediction error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to submit prediction.' });
  }
});

// POST /api/predictions/serious-set - submit a Serious Mode Set
router.post('/serious-set', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { name, predictions } = req.body;

    if (!predictions || !Array.isArray(predictions) || predictions.length < 2) {
      return res.status(400).json({
        error: 'Serious Mode requires grouping at least 2 predictions into a set.',
      });
    }

    const set = PredictionService.createSeriousSet(req.user!.id, name, predictions);
    res.json({
      success: true,
      message: `Serious Mode set "${set.setName}" created with ${set.predictionsCount} predictions!`,
      set,
    });
  } catch (err: any) {
    console.error('Create serious set error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to create Serious Mode set.' });
  }
});

// GET /api/predictions/my - list user predictions
router.get('/my', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { mode, status } = req.query as { mode?: 'BASIC' | 'SERIOUS'; status?: string };
    const predictions = PredictionService.getUserPredictions(req.user!.id, mode, status);
    res.json({ predictions });
  } catch (err: any) {
    console.error('Get user predictions error:', err);
    res.status(500).json({ error: 'Failed to retrieve predictions.' });
  }
});

// GET /api/predictions/serious-sets/my - list user serious sets with their items
router.get('/serious-sets/my', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const sets = PredictionService.getUserSeriousSets(req.user!.id);
    res.json({ sets });
  } catch (err: any) {
    console.error('Get user serious sets error:', err);
    res.status(500).json({ error: 'Failed to retrieve serious sets.' });
  }
});

// DELETE /api/predictions/:id - cancel prediction before kickoff
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const predId = parseInt(req.params.id as string, 10);
    const pred = queryOne<{
      id: number;
      user_id: number;
      match_id: number;
      status: string;
      mode: string;
      serious_set_id: number | null;
      utc_date: string;
    }>(
      `SELECT p.*, m.utc_date
       FROM predictions p
       JOIN matches m ON p.match_id = m.id
       WHERE p.id = ? AND p.user_id = ?`,
      [predId, req.user!.id]
    );

    if (!pred) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    if (pred.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cannot cancel a resolved prediction.' });
    }

    const kickoff = new Date(pred.utc_date).getTime();
    if (kickoff <= Date.now()) {
      return res.status(400).json({ error: 'Match has started. Prediction is locked.' });
    }

    if (pred.mode === 'SERIOUS' && pred.serious_set_id) {
      return res.status(400).json({
        error: 'Individual predictions in a Serious Set cannot be deleted separately. The entire set must be reconfigured.',
      });
    }

    run('DELETE FROM predictions WHERE id = ?', [predId]);
    res.json({ success: true, message: 'Prediction removed.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cancel prediction.' });
  }
});

export default router;
