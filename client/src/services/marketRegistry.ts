export type MarketCategory = 'MATCH_RESULT' | 'GOALS' | 'BTTS' | 'CORNERS' | 'OTHER';

export interface MarketOption {
  id: string;
  label: string;
  oddsPoints: number;
  badge?: string;
  helper?: string;
}

export interface ClientMarketDefinition {
  id: string;
  name: string;
  category: MarketCategory;
  shortDesc: string;
  icon: string;
  badge?: string;
  getOptions: (homeTeam: string, awayTeam: string) => MarketOption[];
}

export interface CategoryInfo {
  id: MarketCategory;
  label: string;
  badge: string;
  icon: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'MATCH_RESULT',
    label: 'Match Result',
    badge: '5 Markets',
    icon: 'Trophy',
    description: 'Full-time winner, double chance, draw no bet, handicap & combos.',
  },
  {
    id: 'GOALS',
    label: 'Goals',
    badge: '7 Markets',
    icon: 'Target',
    description: 'Over/under lines, exact scores, team totals, brackets & odd/even.',
  },
  {
    id: 'BTTS',
    label: 'BTTS',
    badge: '4 Markets',
    icon: 'Flame',
    description: 'Both teams to score, BTTS combos, over/under combos & double chances.',
  },
  {
    id: 'CORNERS',
    label: 'Corners',
    badge: '5 Markets',
    icon: 'Flag',
    description: 'Total corner over/under lines, corner winner, team corners & bands.',
  },
  {
    id: 'OTHER',
    label: 'Other Markets',
    badge: '5 Markets',
    icon: 'Sparkles',
    description: 'Win to nil, clean sheets, victory margins & scoring distributions.',
  },
];

