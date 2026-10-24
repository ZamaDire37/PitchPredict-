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
    badge: 'Core',
    icon: 'Trophy',
    description: 'Full-time winner, double chance, and draw no bet selections.',
  },
  {
    id: 'GOALS',
    label: 'Goals',
    badge: 'Popular',
    icon: 'Target',
    description: 'Over/under goal lines, exact score predictions, and goal ranges.',
  },
  {
    id: 'BTTS',
    label: 'BTTS',
    badge: 'High Action',
    icon: 'Flame',
    description: 'Both teams to score yes/no and combined match result picks.',
  },
  {
    id: 'CORNERS',
    label: 'Corners',
    badge: 'Tactical',
    icon: 'Flag',
    description: 'Over/under total corner lines and most corners team markets.',
  },
  {
    id: 'OTHER',
    label: 'Other Markets',
    badge: 'Special',
    icon: 'Sparkles',
    description: 'Clean sheets, winning margins, and odd/even goal totals.',
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
    badge: 'Most Popular',
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
      { id: '12', label: '12 (Home or Away win)', oddsPoints: 6, helper: 'Either team wins' },
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

  // ================= GOALS =================
  {
    id: 'GOALS_OVER_UNDER',
    name: 'Total Goals (Over / Under)',
    category: 'GOALS',
    shortDesc: 'Combined total match goals scored by both teams.',
    icon: 'Target',
    badge: 'Multiple Lines',
    getOptions: () => [
      { id: 'OVER_1.5', label: 'Over 1.5 Goals', oddsPoints: 8 },
      { id: 'UNDER_1.5', label: 'Under 1.5 Goals', oddsPoints: 8 },
      { id: 'OVER_2.5', label: 'Over 2.5 Goals', oddsPoints: 10, badge: 'Top Pick' },
      { id: 'UNDER_2.5', label: 'Under 2.5 Goals', oddsPoints: 10, badge: 'Top Pick' },
      { id: 'OVER_3.5', label: 'Over 3.5 Goals', oddsPoints: 12 },
      { id: 'UNDER_3.5', label: 'Under 3.5 Goals', oddsPoints: 12 },
      { id: 'OVER_4.5', label: 'Over 4.5 Goals', oddsPoints: 18 },
      { id: 'UNDER_4.5', label: 'Under 4.5 Goals', oddsPoints: 18 },
    ],
  },
  {
    id: 'EXACT_SCORE',
    name: 'Exact Score',
    category: 'GOALS',
    shortDesc: 'Predict the exact final scoreline after 90 minutes for big point rewards.',
    icon: 'Grid',
    badge: '+30 pts Reward',
    getOptions: () => [
      { id: '1-0', label: '1 - 0', oddsPoints: 30 },
      { id: '2-0', label: '2 - 0', oddsPoints: 30 },
      { id: '2-1', label: '2 - 1', oddsPoints: 30, badge: 'Popular' },
      { id: '3-0', label: '3 - 0', oddsPoints: 30 },
      { id: '3-1', label: '3 - 1', oddsPoints: 30 },
      { id: '3-2', label: '3 - 2', oddsPoints: 30 },
      { id: '0-0', label: '0 - 0', oddsPoints: 30 },
      { id: '1-1', label: '1 - 1', oddsPoints: 30, badge: 'Draw' },
      { id: '2-2', label: '2 - 2', oddsPoints: 30 },
      { id: '0-1', label: '0 - 1', oddsPoints: 30 },
      { id: '0-2', label: '0 - 2', oddsPoints: 30 },
      { id: '1-2', label: '1 - 2', oddsPoints: 30 },
      { id: '0-3', label: '0 - 3', oddsPoints: 30 },
      { id: '1-3', label: '1 - 3', oddsPoints: 30 },
    ],
  },
  {
    id: 'TOTAL_GOALS_RANGE',
    name: 'Total Goals Range',
    category: 'GOALS',
    shortDesc: 'Pick the bracket of total goals scored during the match.',
    icon: 'Layers',
    getOptions: () => [
      { id: '0-1_GOALS', label: '0 - 1 Goals (Low Scoring)', oddsPoints: 12 },
      { id: '2-3_GOALS', label: '2 - 3 Goals (Normal Range)', oddsPoints: 8, badge: 'Likely' },
      { id: '4+_GOALS', label: '4+ Goals (Goal Fest)', oddsPoints: 14 },
    ],
  },
  {
    id: 'ODD_EVEN_GOALS',
    name: 'Odd / Even Total Goals',
    category: 'GOALS',
    shortDesc: 'Will the total number of goals scored be odd or even?',
    icon: 'Hash',
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
      { id: 'BTTS_YES_HOME', label: `BTTS & ${home} Win`, oddsPoints: 20 },
      { id: 'BTTS_YES_DRAW', label: 'BTTS & Draw (1-1, 2-2)', oddsPoints: 22 },
      { id: 'BTTS_YES_AWAY', label: `BTTS & ${away} Win`, oddsPoints: 20 },
    ],
  },

  // ================= CORNERS =================
  {
    id: 'CORNERS_OVER_UNDER',
    name: 'Total Corners (Over / Under)',
    category: 'CORNERS',
    shortDesc: 'Combined total corner kicks taken by both clubs.',
    icon: 'Flag',
    badge: 'Full Lines',
    getOptions: () => [
      { id: 'OVER_7.5', label: 'Over 7.5 Corners', oddsPoints: 8 },
      { id: 'UNDER_7.5', label: 'Under 7.5 Corners', oddsPoints: 8 },
      { id: 'OVER_8.5', label: 'Over 8.5 Corners', oddsPoints: 10 },
      { id: 'UNDER_8.5', label: 'Under 8.5 Corners', oddsPoints: 10 },
      { id: 'OVER_9.5', label: 'Over 9.5 Corners', oddsPoints: 12, badge: 'Top Line' },
      { id: 'UNDER_9.5', label: 'Under 9.5 Corners', oddsPoints: 12, badge: 'Top Line' },
      { id: 'OVER_10.5', label: 'Over 10.5 Corners', oddsPoints: 14 },
      { id: 'UNDER_10.5', label: 'Under 10.5 Corners', oddsPoints: 14 },
      { id: 'OVER_11.5', label: 'Over 11.5 Corners', oddsPoints: 16 },
      { id: 'UNDER_11.5', label: 'Under 11.5 Corners', oddsPoints: 16 },
    ],
  },
  {
    id: 'MOST_CORNERS',
    name: 'Most Corner Kicks (Corner Winner)',
    category: 'CORNERS',
    shortDesc: 'Which team will take the highest number of corner kicks?',
    icon: 'Compass',
    getOptions: (home, away) => [
      { id: 'HOME_MOST_CORNERS', label: `${home} Most Corners`, oddsPoints: 12 },
      { id: 'EQUAL_CORNERS', label: 'Equal Corners (Tie)', oddsPoints: 20, badge: 'High Reward' },
      { id: 'AWAY_MOST_CORNERS', label: `${away} Most Corners`, oddsPoints: 12 },
    ],
  },

  // ================= OTHER MARKETS =================
  {
    id: 'CLEAN_SHEET_HOME',
    name: 'Home Team Clean Sheet',
    category: 'OTHER',
    shortDesc: 'Will the home team concede 0 goals in 90 minutes?',
    icon: 'ShieldCheck',
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
    getOptions: (_, away) => [
      { id: 'AWAY_CS_YES', label: `${away} Clean Sheet (Yes)`, oddsPoints: 14 },
      { id: 'AWAY_CS_NO', label: `${away} Concedes (No)`, oddsPoints: 8 },
    ],
  },
  {
    id: 'WINNING_MARGIN',
    name: 'Winning Margin',
    category: 'OTHER',
    shortDesc: 'Predict the exact goal difference between the winner and loser.',
    icon: 'Scale',
    badge: 'Speculative',
    getOptions: () => [
      { id: 'MARGIN_DRAW', label: 'Any Draw (0 Goal Margin)', oddsPoints: 15 },
      { id: 'MARGIN_1', label: 'Win by Exactly 1 Goal', oddsPoints: 12 },
      { id: 'MARGIN_2', label: 'Win by Exactly 2 Goals', oddsPoints: 15 },
      { id: 'MARGIN_3+', label: 'Win by 3 or More Goals', oddsPoints: 20 },
    ],
  },
];
