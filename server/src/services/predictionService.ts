import { db, queryAll, queryOne, run } from '../db/database.js';

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
   * If a prediction for the same match and market already exists for this user and is still PENDING,
   * we update the selection (or allow them to update prior to kickoff).
   */
  public static createBasicPredictions(userId: number, items: CreatePredictionItem[]) {
    if (!items || items.length === 0) {
      throw new Error('No predictions submitted');
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
        // Update selection
        run(
          'UPDATE predictions SET selection = ?, odds_points = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
          [item.selection, oddsPoints, existing.id]
        );
        results.push({ id: existing.id, updated: true, matchId: item.matchId, marketType: item.marketType, selection: item.selection, oddsPoints });
      } else {
        // Insert new
        const insertRes = run(
          `INSERT INTO predictions (user_id, match_id, mode, market_type, selection, odds_points, status)
           VALUES (?, ?, 'BASIC', ?, ?, ?, 'PENDING')`,
          [userId, item.matchId, item.marketType, item.selection, oddsPoints]
        );
        results.push({ id: insertRes.lastInsertRowid, updated: false, matchId: item.matchId, marketType: item.marketType, selection: item.selection, oddsPoints });
      }
    }

    return results;
  }

  /**
   * Create a Serious Mode Set (grouped predictions).
   * All predictions in the set must be for matches that have not started.
   */
  public static createSeriousSet(userId: number, setName: string, items: CreatePredictionItem[]) {
    if (!items || items.length < 2) {
      throw new Error('Serious Mode sets require at least 2 predictions.');
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
      run(
        `INSERT INTO predictions (user_id, match_id, mode, serious_set_id, market_type, selection, odds_points, status)
         VALUES (?, ?, 'SERIOUS', ?, ?, ?, ?, 'PENDING')`,
        [userId, val.matchId, setId, val.marketType, val.selection, val.oddsPoints]
      );
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

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC';

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
}