export const CLIENT_MARKETS: ClientMarketDefinition[] = [
  // ================= MATCH RESULT =================
  {
    id: 'MATCH_WINNER',
    name: 'Match Winner (1X2)',
    category: 'MATCH_RESULT',
    shortDesc: 'Pick the outright winner after regular 90 minutes.',
    icon: 'Trophy',
    badge: 'Core Market',
    getOptions: (home, away) => [
      { id: 'HOME', label: `${home} Win (1)`, oddsPoints: 10, badge: 'Home' },
      { id: 'DRAW', label: 'Draw (X)', oddsPoints: 15, badge: 'Draw' },
      { id: 'AWAY', label: `${away} Win (2)`, oddsPoints: 10, badge: 'Away' },
    ],
  },
  {
    id: 'DOUBLE_CHANCE',
    name: 'Double Chance',
    category: 'MATCH_RESULT',
    shortDesc: 'Cover two out of three possible full-time outcomes.',
    icon: 'Shield',
    badge: 'Safer Odds',
    getOptions: (home, away) => [
      { id: '1X', label: `1X (${home} or Draw)`, oddsPoints: 6, helper: 'Home win or draw' },
      { id: '12', label: '12 (Home or Away Win)', oddsPoints: 6, helper: 'Either team wins' },
      { id: 'X2', label: `X2 (Draw or ${away})`, oddsPoints: 6, helper: 'Draw or away win' },
    ],
  },
  {
    id: 'DRAW_NO_BET',
    name: 'Draw No Bet (DNB)',
    category: 'MATCH_RESULT',
    shortDesc: 'Back a team to win. If the match ends in a draw, the pick is pushed/refunded.',
    icon: 'RefreshCw',
    badge: 'Low Risk',
    getOptions: (home, away) => [
      { id: 'HOME_DNB', label: `${home} DNB`, oddsPoints: 8 },
      { id: 'AWAY_DNB', label: `${away} DNB`, oddsPoints: 8 },
    ],
  },
  {
    id: 'MATCH_RESULT_AND_TOTAL_GOALS',
    name: 'Result + Total Goals (2.5 Combo)',
    category: 'MATCH_RESULT',
    shortDesc: 'Combo prediction: Full-time winner combined with Over/Under 2.5 total goals.',
    icon: 'Combine',
    badge: 'Popular Combo',
    getOptions: (home, away) => [
      { id: 'HOME_OVER_2.5', label: `${home} Win & Over 2.5 Goals`, oddsPoints: 18, badge: 'Action Win' },
      { id: 'HOME_UNDER_2.5', label: `${home} Win & Under 2.5 Goals`, oddsPoints: 14, badge: 'Controlled' },
      { id: 'DRAW_OVER_2.5', label: 'Draw & Over 2.5 Goals (e.g. 2-2)', oddsPoints: 24, badge: 'Super Odds' },
      { id: 'DRAW_UNDER_2.5', label: 'Draw & Under 2.5 Goals (0-0, 1-1)', oddsPoints: 16 },
      { id: 'AWAY_OVER_2.5', label: `${away} Win & Over 2.5 Goals`, oddsPoints: 18, badge: 'Action Win' },
      { id: 'AWAY_UNDER_2.5', label: `${away} Win & Under 2.5 Goals`, oddsPoints: 14, badge: 'Controlled' },
    ],
  },
  {
    id: 'HANDICAP_RESULT',
    name: 'European Handicap (-1)',
    category: 'MATCH_RESULT',
    shortDesc: 'Home team starts with a 1-goal disadvantage (-1 goal handicap).',
    icon: 'Scale',
    badge: 'Handicap',
    getOptions: (home, away) => [
      { id: 'HOME_MINUS_1', label: `${home} (-1) [Wins by 2+ Goals]`, oddsPoints: 16, badge: 'Dominant' },
      { id: 'HANDICAP_TIE', label: `Handicap Tie (-1) [${home} by Exactly 1]`, oddsPoints: 18, badge: 'Tight Margin' },
      { id: 'AWAY_PLUS_1', label: `${away} (+1) [Win or Draw]`, oddsPoints: 14, badge: 'Safety' },
    ],
  },

  // ================= GOALS =================
  {
    id: 'GOALS_OVER_UNDER',
    name: 'Total Goals (Over / Under)',
    category: 'GOALS',
    shortDesc: 'Combined total match goals scored by both teams.',
    icon: 'Target',
    badge: '12 Lines Available',
    getOptions: () => [
      { id: 'OVER_0.5', label: 'Over 0.5 Goals (At least 1 goal)', oddsPoints: 5, badge: 'Very Safe' },
      { id: 'UNDER_0.5', label: 'Under 0.5 Goals (0-0 Bore Draw)', oddsPoints: 35, badge: '+35 pts Massive' },
      { id: 'OVER_1.5', label: 'Over 1.5 Goals', oddsPoints: 8 },
      { id: 'UNDER_1.5', label: 'Under 1.5 Goals', oddsPoints: 8 },
      { id: 'OVER_2.5', label: 'Over 2.5 Goals', oddsPoints: 10, badge: 'Top Pick' },
      { id: 'UNDER_2.5', label: 'Under 2.5 Goals', oddsPoints: 10, badge: 'Top Pick' },
      { id: 'OVER_3.5', label: 'Over 3.5 Goals', oddsPoints: 14 },
      { id: 'UNDER_3.5', label: 'Under 3.5 Goals', oddsPoints: 12 },
      { id: 'OVER_4.5', label: 'Over 4.5 Goals', oddsPoints: 18 },
      { id: 'UNDER_4.5', label: 'Under 4.5 Goals', oddsPoints: 18 },
      { id: 'OVER_5.5', label: 'Over 5.5 Goals (Goal Frenzy)', oddsPoints: 28, badge: 'High Reward' },
      { id: 'UNDER_5.5', label: 'Under 5.5 Goals', oddsPoints: 6 },
    ],
  },
  {
    id: 'EXACT_SCORE',
    name: 'Exact Score',
    category: 'GOALS',
    shortDesc: 'Predict the precise final scoreline after 90 minutes for big point rewards.',
    icon: 'Grid',
    badge: 'Up to +50 pts High Reward',
    getOptions: () => [
      { id: '1-0', label: '1 - 0', oddsPoints: 30 },
      { id: '2-0', label: '2 - 0', oddsPoints: 30 },
      { id: '2-1', label: '2 - 1', oddsPoints: 30, badge: 'Popular' },
      { id: '3-0', label: '3 - 0', oddsPoints: 30 },
      { id: '3-1', label: '3 - 1', oddsPoints: 30 },
      { id: '3-2', label: '3 - 2', oddsPoints: 35 },
      { id: '4-0', label: '4 - 0', oddsPoints: 40, badge: 'Big Win' },
      { id: '4-1', label: '4 - 1', oddsPoints: 35 },
      { id: '4-2', label: '4 - 2', oddsPoints: 50, badge: '+50 pts' },
      { id: '0-0', label: '0 - 0', oddsPoints: 30, badge: 'Draw' },
      { id: '1-1', label: '1 - 1', oddsPoints: 30, badge: 'Draw' },
      { id: '2-2', label: '2 - 2', oddsPoints: 30, badge: 'Draw' },
      { id: '3-3', label: '3 - 3', oddsPoints: 45, badge: '+45 pts' },
      { id: '0-1', label: '0 - 1', oddsPoints: 30 },
      { id: '0-2', label: '0 - 2', oddsPoints: 30 },
      { id: '1-2', label: '1 - 2', oddsPoints: 30 },
      { id: '0-3', label: '0 - 3', oddsPoints: 30 },
      { id: '1-3', label: '1 - 3', oddsPoints: 30 },
      { id: '2-3', label: '2 - 3', oddsPoints: 35 },
      { id: '0-4', label: '0 - 4', oddsPoints: 40, badge: 'Big Win' },
      { id: '1-4', label: '1 - 4', oddsPoints: 35 },
      { id: '2-4', label: '2 - 4', oddsPoints: 50, badge: '+50 pts' },
      { id: 'ANY_OTHER_SCORE', label: 'Any Other Unlisted Score', oddsPoints: 30, badge: 'Any Other' },
    ],
  },
  {
    id: 'HOME_TEAM_GOALS',
    name: 'Home Team Total Goals',
    category: 'GOALS',
    shortDesc: 'Predict the total goals scored strictly by the home team.',
    icon: 'Home',
    badge: 'Team Special',
    getOptions: (home) => [
      { id: 'HOME_OVER_0.5', label: `${home} Over 0.5 Goals (Scores at least 1)`, oddsPoints: 6 },
      { id: 'HOME_UNDER_0.5', label: `${home} Under 0.5 Goals (Fails to Score)`, oddsPoints: 15 },
      { id: 'HOME_OVER_1.5', label: `${home} Over 1.5 Goals (Scores 2+)`, oddsPoints: 12 },
      { id: 'HOME_UNDER_1.5', label: `${home} Under 1.5 Goals (Scores 0 or 1)`, oddsPoints: 10 },
      { id: 'HOME_OVER_2.5', label: `${home} Over 2.5 Goals (Scores 3+)`, oddsPoints: 20, badge: 'High Reward' },
      { id: 'HOME_UNDER_2.5', label: `${home} Under 2.5 Goals (Scores 2 or less)`, oddsPoints: 8 },
    ],
  },
  {
    id: 'AWAY_TEAM_GOALS',
    name: 'Away Team Total Goals',
    category: 'GOALS',
    shortDesc: 'Predict the total goals scored strictly by the away team.',
    icon: 'Plane',
    badge: 'Team Special',
    getOptions: (_, away) => [
      { id: 'AWAY_OVER_0.5', label: `${away} Over 0.5 Goals (Scores at least 1)`, oddsPoints: 6 },
      { id: 'AWAY_UNDER_0.5', label: `${away} Under 0.5 Goals (Fails to Score)`, oddsPoints: 15 },
      { id: 'AWAY_OVER_1.5', label: `${away} Over 1.5 Goals (Scores 2+)`, oddsPoints: 12 },
      { id: 'AWAY_UNDER_1.5', label: `${away} Under 1.5 Goals (Scores 0 or 1)`, oddsPoints: 10 },
      { id: 'AWAY_OVER_2.5', label: `${away} Over 2.5 Goals (Scores 3+)`, oddsPoints: 20, badge: 'High Reward' },
      { id: 'AWAY_UNDER_2.5', label: `${away} Under 2.5 Goals (Scores 2 or less)`, oddsPoints: 8 },
    ],
  },
  {
    id: 'EXACT_TOTAL_GOALS',
    name: 'Exact Total Goals',
    category: 'GOALS',
    shortDesc: 'Predict the exact total count of goals scored in the match.',
    icon: 'ListOrdered',
    badge: 'Exact Count',
    getOptions: () => [
      { id: '0_GOALS', label: 'Exactly 0 Goals (0-0)', oddsPoints: 35, badge: 'Big Odds' },
      { id: '1_GOAL', label: 'Exactly 1 Goal', oddsPoints: 16 },
      { id: '2_GOALS', label: 'Exactly 2 Goals', oddsPoints: 10, badge: 'Common' },
      { id: '3_GOALS', label: 'Exactly 3 Goals', oddsPoints: 12, badge: 'Common' },
      { id: '4_GOALS', label: 'Exactly 4 Goals', oddsPoints: 18 },
      { id: '5+_GOALS', label: 'Exactly 5 or More Goals', oddsPoints: 24, badge: 'High Total' },
    ],
  },
  {
    id: 'TOTAL_GOALS_RANGE',
    name: 'Total Goals Range',
    category: 'GOALS',
    shortDesc: 'Select the goal range for the full match.',
    icon: 'Layers',
    badge: '4 Goal Bands',
    getOptions: () => [
      { id: '0-1_GOALS', label: '0 - 1 Goals (Low Scoring)', oddsPoints: 12 },
      { id: '2-3_GOALS', label: '2 - 3 Goals (Normal Range)', oddsPoints: 8, badge: 'Top Pick' },
      { id: '4-5_GOALS', label: '4 - 5 Goals (High Scoring)', oddsPoints: 16 },
      { id: '6+_GOALS', label: '6+ Goals (Extreme Fest)', oddsPoints: 28, badge: 'High Reward' },
    ],
  },
  {
    id: 'ODD_EVEN_GOALS',
    name: 'Odd / Even Total Goals',
    category: 'GOALS',
    shortDesc: 'Will total combined goals be an odd or even number?',
    icon: 'Hash',
    badge: '50/50 Chance',
    getOptions: () => [
      { id: 'ODD', label: 'Odd Goals (e.g. 1, 3, 5)', oddsPoints: 10 },
      { id: 'EVEN', label: 'Even Goals (e.g. 0, 2, 4)', oddsPoints: 10 },
    ],
  },

  // ================= BTTS =================
  {
    id: 'BTTS',
    name: 'Both Teams to Score (BTTS)',
    category: 'BTTS',
    shortDesc: 'Predict whether both teams will score at least one goal in regular time.',
    icon: 'Flame',
    badge: 'Popular',
    getOptions: () => [
      { id: 'YES', label: 'Yes (Both Teams Score)', oddsPoints: 10, badge: 'Popular' },
      { id: 'NO', label: 'No (At least one Clean Sheet)', oddsPoints: 10 },
    ],
  },
  {
    id: 'BTTS_AND_WIN',
    name: 'BTTS + Match Winner Combo',
    category: 'BTTS',
    shortDesc: 'Both teams score AND a team wins or match is drawn.',
    icon: 'Combine',
    badge: 'High Value',
    getOptions: (home, away) => [
      { id: 'BTTS_YES_HOME', label: `BTTS & ${home} Win`, oddsPoints: 20, badge: 'High Value' },
      { id: 'BTTS_YES_DRAW', label: 'BTTS & Draw (e.g. 1-1, 2-2)', oddsPoints: 22, badge: 'Draw Combo' },
      { id: 'BTTS_YES_AWAY', label: `BTTS & ${away} Win`, oddsPoints: 20, badge: 'High Value' },
    ],
  },
  {
    id: 'BTTS_AND_OVER_UNDER',
    name: 'BTTS + Total Goals (Over/Under 2.5)',
    category: 'BTTS',
    shortDesc: 'Combine both teams scoring with over or under 2.5 total goals.',
    icon: 'Sparkles',
    badge: 'Special Combo',
    getOptions: () => [
      { id: 'BTTS_YES_OVER_2.5', label: 'BTTS Yes & Over 2.5 (e.g. 2-1, 2-2)', oddsPoints: 14, badge: 'Action Match' },
      { id: 'BTTS_YES_UNDER_2.5', label: 'BTTS Yes & Under 2.5 (Only 1-1 Draw)', oddsPoints: 25, badge: 'High Reward' },
      { id: 'BTTS_NO_OVER_2.5', label: 'BTTS No & Over 2.5 (e.g. 3-0, 0-4)', oddsPoints: 18, badge: 'Clean Sheet Win' },
      { id: 'BTTS_NO_UNDER_2.5', label: 'BTTS No & Under 2.5 (e.g. 1-0, 0-0, 0-2)', oddsPoints: 10, badge: 'Tight Match' },
    ],
  },
  {
    id: 'BTTS_OR_OVER_2_5',
    name: 'BTTS or Over 2.5 Goals',
    category: 'BTTS',
    shortDesc: 'Wins if either both teams score OR there are 3+ total goals in the match.',
    icon: 'ShieldCheck',
    badge: 'Double Chance Style',
    getOptions: () => [
      { id: 'BTTS_OR_OVER_YES', label: 'Yes (Either Both Score OR 3+ Goals)', oddsPoints: 7, badge: 'High Probability' },
      { id: 'BTTS_OR_OVER_NO', label: 'Neither (Under 2.5 & Clean Sheet: 0-0, 1-0, 2-0)', oddsPoints: 16, badge: 'Underdog' },
    ],
  },

  // ================= CORNERS =================
  {
    id: 'CORNERS_OVER_UNDER',
    name: 'Total Corners (Over / Under)',
    category: 'CORNERS',
    shortDesc: 'Combined total corner kicks taken by both clubs.',
    icon: 'Flag',
    badge: '14 Corner Lines',
    getOptions: () => [
      { id: 'OVER_6.5', label: 'Over 6.5 Corners', oddsPoints: 6 },
      { id: 'UNDER_6.5', label: 'Under 6.5 Corners', oddsPoints: 22, badge: 'Low Corners' },
      { id: 'OVER_7.5', label: 'Over 7.5 Corners', oddsPoints: 8 },
      { id: 'UNDER_7.5', label: 'Under 7.5 Corners', oddsPoints: 16 },
      { id: 'OVER_8.5', label: 'Over 8.5 Corners', oddsPoints: 10 },
      { id: 'UNDER_8.5', label: 'Under 8.5 Corners', oddsPoints: 12 },
      { id: 'OVER_9.5', label: 'Over 9.5 Corners', oddsPoints: 12, badge: 'Top Line' },
      { id: 'UNDER_9.5', label: 'Under 9.5 Corners', oddsPoints: 12, badge: 'Top Line' },
      { id: 'OVER_10.5', label: 'Over 10.5 Corners', oddsPoints: 14 },
      { id: 'UNDER_10.5', label: 'Under 10.5 Corners', oddsPoints: 10 },
      { id: 'OVER_11.5', label: 'Over 11.5 Corners', oddsPoints: 16 },
      { id: 'UNDER_11.5', label: 'Under 11.5 Corners', oddsPoints: 8 },
      { id: 'OVER_12.5', label: 'Over 12.5 Corners', oddsPoints: 22, badge: 'Corner Barrage' },
      { id: 'UNDER_12.5', label: 'Under 12.5 Corners', oddsPoints: 6 },
    ],
  },
  {
    id: 'MOST_CORNERS',
    name: 'Most Corner Kicks (Corner Winner)',
    category: 'CORNERS',
    shortDesc: 'Which team will take the highest number of corner kicks?',
    icon: 'Compass',
    badge: 'Corner 1X2',
    getOptions: (home, away) => [
      { id: 'HOME_MOST_CORNERS', label: `${home} Most Corners`, oddsPoints: 12, badge: 'Home' },
      { id: 'EQUAL_CORNERS', label: 'Equal Corners (Tie)', oddsPoints: 20, badge: 'Tie' },
      { id: 'AWAY_MOST_CORNERS', label: `${away} Most Corners`, oddsPoints: 12, badge: 'Away' },
    ],
  },
  {
    id: 'HOME_TEAM_CORNERS',
    name: 'Home Team Total Corners',
    category: 'CORNERS',
    shortDesc: 'Predict the total number of corner kicks taken by the home team.',
    icon: 'Home',
    badge: 'Team Corners',
    getOptions: (home) => [
      { id: 'HOME_CORNERS_OVER_3.5', label: `${home} Over 3.5 Corners`, oddsPoints: 8 },
      { id: 'HOME_CORNERS_UNDER_3.5', label: `${home} Under 3.5 Corners`, oddsPoints: 12 },
      { id: 'HOME_CORNERS_OVER_4.5', label: `${home} Over 4.5 Corners`, oddsPoints: 10, badge: 'Popular' },
      { id: 'HOME_CORNERS_UNDER_4.5', label: `${home} Under 4.5 Corners`, oddsPoints: 10 },
      { id: 'HOME_CORNERS_OVER_5.5', label: `${home} Over 5.5 Corners`, oddsPoints: 14 },
      { id: 'HOME_CORNERS_UNDER_5.5', label: `${home} Under 5.5 Corners`, oddsPoints: 8 },
    ],
  },
  {
    id: 'AWAY_TEAM_CORNERS',
    name: 'Away Team Total Corners',
    category: 'CORNERS',
    shortDesc: 'Predict the total number of corner kicks taken by the away team.',
    icon: 'Plane',
    badge: 'Team Corners',
    getOptions: (_, away) => [
      { id: 'AWAY_CORNERS_OVER_3.5', label: `${away} Over 3.5 Corners`, oddsPoints: 8 },
      { id: 'AWAY_CORNERS_UNDER_3.5', label: `${away} Under 3.5 Corners`, oddsPoints: 12 },
      { id: 'AWAY_CORNERS_OVER_4.5', label: `${away} Over 4.5 Corners`, oddsPoints: 10, badge: 'Popular' },
      { id: 'AWAY_CORNERS_UNDER_4.5', label: `${away} Under 4.5 Corners`, oddsPoints: 10 },
      { id: 'AWAY_CORNERS_OVER_5.5', label: `${away} Over 5.5 Corners`, oddsPoints: 14 },
      { id: 'AWAY_CORNERS_UNDER_5.5', label: `${away} Under 5.5 Corners`, oddsPoints: 8 },
    ],
  },
  {
    id: 'TOTAL_CORNERS_RANGE',
    name: 'Total Corners Range',
    category: 'CORNERS',
    shortDesc: 'Select the total corners bracket for the match.',
    icon: 'Layers',
    badge: 'Corner Bands',
    getOptions: () => [
      { id: 'UNDER_8_CORNERS', label: 'Under 8 Corners (Low Count)', oddsPoints: 12 },
      { id: '8-11_CORNERS', label: '8 - 11 Corners (Standard)', oddsPoints: 8, badge: 'Top Pick' },
      { id: '12+_CORNERS', label: '12+ Corners (Heavy Activity)', oddsPoints: 15, badge: 'High Count' },
    ],
  },

  // ================= OTHER MARKETS =================
  {
    id: 'WIN_TO_NIL',
    name: 'Win to Nil (Clean Sheet Win)',
    category: 'OTHER',
    shortDesc: 'A team wins the match without conceding any goals.',
    icon: 'Shield',
    badge: 'Special Combo',
    getOptions: (home, away) => [
      { id: 'HOME_WIN_TO_NIL', label: `${home} Win to Nil (e.g. 1-0, 2-0, 3-0)`, oddsPoints: 16, badge: 'Home Special' },
      { id: 'AWAY_WIN_TO_NIL', label: `${away} Win to Nil (e.g. 0-1, 0-2, 0-3)`, oddsPoints: 18, badge: 'Away Special' },
      { id: 'NEITHER_WIN_TO_NIL', label: 'Neither (Both Score or Draw)', oddsPoints: 8 },
    ],
  },
  {
    id: 'TEAM_TO_SCORE',
    name: 'Scoring Distribution',
    category: 'OTHER',
    shortDesc: 'Which clubs will get on the scoresheet during the match?',
    icon: 'Users',
    badge: 'Team Distribution',
    getOptions: (home, away) => [
      { id: 'BOTH_TEAMS_SCORE', label: `Both Teams Score (${home} & ${away})`, oddsPoints: 10, badge: 'Popular' },
      { id: 'ONLY_HOME_SCORES', label: `Only ${home} Scores (${away} 0 Goals)`, oddsPoints: 14 },
      { id: 'ONLY_AWAY_SCORES', label: `Only ${away} Scores (${home} 0 Goals)`, oddsPoints: 16 },
      { id: 'NEITHER_SCORES', label: 'Neither Scores (0-0 Scoreline)', oddsPoints: 35, badge: 'Big Odds' },
    ],
  },
  {
    id: 'CLEAN_SHEET_HOME',
    name: 'Home Team Clean Sheet',
    category: 'OTHER',
    shortDesc: 'Will the home team concede 0 goals in 90 minutes?',
    icon: 'ShieldCheck',
    badge: 'Home Defense',
    getOptions: (home) => [
      { id: 'HOME_CS_YES', label: `${home} Clean Sheet (Yes)`, oddsPoints: 12 },
      { id: 'HOME_CS_NO', label: `${home} Concedes (No)`, oddsPoints: 8 },
    ],
  },
  {
    id: 'CLEAN_SHEET_AWAY',
    name: 'Away Team Clean Sheet',
    category: 'OTHER',
    shortDesc: 'Will the away team concede 0 goals in 90 minutes?',
    icon: 'ShieldCheck',
    badge: 'Away Defense',
    getOptions: (_, away) => [
      { id: 'AWAY_CS_YES', label: `${away} Clean Sheet (Yes)`, oddsPoints: 14 },
      { id: 'AWAY_CS_NO', label: `${away} Concedes (No)`, oddsPoints: 8 },
    ],
  },
  {
    id: 'WINNING_MARGIN',
    name: 'Winning Margin',
    category: 'OTHER',
    shortDesc: 'Difference in goals between the winning team and losing team.',
    icon: 'Scale',
    badge: 'Margin Odds',
    getOptions: (home, away) => [
      { id: 'MARGIN_DRAW', label: 'Any Draw (0 Goal Margin)', oddsPoints: 15, badge: 'Draw' },
      { id: 'HOME_BY_1', label: `${home} Wins by Exactly 1 Goal`, oddsPoints: 14 },
      { id: 'HOME_BY_2+', label: `${home} Wins by 2 or More Goals`, oddsPoints: 16 },
      { id: 'AWAY_BY_1', label: `${away} Wins by Exactly 1 Goal`, oddsPoints: 14 },
      { id: 'AWAY_BY_2+', label: `${away} Wins by 2 or More Goals`, oddsPoints: 18 },
      { id: 'BIG_MARGIN_3+', label: 'Either Team Wins by 3+ Goals', oddsPoints: 22, badge: 'Blowout' },
    ],
  },
];
