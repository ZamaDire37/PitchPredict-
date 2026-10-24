export type MarketCategory = 'MATCH_RESULT' | 'GOALS' | 'BTTS' | 'CORNERS' | 'OTHER';

export interface MatchEvaluationData {
  homeScore: number;
  awayScore: number;
  homeCorners: number;
  awayCorners: number;
}

export interface MarketOptionDef {
  id: string;
  label: string;
  oddsPoints: number;
  badge?: string;
}

export interface MarketDefinition {
  id: string;
  name: string;
  category: MarketCategory;
  categoryLabel: string;
  shortDesc: string;
  getOptions: (homeTeam: string, awayTeam: string) => MarketOptionDef[];
  evaluate: (selection: string, data: MatchEvaluationData) => { isCorrect: boolean; actualResultStr: string };
  defaultOdds: (selection: string) => number;
}

export const MARKET_CATEGORIES: { id: MarketCategory; label: string; icon: string; desc: string }[] = [
  { id: 'MATCH_RESULT', label: 'Match Result', icon: 'Trophy', desc: 'Full time 1X2, double chance & draw no bet' },
  { id: 'GOALS', label: 'Goals', icon: 'Target', desc: 'Over/under lines, exact scores & goal ranges' },
  { id: 'BTTS', label: 'BTTS', icon: 'Flame', desc: 'Both teams to score & combined markets' },
  { id: 'CORNERS', label: 'Corners', icon: 'Flag', desc: 'Total corner over/under lines & team totals' },
  { id: 'OTHER', label: 'Other Markets', icon: 'Sparkles', desc: 'Clean sheets, odd/even & victory margins' },
];

