import { db, queryAll, queryOne, run } from '../db/database.js';
import { getMarketDefinition } from './marketRegistry.js';
import { syncPredictionToSupabase } from '../db/supabaseClient.js';

export interface CreatePredictionItem {
  matchId: number;
  marketType: string;
  selection: string;
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
   * Validate that the match exists and has not started yet.
   */
  public static validateMatchForPrediction(matchId: number) {
    const match = queryOne<{
      id: number;
      utc_date: string;
      status: string;
      home_team_name: string;
      away_team_name: string;
    }>('SELECT id, utc_date, status, home_team_name, away_team_name FROM matches WHERE id = ?', [matchId]);

    if (!match) {
      throw new Error(`Match #${matchId} not found.`);
    }

    const kickoff = new Date(match.utc_date).getTime();
    const now = Date.now();

    if (kickoff <= now) {
      throw new Error(`Match ${match.home_team_name} vs ${match.away_team_name} has already started. Predictions are locked.`);
    }

    if (match.status !== 'TIMED' && match.status !== 'SCHEDULED') {
      throw new Error(`Match ${match.home_team_name} vs ${match.away_team_name} is no longer accepting predictions (status: ${match.status}).`);
    }

    return match;
  }

  /**
   * Create a single or multiple Basic Mode predictions.
   * In Basic Mode, users can only have 10 selections per day (resets daily at 00:00 UTC).
   * If a prediction for the same match and market already exists for this user and is still PENDING,
   * we update the selection without consuming an additional daily slot.
   */
  public static createBasicPredictions(userId: number, items: CreatePredictionItem[]) {
    if (!items || items.length === 0) {
      throw new Error('No predictions submitted');
    }

    if (items.length > 10) {
      throw new Error('In Basic Mode, users can only have 10 selections per day (limit of 10 selections).');
    }

    // Check user's current Basic predictions created today (UTC day)
    const dailyRow = queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM predictions WHERE user_id = ? AND mode = 'BASIC' AND date(created_at) = date('now')",
      [userId]
    );
    const currentDailyCount = dailyRow ? dailyRow.count : 0;

    // Determine how many items are NEW predictions vs updates to existing pending predictions
    let newSelectionsCount = 0;
    for (const item of items) {
      const existing = queryOne<{ id: number; status: string }>(
        "SELECT id, status FROM predictions WHERE user_id = ? AND match_id = ? AND market_type = ? AND mode = 'BASIC'",
        [userId, item.matchId, item.marketType]
      );
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
      const match = this.validateMatchForPrediction(item.matchId);
      const oddsPoints = this.getMarketOddsPoints(item.marketType, item.selection);

      // Check if user already predicted this market on this match
      const existing = queryOne<{ id: number; status: string }>(
        "SELECT id, status FROM predictions WHERE user_id = ? AND match_id = ? AND market_type = ? AND mode = 'BASIC'",
        [userId, item.matchId, item.marketType]
      );

      if (existing) {
        if (existing.status !== 'PENDING') {
          throw new Error(`Prediction #${existing.id} has already been graded.`);
        }
        // Update selection without resetting original creation date
        run(
          'UPDATE predictions SET selection = ?, odds_points = ?, is_verified_account = 1 WHERE id = ?',
          [item.selection, oddsPoints, existing.id]
        );
        syncPredictionToSupabase({
          id: existing.id,
          user_id: userId,
          match_id: item.matchId,
          mode: 'BASIC',
          market_type: item.marketType,
          selection: item.selection,
          odds_points: oddsPoints,
          status: 'PENDING',
        }).catch(() => {});
        results.push({ id: existing.id, updated: true, matchId: item.matchId, marketType: item.marketType, selection: item.selection, oddsPoints });
      } else {
        // Insert new
        const insertRes = run(
          `INSERT INTO predictions (user_id, match_id, mode, market_type, selection, odds_points, status, is_verified_account)
           VALUES (?, ?, 'BASIC', ?, ?, ?, 'PENDING', 1)`,
          [userId, item.matchId, item.marketType, item.selection, oddsPoints]
        );
        const newId = insertRes.lastInsertRowid;
        syncPredictionToSupabase({
          id: newId,
          user_id: userId,
          match_id: item.matchId,
          mode: 'BASIC',
          market_type: item.marketType,
          selection: item.selection,
          odds_points: oddsPoints,
          status: 'PENDING',
        }).catch(() => {});
        results.push({ id: newId, updated: false, matchId: item.matchId, marketType: item.marketType, selection: item.selection, oddsPoints });
      }
    }

