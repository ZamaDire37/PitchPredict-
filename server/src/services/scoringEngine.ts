import { db, queryAll, queryOne, run } from '../db/database.js';
import { getMarketDefinition } from './marketRegistry.js';

export interface MatchResult {
  id: number;
  home_team_name: string;
  home_team_short: string;
  away_team_name: string;
  away_team_short: string;
  home_score: number;
  away_score: number;
  home_corners: number;
  away_corners: number;
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW';
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
  result: {
    homeScore: number;
    awayScore: number;
    homeCorners: number;
    awayCorners: number;
  }
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
 * Grades all pending predictions for a finished match.
 */
export function gradeMatch(matchId: number) {
  const match = queryOne<MatchResult>(
    'SELECT * FROM matches WHERE id = ?',
    [matchId]
  );

  if (!match || match.status !== 'FINISHED' || match.home_score === null || match.away_score === null) {
    return { graded: 0, message: 'Match not finished or scores not set' };
  }

  // Get all pending predictions for this match
  const predictions = queryAll<PredictionRow>(
    "SELECT * FROM predictions WHERE match_id = ? AND status = 'PENDING'",
    [matchId]
  );

  const evaluatedSets = new Set<number>();
  let basicGraded = 0;

  for (const pred of predictions) {
    const { isCorrect, actualResultStr } = evaluatePrediction(
      pred.market_type,
      pred.selection,
      {
        homeScore: match.home_score,
        awayScore: match.away_score,
        homeCorners: match.home_corners ?? 10,
        awayCorners: match.away_corners ?? 0,
      }
    );

    const newStatus = isCorrect ? 'CORRECT' : 'INCORRECT';
    const pointsAwarded = isCorrect ? pred.odds_points : 0;

    // Update the prediction record
    run(
      `UPDATE predictions
       SET status = ?, actual_result = ?, points_awarded = ?, resolved_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, actualResultStr, pointsAwarded, pred.id]
    );

    if (pred.mode === 'BASIC') {
      basicGraded++;
      // Process Basic Mode user points immediately
      handleBasicPredictionResult(pred, isCorrect, pointsAwarded, match);
    } else if (pred.mode === 'SERIOUS' && pred.serious_set_id) {
      evaluatedSets.add(pred.serious_set_id);
    }
  }

  // Mark match as graded
  run('UPDATE matches SET is_graded = 1 WHERE id = ?', [matchId]);

  // Check any Serious Sets affected by these predictions
  for (const setId of evaluatedSets) {
    evaluateSeriousSet(setId);
  }

  return {
    graded: predictions.length,
    basicGraded,
    setsChecked: evaluatedSets.size,
  };
}

/**
 * Handles points and streak changes for a Basic Mode prediction.
 */
function handleBasicPredictionResult(
  pred: PredictionRow,
  isCorrect: boolean,
  pointsAwarded: number,
  match: MatchResult
) {
  const user = queryOne<{ basic_points: number; basic_streak: number; basic_best_streak: number }>(
    'SELECT basic_points, basic_streak, basic_best_streak FROM users WHERE id = ?',
    [pred.user_id]
  );

  if (!user) return;

  if (isCorrect) {
    const newBalance = user.basic_points + pointsAwarded;
    const newStreak = user.basic_streak + 1;
    const newBest = Math.max(user.basic_best_streak, newStreak);

    run(
      'UPDATE users SET basic_points = ?, basic_streak = ?, basic_best_streak = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newBalance, newStreak, newBest, pred.user_id]
    );

    // Record in points history ledger
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, prediction_id)
       VALUES (?, 'BASIC', ?, ?, ?, ?)`,
      [
        pred.user_id,
        pointsAwarded,
        newBalance,
        `Won: ${match.home_team_short || match.home_team_name} vs ${match.away_team_short || match.away_team_name} (${pred.market_type} - ${pred.selection})`,
        pred.id,
      ]
    );
  } else {
    // Incorrect in Basic Mode: 0 points awarded, NO penalty. Streak resets.
    run(
      'UPDATE users SET basic_streak = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [pred.user_id]
    );

    // Record zero change in history for full visibility if desired
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, prediction_id)
       VALUES (?, 'BASIC', 0, ?, ?, ?)`,
      [
        pred.user_id,
        user.basic_points,
        `Missed: ${match.home_team_short || match.home_team_name} vs ${match.away_team_short || match.away_team_name} (${pred.market_type} - ${pred.selection}) [0 pts]`,
        pred.id,
      ]
    );
  }
}

/**
 * Checks if a Serious Set is ready for resolution.
 * If every prediction is finished:
 *  - If all correct -> award total points
 *  - If any wrong -> deduct 10 points ONCE for the entire set
 */
export function evaluateSeriousSet(setId: number) {
  const set = queryOne<{
    id: number;
    user_id: number;
    name: string;
    status: string;
    potential_points: number;
    total_predictions: number;
  }>('SELECT * FROM serious_sets WHERE id = ?', [setId]);

  if (!set || set.status !== 'PENDING') return;

  const preds = queryAll<{
    id: number;
    status: string;
    points_awarded: number;
    odds_points: number;
  }>('SELECT id, status, points_awarded, odds_points FROM predictions WHERE serious_set_id = ?', [setId]);

  if (preds.length === 0) return;

  const pendingCount = preds.filter((p) => p.status === 'PENDING').length;
  const incorrectCount = preds.filter((p) => p.status === 'INCORRECT').length;
  const correctCount = preds.filter((p) => p.status === 'CORRECT').length;

  // If ANY prediction has already failed, or all predictions are resolved:
  // Note: If at least one has failed, the set is irrevocably LOST!
  // But let's check if we resolve early or wait until all games in set finish.
  // Requirement: "If at least one prediction in a set is wrong, deduct 10 points once for that entire set, regardless of how many predictions were wrong."
  // Usually resolved when all matches in the set finish, or as soon as a failure is guaranteed. Waiting until all matches in the set finish gives a clean, complete scoreline.
  if (pendingCount > 0 && incorrectCount === 0) {
    // Set is still pending (no errors yet, waiting for remaining matches)
    return;
  }

  // If all are finished, or if one failed and we resolve the set:
  if (pendingCount === 0) {
    const user = queryOne<{ serious_points: number; serious_streak: number; serious_best_streak: number }>(
      'SELECT serious_points, serious_streak, serious_best_streak FROM users WHERE id = ?',
      [set.user_id]
    );
    if (!user) return;

    if (incorrectCount === 0) {
      // WON THE SET!
      const totalPointsWon = preds.reduce((acc, p) => acc + p.odds_points, 0);
      const newBalance = user.serious_points + totalPointsWon;
      const newStreak = user.serious_streak + 1;
      const newBest = Math.max(user.serious_best_streak, newStreak);

      run(
        `UPDATE serious_sets
         SET status = 'WON', points_delta = ?, correct_predictions = ?, incorrect_predictions = 0, resolved_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [totalPointsWon, correctCount, setId]
      );

