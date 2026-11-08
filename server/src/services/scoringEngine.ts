import {
  requireSupabase,
  assertSupabaseOk,
  insertRowWithAutoId,
} from '../db/supabaseClient.js';
import { getMarketDefinition, MatchEvaluationData } from './marketRegistry.js';

export interface MatchResult {
  id: number;
  home_team_name: string;
  home_team_short: string;
  away_team_name: string;
  away_team_short: string;
  home_score: number | null;
  away_score: number | null;
  home_corners: number | null;
  away_corners: number | null;
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  status: string;
}

export interface PredictionRow {
  id: number;
  user_id: number;
  match_id: number;
  mode: 'BASIC' | 'SERIOUS';
  serious_set_id: number | null;
  market_type: string;
  selection: string;
  odds_points: number;
  status: 'PENDING' | 'CORRECT' | 'INCORRECT' | 'VOID';
}

/**
 * Check if a prediction is correct given the actual match result.
 */
export function evaluatePrediction(
  marketType: string,
  selection: string,
  result: MatchEvaluationData
): { isCorrect: boolean; actualResultStr: string } {
  const def = getMarketDefinition(marketType);
  if (def) {
    return def.evaluate(selection, result);
  }

  const { homeScore, awayScore, homeCorners, awayCorners } = result;
  const totalGoals = homeScore + awayScore;
  const totalCorners = (homeCorners ?? 0) + (awayCorners ?? 0);

  const matchWinner =
    homeScore > awayScore ? 'HOME' : homeScore < awayScore ? 'AWAY' : 'DRAW';

  switch (marketType) {
    case 'MATCH_WINNER': {
      const isCorrect = selection.toUpperCase() === matchWinner;
      return { isCorrect, actualResultStr: matchWinner };
    }

    case 'DOUBLE_CHANCE': {
      let isCorrect = false;
      if (selection === '1X') isCorrect = homeScore >= awayScore;
      else if (selection === '12') isCorrect = homeScore !== awayScore;
      else if (selection === 'X2') isCorrect = homeScore <= awayScore;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore} (${matchWinner})` };
    }

    case 'GOALS_OVER_UNDER': {
      let isCorrect = false;
      const [type, thresholdStr] = selection.split('_');
      const threshold = parseFloat(thresholdStr);
      if (type === 'OVER') isCorrect = totalGoals > threshold;
      else if (type === 'UNDER') isCorrect = totalGoals < threshold;
      return { isCorrect, actualResultStr: `${totalGoals} goals` };
    }

    case 'CORNERS_OVER_UNDER': {
      let isCorrect = false;
      const [type, thresholdStr] = selection.split('_');
      const threshold = parseFloat(thresholdStr);
      if (type === 'OVER') isCorrect = totalCorners > threshold;
      else if (type === 'UNDER') isCorrect = totalCorners < threshold;
      return { isCorrect, actualResultStr: `${totalCorners} corners` };
    }

    case 'EXACT_SCORE': {
      const actualScore = `${homeScore}-${awayScore}`;
      const isCorrect = selection.trim() === actualScore;
      return { isCorrect, actualResultStr: actualScore };
    }

    case 'BTTS': {
      const actualBtts = homeScore > 0 && awayScore > 0 ? 'YES' : 'NO';
      const isCorrect = selection.toUpperCase() === actualBtts;
      return { isCorrect, actualResultStr: `Both Scored: ${actualBtts}` };
    }

    default:
      return { isCorrect: false, actualResultStr: 'Unknown market' };
  }
}

/**
 * Grades all pending predictions for a finished match directly in Supabase.
 */
export async function gradeMatch(matchId: number) {
  const client = requireSupabase();

  const matchRes = await client
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle();
  assertSupabaseOk(matchRes.error, 'Fetch match for grading');

  const match = matchRes.data as MatchResult | null;
  if (!match || match.status !== 'FINISHED' || match.home_score === null || match.away_score === null) {
    return { graded: 0, message: 'Match not finished or scores not set' };
  }

  const predsRes = await client
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)
    .eq('status', 'PENDING');
  assertSupabaseOk(predsRes.error, 'Fetch pending predictions for grading');

  const predictions = (predsRes.data || []) as PredictionRow[];
  const evaluatedSets = new Set<number>();
  let basicGraded = 0;
  const nowIso = new Date().toISOString();

  for (const pred of predictions) {
    const { isCorrect, actualResultStr } = evaluatePrediction(
      pred.market_type,
      pred.selection,
      {
        homeScore: match.home_score,
        awayScore: match.away_score,
        homeCorners: match.home_corners ?? 10,
        awayCorners: match.away_corners ?? 0,
        matchId: match.id,
      }
    );

    const newStatus = isCorrect ? 'CORRECT' : 'INCORRECT';
    const pointsAwarded = isCorrect ? pred.odds_points : 0;

    const updPredRes = await client
      .from('predictions')
      .update({
        status: newStatus,
        actual_result: actualResultStr,
        points_awarded: pointsAwarded,
        resolved_at: nowIso,
      })
      .eq('id', pred.id);
    assertSupabaseOk(updPredRes.error, 'Update graded prediction');

    if (pred.mode === 'BASIC') {
      basicGraded++;
      await handleBasicPredictionResult(pred, isCorrect, pointsAwarded, match);
    } else if (pred.mode === 'SERIOUS' && pred.serious_set_id) {
      evaluatedSets.add(pred.serious_set_id);
    }
  }

  const markMatchRes = await client
    .from('matches')
    .update({ is_graded: 1, updated_at: nowIso })
    .eq('id', matchId);
  assertSupabaseOk(markMatchRes.error, 'Mark match as graded');

  for (const setId of evaluatedSets) {
    await evaluateSeriousSet(setId);
  }

  return {
    graded: predictions.length,
    basicGraded,
    setsChecked: evaluatedSets.size,
  };
}

/**
 * Handles points and streak changes for a Basic Mode prediction in Supabase.
 */
async function handleBasicPredictionResult(
  pred: PredictionRow,
  isCorrect: boolean,
  pointsAwarded: number,
  match: MatchResult
) {
  const client = requireSupabase();

  const userRes = await client
    .from('users')
    .select('basic_points, basic_streak, basic_best_streak')
    .eq('id', pred.user_id)
    .maybeSingle();
  assertSupabaseOk(userRes.error, 'Fetch user for Basic grading');

  const user = userRes.data;
  if (!user) return;

  const nowIso = new Date().toISOString();

  if (isCorrect) {
    const newBalance = user.basic_points + pointsAwarded;
    const newStreak = user.basic_streak + 1;
    const newBest = Math.max(user.basic_best_streak, newStreak);

    const updUser = await client
      .from('users')
      .update({
        basic_points: newBalance,
        basic_streak: newStreak,
        basic_best_streak: newBest,
        updated_at: nowIso,
      })
      .eq('id', pred.user_id);
    assertSupabaseOk(updUser.error, 'Update user Basic points');

    await insertRowWithAutoId('points_history', {
      user_id: pred.user_id,
      mode: 'BASIC',
      delta: pointsAwarded,
      balance_after: newBalance,
      reason: `Won: ${match.home_team_short || match.home_team_name} vs ${match.away_team_short || match.away_team_name} (${pred.market_type} - ${pred.selection})`,
      prediction_id: pred.id,
      created_at: nowIso,
    });
  } else {
    // Incorrect in Basic Mode: 0 points awarded, NO penalty. Streak resets.
    const updUser = await client
      .from('users')
      .update({
        basic_streak: 0,
        updated_at: nowIso,
      })
      .eq('id', pred.user_id);
    assertSupabaseOk(updUser.error, 'Reset user Basic streak');

    await insertRowWithAutoId('points_history', {
      user_id: pred.user_id,
      mode: 'BASIC',
      delta: 0,
      balance_after: user.basic_points,
      reason: `Missed: ${match.home_team_short || match.home_team_name} vs ${match.away_team_short || match.away_team_name} (${pred.market_type} - ${pred.selection}) [0 pts]`,
      prediction_id: pred.id,
      created_at: nowIso,
    });
  }
}

/**
 * Checks if a Serious Set is ready for resolution in Supabase.
 * If every prediction is finished:
 *  - If all correct -> award total points
 *  - If any wrong -> deduct 10 points ONCE for the entire set
 */
export async function evaluateSeriousSet(setId: number) {
  const client = requireSupabase();

  const setRes = await client
    .from('serious_sets')
    .select('id, user_id, name, status, potential_points, total_predictions')
    .eq('id', setId)
    .maybeSingle();
  assertSupabaseOk(setRes.error, 'Fetch serious set for evaluation');

  const set = setRes.data;
  if (!set || set.status !== 'PENDING') return;

  const predsRes = await client
    .from('predictions')
    .select('id, status, points_awarded, odds_points')
    .eq('serious_set_id', setId);
  assertSupabaseOk(predsRes.error, 'Fetch serious set predictions');

  const preds = predsRes.data || [];
  if (preds.length === 0) return;

  const pendingCount = preds.filter((p) => p.status === 'PENDING').length;
  const incorrectCount = preds.filter((p) => p.status === 'INCORRECT').length;
  const correctCount = preds.filter((p) => p.status === 'CORRECT').length;

  if (pendingCount > 0) {
    return;
  }

  const userRes = await client
    .from('users')
    .select('serious_points, serious_streak, serious_best_streak')
    .eq('id', set.user_id)
    .maybeSingle();
  assertSupabaseOk(userRes.error, 'Fetch user for Serious Set grading');

  const user = userRes.data;
  if (!user) return;

  const nowIso = new Date().toISOString();

  if (incorrectCount === 0) {
    const totalPointsWon = preds.reduce((acc, p) => acc + p.odds_points, 0);
    const newBalance = user.serious_points + totalPointsWon;
    const newStreak = user.serious_streak + 1;
    const newBest = Math.max(user.serious_best_streak, newStreak);

    const updSet = await client
      .from('serious_sets')
      .update({
        status: 'WON',
        points_delta: totalPointsWon,
        correct_predictions: correctCount,
        incorrect_predictions: 0,
        resolved_at: nowIso,
      })
      .eq('id', setId);
    assertSupabaseOk(updSet.error, 'Update won serious set');

    const updUser = await client
      .from('users')
      .update({
        serious_points: newBalance,
        serious_streak: newStreak,
        serious_best_streak: newBest,
        updated_at: nowIso,
      })
      .eq('id', set.user_id);
    assertSupabaseOk(updUser.error, 'Update user serious points on win');

    await insertRowWithAutoId('points_history', {
      user_id: set.user_id,
      mode: 'SERIOUS',
      delta: totalPointsWon,
      balance_after: newBalance,
      reason: `Set Won: "${set.name}" (${correctCount}/${preds.length} correct) [Bonus: +${totalPointsWon} pts]`,
      serious_set_id: setId,
      created_at: nowIso,
    });
  } else {
    const penalty = -10;
    const newBalance = user.serious_points + penalty;

    const updSet = await client
      .from('serious_sets')
      .update({
        status: 'LOST',
        points_delta: penalty,
        correct_predictions: correctCount,
        incorrect_predictions: incorrectCount,
        resolved_at: nowIso,
      })
      .eq('id', setId);
    assertSupabaseOk(updSet.error, 'Update lost serious set');

    const updUser = await client
      .from('users')
      .update({
        serious_points: newBalance,
        serious_streak: 0,
        updated_at: nowIso,
      })
      .eq('id', set.user_id);
    assertSupabaseOk(updUser.error, 'Update user serious points on loss');

    await insertRowWithAutoId('points_history', {
      user_id: set.user_id,
      mode: 'SERIOUS',
      delta: penalty,
      balance_after: newBalance,
      reason: `Set Failed: "${set.name}" (${incorrectCount} wrong) [-10 pts penalty]`,
      serious_set_id: setId,
      created_at: nowIso,
    });
  }
}