    return results;
  }

  /**
   * Create a Serious Mode Set (grouped predictions).
   * Users can make as many selections as they want (1, 2, 5, 10, 20+ picks).
   * All predictions in the set must be for matches that have not started.
   */
  public static createSeriousSet(userId: number, setName: string, items: CreatePredictionItem[]) {
    if (!items || items.length < 1) {
      throw new Error('Serious Mode sets require at least 1 prediction. You can add as many selections as you want!');
    }

    const trimmedName = setName?.trim() || `Serious Set (${items.length} picks)`;

    // Pre-validate all matches before inserting anything
    let totalPotentialPoints = 0;
    const validatedItems: Array<{ matchId: number; marketType: string; selection: string; oddsPoints: number }> = [];

    for (const item of items) {
      this.validateMatchForPrediction(item.matchId);
      const oddsPoints = this.getMarketOddsPoints(item.marketType, item.selection);
      totalPotentialPoints += oddsPoints;
      validatedItems.push({
        matchId: item.matchId,
        marketType: item.marketType,
        selection: item.selection,
        oddsPoints,
      });
    }

    // Insert the serious set
    const setRes = run(
      `INSERT INTO serious_sets (user_id, name, status, potential_points, total_predictions)
       VALUES (?, ?, 'PENDING', ?, ?)`,
      [userId, trimmedName, totalPotentialPoints, validatedItems.length]
    );

    const setId = setRes.lastInsertRowid;

    // Insert the predictions linked to this set
    for (const val of validatedItems) {
      const predRes = run(
        `INSERT INTO predictions (user_id, match_id, mode, serious_set_id, market_type, selection, odds_points, status, is_verified_account)
         VALUES (?, ?, 'SERIOUS', ?, ?, ?, ?, 'PENDING', 1)`,
        [userId, val.matchId, setId, val.marketType, val.selection, val.oddsPoints]
      );
      syncPredictionToSupabase({
        id: predRes.lastInsertRowid,
        user_id: userId,
        match_id: val.matchId,
        mode: 'SERIOUS',
        serious_set_id: setId,
        market_type: val.marketType,
        selection: val.selection,
        odds_points: val.oddsPoints,
        status: 'PENDING',
      }).catch(() => {});
    }

    return {
      setId,
      setName: trimmedName,
      potentialPoints: totalPotentialPoints,
      predictionsCount: validatedItems.length,
    };
  }

  /**
   * Get all predictions for a user, optionally filtered by mode and status
   */
  public static getUserPredictions(userId: number, mode?: 'BASIC' | 'SERIOUS', status?: string) {
    let sql = `
      SELECT p.*,
             m.home_team_name, m.home_team_short, m.home_team_crest,
             m.away_team_name, m.away_team_short, m.away_team_crest,
             m.competition_name, m.competition_emblem,
             m.utc_date as match_date, m.status as match_status,
             m.home_score, m.away_score, m.home_corners, m.away_corners,
             s.name as set_name, s.status as set_status, s.points_delta as set_points_delta
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      LEFT JOIN serious_sets s ON p.serious_set_id = s.id
      WHERE p.user_id = ?
    `;
    const params: any[] = [userId];

    if (mode) {
      sql += ' AND p.mode = ?';
      params.push(mode);
    }

    if (status === 'DONE' || status === 'COMPLETED') {
      sql += " AND p.status IN ('CORRECT', 'INCORRECT') AND m.status = 'FINISHED'";
    } else if (status === 'PENDING') {
      sql += " AND p.status = 'PENDING'";
    } else if (status === 'CORRECT' || status === 'INCORRECT') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY COALESCE(p.resolved_at, p.created_at) DESC';

    return queryAll(sql, params);
  }

  /**
   * Get all Serious Sets for a user with their nested predictions
   */
  public static getUserSeriousSets(userId: number) {
    const sets = queryAll<any>(
      `SELECT * FROM serious_sets WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    const setIds = sets.map((s) => s.id);
    if (setIds.length === 0) return [];

    const preds = queryAll<any>(
      `SELECT p.*,
              m.home_team_name, m.home_team_short, m.home_team_crest,
              m.away_team_name, m.away_team_short, m.away_team_crest,
              m.competition_name, m.utc_date as match_date, m.status as match_status,
              m.home_score, m.away_score, m.home_corners, m.away_corners
       FROM predictions p
       JOIN matches m ON p.match_id = m.id
       WHERE p.serious_set_id IN (${setIds.map(() => '?').join(',')})
       ORDER BY p.id ASC`,
      setIds
    );

    const predsBySet: Record<number, any[]> = {};
    for (const p of preds) {
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
   * Only completed predictions and finalized sets are displayed publicly.
   */
  public static getUserProfile(userId: number) {
    const user = queryOne<{
      id: number;
      username: string;
      basic_points: number;
      serious_points: number;
      basic_streak: number;
      basic_best_streak: number;
      serious_streak: number;
      serious_best_streak: number;
      created_at: string;
    }>(
      `SELECT id, username, basic_points, serious_points,
              basic_streak, basic_best_streak, serious_streak, serious_best_streak,
              created_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (!user) {
      throw new Error(`User #${userId} not found`);
    }

    const predictions = this.getUserPredictions(userId, undefined, 'DONE');
    const seriousSets = this.getUserSeriousSets(userId).filter(
      (s: any) => s.status === 'WON' || s.status === 'LOST'
    );

    const correctCount = predictions.filter((p: any) => p.status === 'CORRECT').length;
    const incorrectCount = predictions.filter((p: any) => p.status === 'INCORRECT').length;
    const pendingCount = 0;
    const totalResolved = correctCount + incorrectCount;
    const winRate = totalResolved > 0 ? Math.round((correctCount / totalResolved) * 100) : 0;

    const wonSets = seriousSets.filter((s: any) => s.status === 'WON').length;
    const lostSets = seriousSets.filter((s: any) => s.status === 'LOST').length;

    // Rank in basic and serious leaderboards
    const basicRankRow = queryOne<{ rank: number }>(
      `SELECT count(*) + 1 as rank FROM users WHERE basic_points > ?`,
      [user.basic_points]
    );
    const seriousRankRow = queryOne<{ rank: number }>(
      `SELECT count(*) + 1 as rank FROM users WHERE serious_points > ?`,
      [user.serious_points]
    );

    return {
      user: {
        ...user,
        basicRank: basicRankRow?.rank || 1,
        seriousRank: seriousRankRow?.rank || 1,
      },
      stats: {
        totalPredictions: predictions.length,
        correctCount,
        incorrectCount,
        pendingCount,
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
   * Get community feed of other users' predictions across all matches.
   * Strictly filters for predictions that are DONE (from finished matches). No pending results.
   */
  public static getCommunityPredictions(mode?: 'BASIC' | 'SERIOUS', status?: string, limit: number = 60) {
    let sql = `
      SELECT p.*,
             u.username, u.basic_points, u.serious_points, u.basic_streak, u.serious_streak,
             m.home_team_name, m.home_team_short, m.home_team_crest,
             m.away_team_name, m.away_team_short, m.away_team_crest,
             m.competition_name, m.competition_emblem,
             m.utc_date as match_date, m.status as match_status,
             m.home_score, m.away_score, m.home_corners, m.away_corners,
             s.name as set_name, s.status as set_status, s.points_delta as set_points_delta
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN matches m ON p.match_id = m.id
      LEFT JOIN serious_sets s ON p.serious_set_id = s.id
      WHERE p.status IN ('CORRECT', 'INCORRECT')
        AND m.status = 'FINISHED'
    `;
    const params: any[] = [];

    if (mode) {
      sql += ' AND p.mode = ?';
      params.push(mode);
    }

    if (status === 'CORRECT' || status === 'INCORRECT') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY COALESCE(p.resolved_at, m.utc_date) DESC LIMIT ?';
    params.push(limit);

    return queryAll(sql, params);
  }

  /**
   * Get all completed predictions made on a specific finished match.
   */
  public static getMatchCommunityPredictions(matchId: number) {
    return queryAll(
      `SELECT p.*,
              u.username, u.basic_points, u.serious_points,
              s.name as set_name, s.status as set_status
       FROM predictions p
       JOIN users u ON p.user_id = u.id
       JOIN matches m ON p.match_id = m.id
       LEFT JOIN serious_sets s ON p.serious_set_id = s.id
       WHERE p.match_id = ?
         AND p.status IN ('CORRECT', 'INCORRECT')
         AND m.status = 'FINISHED'
       ORDER BY p.resolved_at DESC`,
      [matchId]
    );
  }
}