      run(
        'UPDATE users SET serious_points = ?, serious_streak = ?, serious_best_streak = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, newStreak, newBest, set.user_id]
      );

      run(
        `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, serious_set_id)
         VALUES (?, 'SERIOUS', ?, ?, ?, ?)`,
        [
          set.user_id,
          totalPointsWon,
          newBalance,
          `Set Won: "${set.name}" (${correctCount}/${preds.length} correct) [Bonus: +${totalPointsWon} pts]`,
          setId,
        ]
      );
    } else {
      // LOST THE SET: Deduct 10 points ONCE for the entire set
      const penalty = -10;
      const newBalance = user.serious_points + penalty; // e.g. 100 - 10 = 90

      run(
        `UPDATE serious_sets
         SET status = 'LOST', points_delta = ?, correct_predictions = ?, incorrect_predictions = ?, resolved_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [penalty, correctCount, incorrectCount, setId]
      );

      run(
        'UPDATE users SET serious_points = ?, serious_streak = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, set.user_id]
      );

      run(
        `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, serious_set_id)
         VALUES (?, 'SERIOUS', ?, ?, ?, ?)`,
        [
          set.user_id,
          penalty,
          newBalance,
          `Set Failed: "${set.name}" (${incorrectCount} wrong) [-10 pts penalty]`,
          setId,
        ]
      );
    }
  }
}