export const MARKET_DEFINITIONS: MarketDefinition[] = [
  // --- MATCH RESULT CATEGORY ---
  {
    id: 'MATCH_WINNER',
    name: 'Match Winner (1X2)',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Predict the winner at the end of regular 90 minutes.',
    getOptions: (home, away) => [
      { id: 'HOME', label: `${home} (1)`, oddsPoints: 10, badge: 'Home' },
      { id: 'DRAW', label: 'Draw (X)', oddsPoints: 15, badge: 'Draw' },
      { id: 'AWAY', label: `${away} (2)`, oddsPoints: 10, badge: 'Away' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const winner = homeScore > awayScore ? 'HOME' : homeScore < awayScore ? 'AWAY' : 'DRAW';
      return { isCorrect: selection.toUpperCase() === winner, actualResultStr: winner };
    },
    defaultOdds: (sel) => (sel === 'DRAW' ? 15 : 10),
  },
  {
    id: 'DOUBLE_CHANCE',
    name: 'Double Chance',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Cover two out of three possible match outcomes.',
    getOptions: (home, away) => [
      { id: '1X', label: `1X (${home} or Draw)`, oddsPoints: 6 },
      { id: '12', label: '12 (Home or Away win)', oddsPoints: 6 },
      { id: 'X2', label: `X2 (Draw or ${away})`, oddsPoints: 6 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      let isCorrect = false;
      if (selection === '1X') isCorrect = homeScore >= awayScore;
      else if (selection === '12') isCorrect = homeScore !== awayScore;
      else if (selection === 'X2') isCorrect = homeScore <= awayScore;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore}` };
    },
    defaultOdds: () => 6,
  },
  {
    id: 'DRAW_NO_BET',
    name: 'Draw No Bet (DNB)',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Back a team to win. If the match finishes in a draw, pick is voided.',
    getOptions: (home, away) => [
      { id: 'HOME_DNB', label: `${home} DNB`, oddsPoints: 8 },
      { id: 'AWAY_DNB', label: `${away} DNB`, oddsPoints: 8 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      if (homeScore === awayScore) {
        return { isCorrect: true, actualResultStr: 'Draw (Void/Push)' };
      }
      const isCorrect = selection === 'HOME_DNB' ? homeScore > awayScore : awayScore > homeScore;
      return { isCorrect, actualResultStr: homeScore > awayScore ? 'Home Won' : 'Away Won' };
    },
    defaultOdds: () => 8,
  },

  // --- GOALS CATEGORY ---
  {
    id: 'GOALS_OVER_UNDER',
    name: 'Total Goals (Over / Under)',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Predict whether total combined goals will be over or under the line.',
    getOptions: () => [
      { id: 'OVER_1.5', label: 'Over 1.5 Goals', oddsPoints: 8 },
      { id: 'UNDER_1.5', label: 'Under 1.5 Goals', oddsPoints: 8 },
      { id: 'OVER_2.5', label: 'Over 2.5 Goals', oddsPoints: 10, badge: 'Popular' },
      { id: 'UNDER_2.5', label: 'Under 2.5 Goals', oddsPoints: 10, badge: 'Popular' },
      { id: 'OVER_3.5', label: 'Over 3.5 Goals', oddsPoints: 12 },
      { id: 'UNDER_3.5', label: 'Under 3.5 Goals', oddsPoints: 12 },
      { id: 'OVER_4.5', label: 'Over 4.5 Goals', oddsPoints: 18 },
      { id: 'UNDER_4.5', label: 'Under 4.5 Goals', oddsPoints: 18 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const totalGoals = homeScore + awayScore;
      const [type, thresholdStr] = selection.split('_');
      const threshold = parseFloat(thresholdStr);
      const isCorrect = type === 'OVER' ? totalGoals > threshold : totalGoals < threshold;
      return { isCorrect, actualResultStr: `${totalGoals} goals` };
    },
    defaultOdds: (sel) => (sel.includes('3.5') ? 12 : sel.includes('4.5') ? 18 : sel.includes('1.5') ? 8 : 10),
  },
  {
    id: 'EXACT_SCORE',
    name: 'Exact Score',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Predict the precise final scoreline after 90 minutes.',
    getOptions: () => [
      { id: '1-0', label: '1 - 0', oddsPoints: 30 },
      { id: '2-0', label: '2 - 0', oddsPoints: 30 },
      { id: '2-1', label: '2 - 1', oddsPoints: 30, badge: 'Top Pick' },
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
    evaluate: (selection, { homeScore, awayScore }) => {
      const actualScore = `${homeScore}-${awayScore}`;
      return { isCorrect: selection.trim() === actualScore, actualResultStr: actualScore };
    },
    defaultOdds: () => 30,
  },
  {
    id: 'TOTAL_GOALS_RANGE',
    name: 'Total Goals Range',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Select the goal range for the full match.',
    getOptions: () => [
      { id: '0-1_GOALS', label: '0 - 1 Goals (Low Scoring)', oddsPoints: 12 },
      { id: '2-3_GOALS', label: '2 - 3 Goals (Normal Range)', oddsPoints: 8 },
      { id: '4+_GOALS', label: '4+ Goals (Goal Fest)', oddsPoints: 14 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const total = homeScore + awayScore;
      let isCorrect = false;
      if (selection === '0-1_GOALS') isCorrect = total <= 1;
      else if (selection === '2-3_GOALS') isCorrect = total >= 2 && total <= 3;
      else if (selection === '4+_GOALS') isCorrect = total >= 4;
      return { isCorrect, actualResultStr: `${total} goals` };
    },
    defaultOdds: (sel) => (sel === '2-3_GOALS' ? 8 : sel === '0-1_GOALS' ? 12 : 14),
  },
  {
    id: 'ODD_EVEN_GOALS',
    name: 'Odd / Even Total Goals',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Will total combined goals be an odd or even number?',
    getOptions: () => [
      { id: 'ODD', label: 'Odd Goals (e.g. 1, 3, 5)', oddsPoints: 10 },
      { id: 'EVEN', label: 'Even Goals (e.g. 0, 2, 4)', oddsPoints: 10 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const total = homeScore + awayScore;
      const isEven = total % 2 === 0;
      const isCorrect = selection === 'EVEN' ? isEven : !isEven;
      return { isCorrect, actualResultStr: isEven ? 'Even' : 'Odd' };
    },
    defaultOdds: () => 10,
  },

  // --- BTTS CATEGORY ---
  {
    id: 'BTTS',
    name: 'Both Teams to Score',
    category: 'BTTS',
    categoryLabel: 'BTTS',
    shortDesc: 'Will both teams score at least one goal?',
    getOptions: () => [
      { id: 'YES', label: 'Yes (Both Teams Score)', oddsPoints: 10, badge: 'Popular' },
      { id: 'NO', label: 'No (At least one Clean Sheet)', oddsPoints: 10 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const actualBtts = homeScore > 0 && awayScore > 0 ? 'YES' : 'NO';
      return { isCorrect: selection.toUpperCase() === actualBtts, actualResultStr: actualBtts };
    },
    defaultOdds: () => 10,
  },
  {
    id: 'BTTS_AND_WIN',
    name: 'BTTS + Match Winner',
    category: 'BTTS',
    categoryLabel: 'BTTS',
    shortDesc: 'Combo prediction: Both teams score AND full time winner.',
    getOptions: (home, away) => [
      { id: 'BTTS_YES_HOME', label: `BTTS & ${home} Win`, oddsPoints: 20 },
      { id: 'BTTS_YES_DRAW', label: 'BTTS & Draw (e.g. 1-1, 2-2)', oddsPoints: 22 },
      { id: 'BTTS_YES_AWAY', label: `BTTS & ${away} Win`, oddsPoints: 20 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const btts = homeScore > 0 && awayScore > 0;
      let isCorrect = false;
      if (selection === 'BTTS_YES_HOME') isCorrect = btts && homeScore > awayScore;
      else if (selection === 'BTTS_YES_DRAW') isCorrect = btts && homeScore === awayScore;
      else if (selection === 'BTTS_YES_AWAY') isCorrect = btts && homeScore < awayScore;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore} (BTTS: ${btts ? 'Yes' : 'No'})` };
    },
    defaultOdds: () => 20,
  },

  // --- CORNERS CATEGORY ---
  {
    id: 'CORNERS_OVER_UNDER',
    name: 'Total Corners (Over / Under)',
    category: 'CORNERS',
    categoryLabel: 'Corners',
    shortDesc: 'Predict total corner kicks taken by both teams combined.',
    getOptions: () => [
      { id: 'OVER_7.5', label: 'Over 7.5 Corners', oddsPoints: 8 },
      { id: 'UNDER_7.5', label: 'Under 7.5 Corners', oddsPoints: 8 },
      { id: 'OVER_8.5', label: 'Over 8.5 Corners', oddsPoints: 10 },
      { id: 'UNDER_8.5', label: 'Under 8.5 Corners', oddsPoints: 10 },
      { id: 'OVER_9.5', label: 'Over 9.5 Corners', oddsPoints: 12, badge: 'Popular' },
      { id: 'UNDER_9.5', label: 'Under 9.5 Corners', oddsPoints: 12, badge: 'Popular' },
      { id: 'OVER_10.5', label: 'Over 10.5 Corners', oddsPoints: 14 },
      { id: 'UNDER_10.5', label: 'Under 10.5 Corners', oddsPoints: 14 },
      { id: 'OVER_11.5', label: 'Over 11.5 Corners', oddsPoints: 16 },
      { id: 'UNDER_11.5', label: 'Under 11.5 Corners', oddsPoints: 16 },
    ],
    evaluate: (selection, { homeCorners, awayCorners }) => {
      const totalCorners = (homeCorners ?? 0) + (awayCorners ?? 0);
      const [type, thresholdStr] = selection.split('_');
      const threshold = parseFloat(thresholdStr);
      const isCorrect = type === 'OVER' ? totalCorners > threshold : totalCorners < threshold;
      return { isCorrect, actualResultStr: `${totalCorners} corners` };
    },
    defaultOdds: (sel) => (sel.includes('11.5') ? 16 : sel.includes('10.5') ? 14 : sel.includes('7.5') ? 8 : 12),
  },
  {
    id: 'MOST_CORNERS',
    name: 'Most Corner Kicks',
    category: 'CORNERS',
    categoryLabel: 'Corners',
    shortDesc: 'Which team will win the most corner kicks during the match?',
    getOptions: (home, away) => [
      { id: 'HOME_MOST_CORNERS', label: `${home} Most Corners`, oddsPoints: 12 },
      { id: 'EQUAL_CORNERS', label: 'Equal Corners (Tie)', oddsPoints: 20 },
      { id: 'AWAY_MOST_CORNERS', label: `${away} Most Corners`, oddsPoints: 12 },
    ],
    evaluate: (selection, { homeCorners, awayCorners }) => {
      const outcome =
        (homeCorners ?? 0) > (awayCorners ?? 0)
          ? 'HOME_MOST_CORNERS'
          : (homeCorners ?? 0) < (awayCorners ?? 0)
          ? 'AWAY_MOST_CORNERS'
          : 'EQUAL_CORNERS';
      return { isCorrect: selection === outcome, actualResultStr: `${homeCorners ?? 0} vs ${awayCorners ?? 0}` };
    },
    defaultOdds: (sel) => (sel === 'EQUAL_CORNERS' ? 20 : 12),
  },

  // --- OTHER MARKETS CATEGORY ---
  {
    id: 'CLEAN_SHEET_HOME',
    name: 'Home Team Clean Sheet',
    category: 'OTHER',
    categoryLabel: 'Other Markets',
    shortDesc: 'Will the home team prevent the away team from scoring?',
    getOptions: (home, away) => [
      { id: 'HOME_CS_YES', label: `${home} Clean Sheet (Yes)`, oddsPoints: 12 },
      { id: 'HOME_CS_NO', label: `${home} Concedes (No)`, oddsPoints: 8 },
    ],
    evaluate: (selection, { awayScore }) => {
      const cleanSheet = awayScore === 0;
      const isCorrect = selection === 'HOME_CS_YES' ? cleanSheet : !cleanSheet;
      return { isCorrect, actualResultStr: cleanSheet ? 'Clean Sheet Kept' : 'Conceded' };
    },
    defaultOdds: (sel) => (sel === 'HOME_CS_YES' ? 12 : 8),
  },
  {
    id: 'CLEAN_SHEET_AWAY',
    name: 'Away Team Clean Sheet',
    category: 'OTHER',
    categoryLabel: 'Other Markets',
    shortDesc: 'Will the away team prevent the home team from scoring?',
    getOptions: (home, away) => [
      { id: 'AWAY_CS_YES', label: `${away} Clean Sheet (Yes)`, oddsPoints: 14 },
      { id: 'AWAY_CS_NO', label: `${away} Concedes (No)`, oddsPoints: 8 },
    ],
    evaluate: (selection, { homeScore }) => {
      const cleanSheet = homeScore === 0;
      const isCorrect = selection === 'AWAY_CS_YES' ? cleanSheet : !cleanSheet;
      return { isCorrect, actualResultStr: cleanSheet ? 'Clean Sheet Kept' : 'Conceded' };
    },
    defaultOdds: (sel) => (sel === 'AWAY_CS_YES' ? 14 : 8),
  },
  {
    id: 'WINNING_MARGIN',
    name: 'Winning Margin',
    category: 'OTHER',
    categoryLabel: 'Other Markets',
    shortDesc: 'Difference in goals between the winning team and losing team.',
    getOptions: () => [
      { id: 'MARGIN_DRAW', label: 'Any Draw (0 Margin)', oddsPoints: 15 },
      { id: 'MARGIN_1', label: 'Win by Exactly 1 Goal', oddsPoints: 12 },
      { id: 'MARGIN_2', label: 'Win by Exactly 2 Goals', oddsPoints: 15 },
      { id: 'MARGIN_3+', label: 'Win by 3 or More Goals', oddsPoints: 20 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const diff = Math.abs(homeScore - awayScore);
      let isCorrect = false;
      if (selection === 'MARGIN_DRAW') isCorrect = diff === 0;
      else if (selection === 'MARGIN_1') isCorrect = diff === 1;
      else if (selection === 'MARGIN_2') isCorrect = diff === 2;
      else if (selection === 'MARGIN_3+') isCorrect = diff >= 3;
      return { isCorrect, actualResultStr: `${diff} goal margin` };
    },
    defaultOdds: (sel) => (sel === 'MARGIN_3+' ? 20 : sel === 'MARGIN_DRAW' || sel === 'MARGIN_2' ? 15 : 12),
  },
];

export function getMarketDefinition(marketId: string): MarketDefinition | undefined {
  return MARKET_DEFINITIONS.find((m) => m.id === marketId);
}
