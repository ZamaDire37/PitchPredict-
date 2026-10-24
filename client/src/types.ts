export type GameMode = 'BASIC' | 'SERIOUS';

export interface User {
  id: number;
  username: string;
  email: string;
  basic_points: number;
  serious_points: number;
  basic_streak: number;
  basic_best_streak: number;
  serious_streak: number;
  serious_best_streak: number;
  created_at?: string;
}

export interface Match {
  id: number;
  external_id: number;
  competition_id: string;
  competition_name: string;
  competition_emblem?: string;
  utc_date: string;
  status: 'TIMED' | 'SCHEDULED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED';
  matchday: number;
  home_team_id?: number;
  home_team_name: string;
  home_team_short?: string;
  home_team_crest?: string;
  away_team_id?: number;
  away_team_name: string;
  away_team_short?: string;
  away_team_crest?: string;
  home_score?: number | null;
  away_score?: number | null;
  home_corners?: number | null;
  away_corners?: number | null;
  winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  is_graded?: number;
  prediction_count?: number;
  userPredictions?: UserPredictionSummary[];
}

export interface UserPredictionSummary {
  id: number;
  mode: GameMode;
  market_type: string;
  selection: string;
  status: 'PENDING' | 'CORRECT' | 'INCORRECT' | 'VOID';
  points_awarded: number;
}

export interface Prediction {
  id: number;
  user_id: number;
  match_id: number;
  mode: GameMode;
  serious_set_id?: number | null;
  market_type: string;
  selection: string;
  odds_points: number;
  status: 'PENDING' | 'CORRECT' | 'INCORRECT' | 'VOID';
  actual_result?: string | null;
  points_awarded: number;
  created_at: string;
  resolved_at?: string | null;

  // Joined match details
  home_team_name: string;
  home_team_short?: string;
  home_team_crest?: string;
  away_team_name: string;
  away_team_short?: string;
  away_team_crest?: string;
  competition_name: string;
  competition_emblem?: string;
  match_date: string;
  match_status: string;
  home_score?: number | null;
  away_score?: number | null;
  home_corners?: number | null;
  away_corners?: number | null;
  set_name?: string | null;
  set_status?: string | null;
  set_points_delta?: number | null;
}

export interface SeriousSet {
  id: number;
  user_id: number;
  name: string;
  status: 'PENDING' | 'WON' | 'LOST';
  potential_points: number;
  points_delta: number;
  total_predictions: number;
  correct_predictions: number;
  incorrect_predictions: number;
  created_at: string;
  resolved_at?: string | null;
  predictions: Prediction[];
}

export interface PointsHistoryEntry {
  id: number;
  user_id: number;
  mode: GameMode;
  delta: number;
  balance_after: number;
  reason: string;
  prediction_id?: number | null;
  serious_set_id?: number | null;
  created_at: string;
  market_type?: string;
  selection?: string;
  actual_result?: string;
  set_name?: string;
}

export interface StagedPrediction {
  match: Match;
  marketType: string;
  selection: string;
  oddsPoints: number;
}
