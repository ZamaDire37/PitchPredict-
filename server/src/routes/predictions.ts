import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { PredictionService } from '../services/predictionService.js';
import {
  requireSupabase,
  assertSupabaseOk,
  sendRouteError,
} from '../db/supabaseClient.js';

const router = Router();

// POST /api/predictions/basic - submit one or more Basic Mode predictions
router.post('/basic', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { predictions } = req.body;
    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one prediction.' });
    }

    if (predictions.length > 10) {
      return res.status(400).json({
        error: 'In Basic Mode, there is a limit of 10 selections that users can make.',
      });
    }

    const results = await PredictionService.createBasicPredictions(req.user!.id, predictions);
    res.json({
      success: true,
      message: `Successfully placed ${results.length} Basic Mode prediction(s).`,
      predictions: results,
    });
  } catch (err: any) {
    console.error('Create basic prediction error:', err.message);
    return sendRouteError(res, err, 'Failed to submit prediction.', 400);
  }
});

// POST /api/predictions/serious-set - submit a Serious Mode Set
router.post('/serious-set', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, predictions } = req.body;

    if (!predictions || !Array.isArray(predictions) || predictions.length < 1) {
      return res.status(400).json({
        error:
          'Serious Mode requires selecting at least 1 prediction for your set. Users can add as many selections as they want!',
      });
    }

    const set = await PredictionService.createSeriousSet(req.user!.id, name, predictions);
    res.json({
      success: true,
      message: `Serious Mode set "${set.setName}" created with ${set.predictionsCount} predictions!`,
      set,
    });
  } catch (err: any) {
    console.error('Create serious set error:', err.message);
    return sendRouteError(res, err, 'Failed to create Serious Mode set.', 400);
  }
});

// GET /api/predictions/community - feed of other users' predictions
router.get('/community', async (req, res) => {
  try {
    const { mode, status, limit = 60 } = req.query as {
      mode?: 'BASIC' | 'SERIOUS';
      status?: string;
      limit?: string | number;
    };
    const predictions = await PredictionService.getCommunityPredictions(
      mode,
      status,
      parseInt(limit as string, 10) || 60
    );
    res.json({ predictions });
  } catch (err: any) {
    console.error('Get community predictions error:', err);
    return sendRouteError(res, err, 'Failed to retrieve community predictions.');
  }
});

// GET /api/predictions/user/:userId - full public profile and past predictions of any user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId as string, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const profile = await PredictionService.getUserProfile(userId);
    res.json(profile);
  } catch (err: any) {
    console.error('Get user profile error:', err.message);
    return sendRouteError(res, err, 'User not found.', 404);
  }
});

// GET /api/predictions/match/:matchId - community predictions made on a specific match
router.get('/match/:matchId', async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId as string, 10);
    if (isNaN(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    const predictions = await PredictionService.getMatchCommunityPredictions(matchId);
    res.json({ predictions });
  } catch (err: any) {
    console.error('Get match predictions error:', err);
    return sendRouteError(res, err, 'Failed to retrieve match predictions.');
  }
});

// GET /api/predictions/my - list user predictions
router.get('/my', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { mode, status } = req.query as { mode?: 'BASIC' | 'SERIOUS'; status?: string };
    const predictions = await PredictionService.getUserPredictions(req.user!.id, mode, status);
    res.json({ predictions });
  } catch (err: any) {
    console.error('Get user predictions error:', err);
    return sendRouteError(res, err, 'Failed to retrieve predictions.');
  }
});

// GET /api/predictions/serious-sets/my - list user serious sets with their items
router.get('/serious-sets/my', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const sets = await PredictionService.getUserSeriousSets(req.user!.id);
    res.json({ sets });
  } catch (err: any) {
    console.error('Get user serious sets error:', err);
    return sendRouteError(res, err, 'Failed to retrieve serious sets.');
  }
});

// DELETE /api/predictions/:id - cancel prediction before kickoff
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const predId = parseInt(req.params.id as string, 10);
    if (isNaN(predId)) {
      return res.status(400).json({ error: 'Invalid prediction ID.' });
    }

    const client = requireSupabase();
    const predRes = await client
      .from('predictions')
      .select('id, user_id, match_id, status, mode, serious_set_id')
      .eq('id', predId)
      .eq('user_id', req.user!.id)
      .maybeSingle();
    assertSupabaseOk(predRes.error, 'Lookup prediction for cancellation');

    const pred = predRes.data;
    if (!pred) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    if (pred.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cannot cancel a resolved prediction.' });
    }

    const matchRes = await client
      .from('matches')
      .select('utc_date')
      .eq('id', pred.match_id)
      .maybeSingle();
    assertSupabaseOk(matchRes.error, 'Lookup match kickoff for cancellation');

    if (matchRes.data) {
      const kickoff = new Date(matchRes.data.utc_date).getTime();
      if (kickoff <= Date.now()) {
        return res.status(400).json({ error: 'Match has started. Prediction is locked.' });
      }
    }

    if (pred.mode === 'SERIOUS' && pred.serious_set_id) {
      return res.status(400).json({
        error:
          'Individual predictions in a Serious Set cannot be deleted separately. The entire set must be reconfigured.',
      });
    }

    const delRes = await client.from('predictions').delete().eq('id', predId);
    assertSupabaseOk(delRes.error, 'Delete pending prediction');

    res.json({ success: true, message: 'Prediction removed.' });
  } catch (err: any) {
    return sendRouteError(res, err, 'Failed to cancel prediction.');
  }
});

export default router;
