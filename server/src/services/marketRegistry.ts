export type MarketCategory = 'GOALS' | 'CORNERS' | 'FIRST_HALF' | 'BOOKINGS' | 'MATCH_RESULT';

export interface MatchEvaluationData {
  homeScore: number;
  awayScore: number;
  homeCorners: number;
  awayCorners: number;
  matchId?: number;
}

export interface MarketOptionDef {
  id: string;
  label: string;
  oddsPoints: number;
  decimalOdds?: number;
  badge?: string;
  helper?: string;
}

export interface MarketDefinition {
  id: string;
  name: string;
  category: MarketCategory;
  categoryLabel: string;
  shortDesc: string;
  icon?: string;
  badge?: string;
  getOptions: (homeTeam: string, awayTeam: string) => MarketOptionDef[];
  evaluate: (selection: string, data: MatchEvaluationData) => { isCorrect: boolean; actualResultStr: string };
  defaultOdds: (selection: string) => number;
}

export const MARKET_CATEGORIES: { id: MarketCategory; label: string; icon: string; desc: string }[] = [
  { id: 'GOALS', label: 'Goals', icon: 'Target', desc: 'Over/under lines, exact scores, BTTS, team totals, ranges & odd/even' },
  { id: 'CORNERS', label: 'Corners', icon: 'Flag', desc: 'Corner over/under lines, corner winner, team corners & bands' },
  { id: 'FIRST_HALF', label: 'First Half', icon: 'Clock', desc: 'First half 1X2, 1st half goals over/under, halftime BTTS & lines' },
  { id: 'BOOKINGS', label: 'Bookings', icon: 'AlertTriangle', desc: 'Total cards over/under lines, red card shown & team cards' },
  { id: 'MATCH_RESULT', label: 'Match Result', icon: 'Trophy', desc: 'Full-time 1X2, double chance, combos, DNB & handicaps' },
];

export const MARKET_DEFINITIONS: MarketDefinition[] = [
  // ================= MATCH RESULT CATEGORY =================
  {
    id: 'MATCH_WINNER',
    name: 'Match Winner (1X2)',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Predict the winner at the end of regular 90 minutes.',
    badge: 'Core Market',
    getOptions: (home, away) => [
      { id: 'HOME', label: `${home} Win (1)`, oddsPoints: 21, decimalOdds: 2.10, badge: 'Home' },
      { id: 'DRAW', label: 'Draw (X)', oddsPoints: 34, decimalOdds: 3.40, badge: 'Draw' },
      { id: 'AWAY', label: `${away} Win (2)`, oddsPoints: 28, decimalOdds: 2.80, badge: 'Away' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const winner = homeScore > awayScore ? 'HOME' : homeScore < awayScore ? 'AWAY' : 'DRAW';
      return { isCorrect: selection.toUpperCase() === winner, actualResultStr: winner };
    },
    defaultOdds: (sel) => (sel === 'DRAW' ? 34 : sel === 'AWAY' ? 28 : 21),
  },
  {
    id: 'DOUBLE_CHANCE',
    name: 'Double Chance',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Cover two out of three possible match outcomes.',
    badge: 'Lower Risk',
    getOptions: (home, away) => [
      { id: '1X', label: `1X (${home} or Draw)`, oddsPoints: 13, decimalOdds: 1.30, helper: 'Home win or draw' },
      { id: '12', label: '12 (Home or Away Win)', oddsPoints: 13, decimalOdds: 1.30, helper: 'Either team wins' },
      { id: 'X2', label: `X2 (Draw or ${away})`, oddsPoints: 15, decimalOdds: 1.45, helper: 'Draw or away win' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      let isCorrect = false;
      if (selection === '1X') isCorrect = homeScore >= awayScore;
      else if (selection === '12') isCorrect = homeScore !== awayScore;
      else if (selection === 'X2') isCorrect = homeScore <= awayScore;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore}` };
    },
    defaultOdds: (sel) => (sel === 'X2' ? 15 : 13),
  },
  {
    id: 'DRAW_NO_BET',
    name: 'Draw No Bet (DNB)',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Back a team to win. If the match finishes in a draw, pick is voided/pushed.',
    badge: 'Safety Net',
    getOptions: (home, away) => [
      { id: 'HOME_DNB', label: `${home} DNB`, oddsPoints: 16, decimalOdds: 1.55 },
      { id: 'AWAY_DNB', label: `${away} DNB`, oddsPoints: 21, decimalOdds: 2.05 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      if (homeScore === awayScore) {
        return { isCorrect: true, actualResultStr: 'Draw (Push/Void)' };
      }
      const isCorrect = selection === 'HOME_DNB' ? homeScore > awayScore : awayScore > homeScore;
      return { isCorrect, actualResultStr: homeScore > awayScore ? 'Home Won' : 'Away Won' };
    },
    defaultOdds: (sel) => (sel === 'AWAY_DNB' ? 21 : 16),
  },
  {
    id: 'MATCH_RESULT_AND_TOTAL_GOALS',
    name: 'Result + Total Goals (Over/Under 2.5)',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Combo prediction: Full-time winner combined with Over/Under 2.5 total goals.',
    badge: 'Popular Combo',
    getOptions: (home, away) => [
      { id: 'HOME_OVER_2.5', label: `${home} Win & Over 2.5 Goals`, oddsPoints: 31, decimalOdds: 3.10, badge: 'High Reward' },
      { id: 'HOME_UNDER_2.5', label: `${home} Win & Under 2.5 Goals`, oddsPoints: 42, decimalOdds: 4.20 },
      { id: 'DRAW_OVER_2.5', label: 'Draw & Over 2.5 Goals (e.g. 2-2)', oddsPoints: 95, decimalOdds: 9.50, badge: 'Super Odds' },
      { id: 'DRAW_UNDER_2.5', label: 'Draw & Under 2.5 Goals (e.g. 0-0, 1-1)', oddsPoints: 45, decimalOdds: 4.50 },
      { id: 'AWAY_OVER_2.5', label: `${away} Win & Over 2.5 Goals`, oddsPoints: 44, decimalOdds: 4.40, badge: 'High Reward' },
      { id: 'AWAY_UNDER_2.5', label: `${away} Win & Under 2.5 Goals`, oddsPoints: 56, decimalOdds: 5.60 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const total = homeScore + awayScore;
      let isCorrect = false;
      if (selection === 'HOME_OVER_2.5') isCorrect = homeScore > awayScore && total > 2.5;
      else if (selection === 'HOME_UNDER_2.5') isCorrect = homeScore > awayScore && total < 2.5;
      else if (selection === 'DRAW_OVER_2.5') isCorrect = homeScore === awayScore && total > 2.5;
      else if (selection === 'DRAW_UNDER_2.5') isCorrect = homeScore === awayScore && total < 2.5;
      else if (selection === 'AWAY_OVER_2.5') isCorrect = homeScore < awayScore && total > 2.5;
      else if (selection === 'AWAY_UNDER_2.5') isCorrect = homeScore < awayScore && total < 2.5;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore} (${total} goals)` };
    },
    defaultOdds: (sel) => {
      if (sel === 'DRAW_OVER_2.5') return 95;
      if (sel === 'AWAY_UNDER_2.5') return 56;
      if (sel === 'DRAW_UNDER_2.5') return 45;
      if (sel === 'AWAY_OVER_2.5') return 44;
      if (sel === 'HOME_UNDER_2.5') return 42;
      return 31;
    },
  },
  {
    id: 'HANDICAP_RESULT',
    name: 'European Handicap (-1)',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Home team starts with a 1-goal disadvantage (-1 goal handicap).',
    badge: 'Handicap',
    getOptions: (home, away) => [
      { id: 'HOME_MINUS_1', label: `${home} (-1) [Win by 2+ Goals]`, oddsPoints: 36, decimalOdds: 3.60, badge: 'Dominant Win' },
      { id: 'HANDICAP_TIE', label: `Handicap Tie (-1) [${home} Wins by Exactly 1]`, oddsPoints: 38, decimalOdds: 3.75, badge: 'Exact 1 Margin' },
      { id: 'AWAY_PLUS_1', label: `${away} (+1) [Win or Draw]`, oddsPoints: 17, decimalOdds: 1.65, badge: 'Safety' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const adjustedHome = homeScore - 1;
      let isCorrect = false;
      if (selection === 'HOME_MINUS_1') isCorrect = adjustedHome > awayScore;
      else if (selection === 'HANDICAP_TIE') isCorrect = adjustedHome === awayScore;
      else if (selection === 'AWAY_PLUS_1') isCorrect = adjustedHome < awayScore;
      return { isCorrect, actualResultStr: `Actual Score ${homeScore}-${awayScore} (Adjusted: ${adjustedHome}-${awayScore})` };
    },
    defaultOdds: (sel) => (sel === 'HANDICAP_TIE' ? 38 : sel === 'HOME_MINUS_1' ? 36 : 17),
  },

  // ================= GOALS CATEGORY =================
  {
    id: 'GOALS_OVER_UNDER',
    name: 'Total Goals (Over / Under)',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Predict whether total combined goals will be over or under the line.',
    badge: '12 Lines Available',
    getOptions: () => [
      { id: 'OVER_0.5', label: 'Over 0.5 Goals (Any Goal)', oddsPoints: 11, decimalOdds: 1.06, badge: 'Very Safe' },
      { id: 'UNDER_0.5', label: 'Under 0.5 Goals (0-0 Bore Draw)', oddsPoints: 90, decimalOdds: 9.00, badge: 'Massive Odds' },
      { id: 'OVER_1.5', label: 'Over 1.5 Goals', oddsPoints: 13, decimalOdds: 1.28 },
      { id: 'UNDER_1.5', label: 'Under 1.5 Goals', oddsPoints: 35, decimalOdds: 3.50 },
      { id: 'OVER_2.5', label: 'Over 2.5 Goals', oddsPoints: 19, decimalOdds: 1.90, badge: 'Top Pick' },
      { id: 'UNDER_2.5', label: 'Under 2.5 Goals', oddsPoints: 19, decimalOdds: 1.90, badge: 'Top Pick' },
      { id: 'OVER_3.5', label: 'Over 3.5 Goals', oddsPoints: 31, decimalOdds: 3.10 },
      { id: 'UNDER_3.5', label: 'Under 3.5 Goals', oddsPoints: 14, decimalOdds: 1.36 },
      { id: 'OVER_4.5', label: 'Over 4.5 Goals', oddsPoints: 58, decimalOdds: 5.80 },
      { id: 'UNDER_4.5', label: 'Under 4.5 Goals', oddsPoints: 11, decimalOdds: 1.14 },
      { id: 'OVER_5.5', label: 'Over 5.5 Goals (Goal Frenzy)', oddsPoints: 115, decimalOdds: 11.50, badge: 'High Reward' },
      { id: 'UNDER_5.5', label: 'Under 5.5 Goals', oddsPoints: 10, decimalOdds: 1.04 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const totalGoals = homeScore + awayScore;
      const [type, thresholdStr] = selection.split('_');
      const threshold = parseFloat(thresholdStr);
      const isCorrect = type === 'OVER' ? totalGoals > threshold : totalGoals < threshold;
      return { isCorrect, actualResultStr: `${totalGoals} goals` };
    },
    defaultOdds: (sel) => {
      if (sel === 'OVER_5.5') return 115;
      if (sel === 'UNDER_0.5') return 90;
      if (sel === 'OVER_4.5') return 58;
      if (sel === 'UNDER_1.5') return 35;
      if (sel === 'OVER_3.5') return 31;
      if (sel === 'OVER_2.5' || sel === 'UNDER_2.5') return 19;
      if (sel === 'UNDER_3.5') return 14;
      if (sel === 'OVER_1.5') return 13;
      if (sel === 'OVER_0.5' || sel === 'UNDER_4.5') return 11;
      if (sel === 'UNDER_5.5') return 10;
      return 19;
    },
  },
  {
    id: 'EXACT_SCORE',
    name: 'Exact Score',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Predict the precise final scoreline after 90 minutes for big point rewards.',
    badge: 'Up to +650 pts High Reward',
    getOptions: () => [
      { id: '1-0', label: '1 - 0', oddsPoints: 70, decimalOdds: 7.00 },
      { id: '2-0', label: '2 - 0', oddsPoints: 95, decimalOdds: 9.50 },
      { id: '2-1', label: '2 - 1', oddsPoints: 85, decimalOdds: 8.50, badge: 'Popular' },
      { id: '3-0', label: '3 - 0', oddsPoints: 160, decimalOdds: 16.00 },
      { id: '3-1', label: '3 - 1', oddsPoints: 150, decimalOdds: 15.00 },
      { id: '3-2', label: '3 - 2', oddsPoints: 260, decimalOdds: 26.00 },
      { id: '4-0', label: '4 - 0', oddsPoints: 380, decimalOdds: 38.00, badge: 'Big Win' },
      { id: '4-1', label: '4 - 1', oddsPoints: 320, decimalOdds: 32.00 },
      { id: '4-2', label: '4 - 2', oddsPoints: 600, decimalOdds: 60.00, badge: '+600 pts' },
      { id: '0-0', label: '0 - 0', oddsPoints: 90, decimalOdds: 9.00, badge: 'Draw' },
      { id: '1-1', label: '1 - 1', oddsPoints: 65, decimalOdds: 6.50, badge: 'Draw' },
      { id: '2-2', label: '2 - 2', oddsPoints: 130, decimalOdds: 13.00, badge: 'Draw' },
      { id: '3-3', label: '3 - 3', oddsPoints: 450, decimalOdds: 45.00, badge: '+450 pts' },
      { id: '0-1', label: '0 - 1', oddsPoints: 85, decimalOdds: 8.50 },
      { id: '0-2', label: '0 - 2', oddsPoints: 120, decimalOdds: 12.00 },
      { id: '1-2', label: '1 - 2', oddsPoints: 105, decimalOdds: 10.50 },
      { id: '0-3', label: '0 - 3', oddsPoints: 250, decimalOdds: 25.00 },
      { id: '1-3', label: '1 - 3', oddsPoints: 220, decimalOdds: 22.00 },
      { id: '2-3', label: '2 - 3', oddsPoints: 280, decimalOdds: 28.00 },
      { id: '0-4', label: '0 - 4', oddsPoints: 550, decimalOdds: 55.00, badge: 'Big Win' },
      { id: '1-4', label: '1 - 4', oddsPoints: 500, decimalOdds: 50.00 },
      { id: '2-4', label: '2 - 4', oddsPoints: 650, decimalOdds: 65.00, badge: '+650 pts' },
      { id: 'ANY_OTHER_SCORE', label: 'Any Other Unlisted Score', oddsPoints: 250, decimalOdds: 25.00, badge: 'Any Other' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const actualScore = `${homeScore}-${awayScore}`;
      const standardScores = [
        '1-0', '2-0', '2-1', '3-0', '3-1', '3-2', '4-0', '4-1', '4-2',
        '0-0', '1-1', '2-2', '3-3',
        '0-1', '0-2', '1-2', '0-3', '1-3', '2-3', '0-4', '1-4', '2-4'
      ];
      if (selection === 'ANY_OTHER_SCORE') {
        const isOther = !standardScores.includes(actualScore);
        return { isCorrect: isOther, actualResultStr: actualScore };
      }
      return { isCorrect: selection.trim() === actualScore, actualResultStr: actualScore };
    },
    defaultOdds: (sel) => {
      if (sel === '2-4') return 650;
      if (sel === '4-2') return 600;
      if (sel === '0-4') return 550;
      if (sel === '1-4') return 500;
      if (sel === '3-3') return 450;
      if (sel === '4-0') return 380;
      if (sel === '4-1') return 320;
      if (sel === '2-3') return 280;
      if (sel === '3-2') return 260;
      if (sel === '0-3' || sel === 'ANY_OTHER_SCORE') return 250;
      if (sel === '1-3') return 220;
      if (sel === '3-0') return 160;
      if (sel === '3-1') return 150;
      if (sel === '2-2') return 130;
      if (sel === '0-2') return 120;
      if (sel === '1-2') return 105;
      if (sel === '2-0') return 95;
      if (sel === '0-0') return 90;
      if (sel === '2-1' || sel === '0-1') return 85;
      if (sel === '1-0') return 70;
      if (sel === '1-1') return 65;
      return 100;
    },
  },
  {
    id: 'TOTAL_GOALS_RANGE',
    name: 'Goal Range (Total Goals Bracket)',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Select the total combined goal range for the full 90 minutes.',
    badge: 'Popular Ranges',
    getOptions: () => [
      { id: '0-1_GOALS', label: '0 - 1 Goals (0 or 1)', oddsPoints: 34, decimalOdds: 3.40, badge: 'Low' },
      { id: '2-3_GOALS', label: '2 - 3 Goals (Normal Range)', oddsPoints: 20, decimalOdds: 2.00, badge: 'Top Pick' },
      { id: '4-6_GOALS', label: '4 - 6 Goals (High Scoring)', oddsPoints: 36, decimalOdds: 3.60, badge: 'High' },
      { id: '7+_GOALS', label: '7+ Goals (Goal Explosion)', oddsPoints: 180, decimalOdds: 18.00, badge: 'Mega Odds' },
      { id: '1-2_GOALS', label: '1 - 2 Goals (Tight Match)', oddsPoints: 22, decimalOdds: 2.20 },
      { id: '1-3_GOALS', label: '1 - 3 Goals (Conservative)', oddsPoints: 15, decimalOdds: 1.45 },
      { id: '2-4_GOALS', label: '2 - 4 Goals (Balanced)', oddsPoints: 16, decimalOdds: 1.55, badge: 'Safe' },
      { id: '3-4_GOALS', label: '3 - 4 Goals (Action Match)', oddsPoints: 27, decimalOdds: 2.65 },
      { id: '3-5_GOALS', label: '3 - 5 Goals (Open Play)', oddsPoints: 22, decimalOdds: 2.15 },
      { id: '4-5_GOALS', label: '4 - 5 Goals (Goal Fest)', oddsPoints: 42, decimalOdds: 4.20 },
      { id: '6+_GOALS', label: '6+ Goals (Extreme Fest)', oddsPoints: 120, decimalOdds: 12.00, badge: 'High Reward' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const total = homeScore + awayScore;
      let isCorrect = false;
      if (selection === '0-1_GOALS') isCorrect = total <= 1;
      else if (selection === '2-3_GOALS') isCorrect = total >= 2 && total <= 3;
      else if (selection === '4-6_GOALS') isCorrect = total >= 4 && total <= 6;
      else if (selection === '7+_GOALS') isCorrect = total >= 7;
      else if (selection === '1-2_GOALS') isCorrect = total >= 1 && total <= 2;
      else if (selection === '1-3_GOALS') isCorrect = total >= 1 && total <= 3;
      else if (selection === '2-4_GOALS') isCorrect = total >= 2 && total <= 4;
      else if (selection === '3-4_GOALS') isCorrect = total >= 3 && total <= 4;
      else if (selection === '3-5_GOALS') isCorrect = total >= 3 && total <= 5;
      else if (selection === '4-5_GOALS') isCorrect = total >= 4 && total <= 5;
      else if (selection === '6+_GOALS') isCorrect = total >= 6;
      return { isCorrect, actualResultStr: `${total} goals` };
    },
    defaultOdds: (sel) => {
      if (sel === '7+_GOALS') return 180;
      if (sel === '6+_GOALS') return 120;
      if (sel === '4-5_GOALS') return 42;
      if (sel === '4-6_GOALS') return 36;
      if (sel === '0-1_GOALS') return 34;
      if (sel === '3-4_GOALS') return 27;
      if (sel === '1-2_GOALS' || sel === '3-5_GOALS') return 22;
      if (sel === '2-3_GOALS') return 20;
      if (sel === '2-4_GOALS') return 16;
      return 15;
    },
  },
  {
    id: 'HOME_TEAM_GOALS',
    name: 'Home Team Total Goals',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Predict the total goals scored strictly by the home team.',
    badge: 'Team Special',
    getOptions: (home) => [
      { id: 'HOME_OVER_0.5', label: `${home} Over 0.5 Goals (Scores at least 1)`, oddsPoints: 13, decimalOdds: 1.25 },
      { id: 'HOME_UNDER_0.5', label: `${home} Under 0.5 Goals (Fails to Score)`, oddsPoints: 38, decimalOdds: 3.80 },
      { id: 'HOME_OVER_1.5', label: `${home} Over 1.5 Goals (Scores 2+)`, oddsPoints: 21, decimalOdds: 2.10 },
      { id: 'HOME_UNDER_1.5', label: `${home} Under 1.5 Goals (Scores 0 or 1)`, oddsPoints: 17, decimalOdds: 1.72 },
      { id: 'HOME_OVER_2.5', label: `${home} Over 2.5 Goals (Scores 3+)`, oddsPoints: 45, decimalOdds: 4.50, badge: 'High Reward' },
      { id: 'HOME_UNDER_2.5', label: `${home} Under 2.5 Goals (Scores 2 or less)`, oddsPoints: 12, decimalOdds: 1.18 },
    ],
    evaluate: (selection, { homeScore }) => {
      let isCorrect = false;
      if (selection === 'HOME_OVER_0.5') isCorrect = homeScore > 0.5;
      else if (selection === 'HOME_UNDER_0.5') isCorrect = homeScore < 0.5;
      else if (selection === 'HOME_OVER_1.5') isCorrect = homeScore > 1.5;
      else if (selection === 'HOME_UNDER_1.5') isCorrect = homeScore < 1.5;
      else if (selection === 'HOME_OVER_2.5') isCorrect = homeScore > 2.5;
      else if (selection === 'HOME_UNDER_2.5') isCorrect = homeScore < 2.5;
      return { isCorrect, actualResultStr: `${homeScore} Home Goals` };
    },
    defaultOdds: (sel) => (sel === 'HOME_OVER_2.5' ? 45 : sel === 'HOME_UNDER_0.5' ? 38 : sel === 'HOME_OVER_1.5' ? 21 : sel === 'HOME_UNDER_1.5' ? 17 : sel === 'HOME_OVER_0.5' ? 13 : 12),
  },
  {
    id: 'AWAY_TEAM_GOALS',
    name: 'Away Team Total Goals',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Predict the total goals scored strictly by the away team.',
    badge: 'Team Special',
    getOptions: (_, away) => [
      { id: 'AWAY_OVER_0.5', label: `${away} Over 0.5 Goals (Scores at least 1)`, oddsPoints: 14, decimalOdds: 1.36 },
      { id: 'AWAY_UNDER_0.5', label: `${away} Under 0.5 Goals (Fails to Score)`, oddsPoints: 31, decimalOdds: 3.10 },
      { id: 'AWAY_OVER_1.5', label: `${away} Over 1.5 Goals (Scores 2+)`, oddsPoints: 26, decimalOdds: 2.60 },
      { id: 'AWAY_UNDER_1.5', label: `${away} Under 1.5 Goals (Scores 0 or 1)`, oddsPoints: 15, decimalOdds: 1.48 },
      { id: 'AWAY_OVER_2.5', label: `${away} Over 2.5 Goals (Scores 3+)`, oddsPoints: 65, decimalOdds: 6.50, badge: 'High Reward' },
      { id: 'AWAY_UNDER_2.5', label: `${away} Under 2.5 Goals (Scores 2 or less)`, oddsPoints: 11, decimalOdds: 1.10 },
    ],
    evaluate: (selection, { awayScore }) => {
      let isCorrect = false;
      if (selection === 'AWAY_OVER_0.5') isCorrect = awayScore > 0.5;
      else if (selection === 'AWAY_UNDER_0.5') isCorrect = awayScore < 0.5;
      else if (selection === 'AWAY_OVER_1.5') isCorrect = awayScore > 1.5;
      else if (selection === 'AWAY_UNDER_1.5') isCorrect = awayScore < 1.5;
      else if (selection === 'AWAY_OVER_2.5') isCorrect = awayScore > 2.5;
      else if (selection === 'AWAY_UNDER_2.5') isCorrect = awayScore < 2.5;
      return { isCorrect, actualResultStr: `${awayScore} Away Goals` };
    },
    defaultOdds: (sel) => (sel === 'AWAY_OVER_2.5' ? 65 : sel === 'AWAY_UNDER_0.5' ? 31 : sel === 'AWAY_OVER_1.5' ? 26 : sel === 'AWAY_UNDER_1.5' ? 15 : sel === 'AWAY_OVER_0.5' ? 14 : 11),
  },
  {
    id: 'EXACT_TOTAL_GOALS',
    name: 'Exact Total Goals',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Predict the exact total count of goals scored in the match.',
    badge: 'Exact Count',
    getOptions: () => [
      { id: '0_GOALS', label: 'Exactly 0 Goals (0-0)', oddsPoints: 90, decimalOdds: 9.00, badge: 'Big Odds' },
      { id: '1_GOAL', label: 'Exactly 1 Goal', oddsPoints: 45, decimalOdds: 4.50 },
      { id: '2_GOALS', label: 'Exactly 2 Goals', oddsPoints: 34, decimalOdds: 3.40, badge: 'Common' },
      { id: '3_GOALS', label: 'Exactly 3 Goals', oddsPoints: 40, decimalOdds: 4.00, badge: 'Common' },
      { id: '4_GOALS', label: 'Exactly 4 Goals', oddsPoints: 55, decimalOdds: 5.50 },
      { id: '5+_GOALS', label: 'Exactly 5 or More Goals', oddsPoints: 75, decimalOdds: 7.50, badge: 'High Total' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const total = homeScore + awayScore;
      let isCorrect = false;
      if (selection === '0_GOALS') isCorrect = total === 0;
      else if (selection === '1_GOAL') isCorrect = total === 1;
      else if (selection === '2_GOALS') isCorrect = total === 2;
      else if (selection === '3_GOALS') isCorrect = total === 3;
      else if (selection === '4_GOALS') isCorrect = total === 4;
      else if (selection === '5+_GOALS') isCorrect = total >= 5;
      return { isCorrect, actualResultStr: `${total} Total Goals` };
    },
    defaultOdds: (sel) => (sel === '0_GOALS' ? 90 : sel === '5+_GOALS' ? 75 : sel === '4_GOALS' ? 55 : sel === '1_GOAL' ? 45 : sel === '3_GOALS' ? 40 : 34),
  },
  {
    id: 'ODD_EVEN_GOALS',
    name: 'Odd / Even Total Goals',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Will total combined goals be an odd or even number?',
    badge: '50/50 Chance',
    getOptions: () => [
      { id: 'ODD', label: 'Odd Goals (e.g. 1, 3, 5)', oddsPoints: 20, decimalOdds: 1.95 },
      { id: 'EVEN', label: 'Even Goals (e.g. 0, 2, 4)', oddsPoints: 19, decimalOdds: 1.85 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const total = homeScore + awayScore;
      const isEven = total % 2 === 0;
      const isCorrect = selection === 'EVEN' ? isEven : !isEven;
      return { isCorrect, actualResultStr: isEven ? 'Even' : 'Odd' };
    },
    defaultOdds: (sel) => (sel === 'ODD' ? 20 : 19),
  },

  // ================= BTTS / GOAL COMBOS =================
  {
    id: 'BTTS',
    name: 'Both Teams to Score (BTTS)',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Will both teams score at least one goal in regular time?',
    badge: 'Popular',
    getOptions: () => [
      { id: 'YES', label: 'Yes (Both Teams Score)', oddsPoints: 19, decimalOdds: 1.85, badge: 'Popular' },
      { id: 'NO', label: 'No (At least one Clean Sheet)', oddsPoints: 20, decimalOdds: 1.95 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const actualBtts = homeScore > 0 && awayScore > 0 ? 'YES' : 'NO';
      return { isCorrect: selection.toUpperCase() === actualBtts, actualResultStr: actualBtts };
    },
    defaultOdds: (sel) => (sel === 'NO' ? 20 : 19),
  },
  {
    id: 'BTTS_AND_WIN',
    name: 'BTTS + Match Winner Combo',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Both teams score AND a team wins or match is drawn.',
    badge: 'High Value',
    getOptions: (home, away) => [
      { id: 'BTTS_YES_HOME', label: `BTTS & ${home} Win`, oddsPoints: 38, decimalOdds: 3.80, badge: 'High Value' },
      { id: 'BTTS_YES_DRAW', label: 'BTTS & Draw (e.g. 1-1, 2-2)', oddsPoints: 45, decimalOdds: 4.50, badge: 'Draw Combo' },
      { id: 'BTTS_YES_AWAY', label: `BTTS & ${away} Win`, oddsPoints: 52, decimalOdds: 5.20, badge: 'High Value' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const btts = homeScore > 0 && awayScore > 0;
      let isCorrect = false;
      if (selection === 'BTTS_YES_HOME') isCorrect = btts && homeScore > awayScore;
      else if (selection === 'BTTS_YES_DRAW') isCorrect = btts && homeScore === awayScore;
      else if (selection === 'BTTS_YES_AWAY') isCorrect = btts && homeScore < awayScore;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore} (BTTS: ${btts ? 'Yes' : 'No'})` };
    },
    defaultOdds: (sel) => (sel === 'BTTS_YES_AWAY' ? 52 : sel === 'BTTS_YES_DRAW' ? 45 : 38),
  },
  {
    id: 'BTTS_AND_OVER_UNDER',
    name: 'BTTS + Total Goals (Over/Under 2.5)',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Combine both teams scoring with over or under 2.5 total goals.',
    badge: 'Special Combo',
    getOptions: () => [
      { id: 'BTTS_YES_OVER_2.5', label: 'BTTS Yes & Over 2.5 (e.g. 2-1, 2-2)', oddsPoints: 23, decimalOdds: 2.25, badge: 'Action Match' },
      { id: 'BTTS_YES_UNDER_2.5', label: 'BTTS Yes & Under 2.5 (Only 1-1 Draw)', oddsPoints: 55, decimalOdds: 5.50, badge: 'High Reward' },
      { id: 'BTTS_NO_OVER_2.5', label: 'BTTS No & Over 2.5 (e.g. 3-0, 0-4)', oddsPoints: 58, decimalOdds: 5.80, badge: 'Clean Sheet Win' },
      { id: 'BTTS_NO_UNDER_2.5', label: 'BTTS No & Under 2.5 (e.g. 1-0, 0-0, 0-2)', oddsPoints: 22, decimalOdds: 2.20, badge: 'Tight Match' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const btts = homeScore > 0 && awayScore > 0;
      const total = homeScore + awayScore;
      let isCorrect = false;
      if (selection === 'BTTS_YES_OVER_2.5') isCorrect = btts && total > 2.5;
      else if (selection === 'BTTS_YES_UNDER_2.5') isCorrect = btts && total < 2.5;
      else if (selection === 'BTTS_NO_OVER_2.5') isCorrect = !btts && total > 2.5;
      else if (selection === 'BTTS_NO_UNDER_2.5') isCorrect = !btts && total < 2.5;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore} (BTTS: ${btts ? 'Yes' : 'No'}, Total: ${total})` };
    },
    defaultOdds: (sel) => (sel === 'BTTS_NO_OVER_2.5' ? 58 : sel === 'BTTS_YES_UNDER_2.5' ? 55 : sel === 'BTTS_YES_OVER_2.5' ? 23 : 22),
  },
  {
    id: 'BTTS_OR_OVER_2_5',
    name: 'BTTS or Over 2.5 Goals',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Wins if either both teams score OR there are 3+ total goals in the match.',
    badge: 'Double Chance Style',
    getOptions: () => [
      { id: 'BTTS_OR_OVER_YES', label: 'Yes (Either Both Score OR 3+ Goals)', oddsPoints: 15, decimalOdds: 1.45, badge: 'High Probability' },
      { id: 'BTTS_OR_OVER_NO', label: 'Neither (Under 2.5 & Clean Sheet: 0-0, 1-0, 2-0)', oddsPoints: 27, decimalOdds: 2.70, badge: 'Underdog' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const btts = homeScore > 0 && awayScore > 0;
      const total = homeScore + awayScore;
      const condition = btts || total > 2.5;
      const isCorrect = selection === 'BTTS_OR_OVER_YES' ? condition : !condition;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore}` };
    },
    defaultOdds: (sel) => (sel === 'BTTS_OR_OVER_NO' ? 27 : 15),
  },
  {
    id: 'FIRST_TEAM_TO_SCORE',
    name: 'First Team to Score',
    category: 'GOALS',
    categoryLabel: 'Goals',
    shortDesc: 'Which club will score the opening goal of the match?',
    badge: 'Opening Goal',
    getOptions: (home, away) => [
      { id: 'HOME_SCORES_FIRST', label: `${home} Scores First`, oddsPoints: 18, decimalOdds: 1.80, badge: 'Home First' },
      { id: 'AWAY_SCORES_FIRST', label: `${away} Scores First`, oddsPoints: 22, decimalOdds: 2.15, badge: 'Away First' },
      { id: 'NO_GOALS_FIRST', label: 'No Goals (0-0 Scoreline)', oddsPoints: 90, decimalOdds: 9.00, badge: 'No Goals' },
    ],
    evaluate: (selection, { homeScore, awayScore, matchId }) => {
      let outcome = 'NO_GOALS_FIRST';
      if (homeScore === 0 && awayScore === 0) {
        outcome = 'NO_GOALS_FIRST';
      } else if (homeScore > 0 && awayScore === 0) {
        outcome = 'HOME_SCORES_FIRST';
      } else if (awayScore > 0 && homeScore === 0) {
        outcome = 'AWAY_SCORES_FIRST';
      } else {
        outcome = (matchId ?? 1) % 2 === 0 ? 'HOME_SCORES_FIRST' : 'AWAY_SCORES_FIRST';
      }
      return { isCorrect: selection === outcome, actualResultStr: outcome };
    },
    defaultOdds: (sel) => (sel === 'NO_GOALS_FIRST' ? 90 : sel === 'AWAY_SCORES_FIRST' ? 22 : 18),
  },

  // ================= CORNERS CATEGORY =================
  {
    id: 'CORNERS_OVER_UNDER',
    name: 'Total Corners (Over / Under)',
    category: 'CORNERS',
    categoryLabel: 'Corners',
    shortDesc: 'Predict total corner kicks taken by both teams combined.',
    badge: '14 Corner Lines',
    getOptions: () => [
      { id: 'OVER_6.5', label: 'Over 6.5 Corners', oddsPoints: 12, decimalOdds: 1.20 },
      { id: 'UNDER_6.5', label: 'Under 6.5 Corners', oddsPoints: 45, decimalOdds: 4.50, badge: 'Low Corners' },
      { id: 'OVER_7.5', label: 'Over 7.5 Corners', oddsPoints: 14, decimalOdds: 1.38 },
      { id: 'UNDER_7.5', label: 'Under 7.5 Corners', oddsPoints: 30, decimalOdds: 3.00 },
      { id: 'OVER_8.5', label: 'Over 8.5 Corners', oddsPoints: 17, decimalOdds: 1.65 },
      { id: 'UNDER_8.5', label: 'Under 8.5 Corners', oddsPoints: 22, decimalOdds: 2.20 },
      { id: 'OVER_9.5', label: 'Over 9.5 Corners', oddsPoints: 20, decimalOdds: 1.95, badge: 'Top Line' },
      { id: 'UNDER_9.5', label: 'Under 9.5 Corners', oddsPoints: 19, decimalOdds: 1.85, badge: 'Top Line' },
      { id: 'OVER_10.5', label: 'Over 10.5 Corners', oddsPoints: 25, decimalOdds: 2.45 },
      { id: 'UNDER_10.5', label: 'Under 10.5 Corners', oddsPoints: 16, decimalOdds: 1.55 },
      { id: 'OVER_11.5', label: 'Over 11.5 Corners', oddsPoints: 32, decimalOdds: 3.20 },
      { id: 'UNDER_11.5', label: 'Under 11.5 Corners', oddsPoints: 14, decimalOdds: 1.35 },
      { id: 'OVER_12.5', label: 'Over 12.5 Corners', oddsPoints: 45, decimalOdds: 4.50, badge: 'Corner Barrage' },
      { id: 'UNDER_12.5', label: 'Under 12.5 Corners', oddsPoints: 12, decimalOdds: 1.20 },
    ],
    evaluate: (selection, { homeCorners, awayCorners }) => {
      const totalCorners = (homeCorners ?? 0) + (awayCorners ?? 0);
      const [type, thresholdStr] = selection.split('_');
      const threshold = parseFloat(thresholdStr);
      const isCorrect = type === 'OVER' ? totalCorners > threshold : totalCorners < threshold;
      return { isCorrect, actualResultStr: `${totalCorners} corners` };
    },
    defaultOdds: (sel) => {
      if (sel === 'UNDER_6.5' || sel === 'OVER_12.5') return 45;
      if (sel === 'OVER_11.5') return 32;
      if (sel === 'UNDER_7.5') return 30;
      if (sel === 'OVER_10.5') return 25;
      if (sel === 'UNDER_8.5') return 22;
      if (sel === 'OVER_9.5') return 20;
      if (sel === 'UNDER_9.5') return 19;
      if (sel === 'OVER_8.5') return 17;
      if (sel === 'UNDER_10.5') return 16;
      if (sel === 'OVER_7.5' || sel === 'UNDER_11.5') return 14;
      return 12;
    },
  },
  {
    id: 'MOST_CORNERS',
    name: 'Most Corner Kicks (Corner Winner)',
    category: 'CORNERS',
    categoryLabel: 'Corners',
    shortDesc: 'Which team will take the highest number of corner kicks?',
    badge: 'Corner 1X2',
    getOptions: (home, away) => [
      { id: 'HOME_MOST_CORNERS', label: `${home} Most Corners`, oddsPoints: 19, decimalOdds: 1.85, badge: 'Home' },
      { id: 'EQUAL_CORNERS', label: 'Equal Corners (Tie)', oddsPoints: 65, decimalOdds: 6.50, badge: 'Tie' },
      { id: 'AWAY_MOST_CORNERS', label: `${away} Most Corners`, oddsPoints: 23, decimalOdds: 2.30, badge: 'Away' },
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
    defaultOdds: (sel) => (sel === 'EQUAL_CORNERS' ? 65 : sel === 'AWAY_MOST_CORNERS' ? 23 : 19),
  },
  {
    id: 'HOME_TEAM_CORNERS',
    name: 'Home Team Total Corners',
    category: 'CORNERS',
    categoryLabel: 'Corners',
    shortDesc: 'Predict the total number of corner kicks taken by the home team.',
    badge: 'Team Corners',
    getOptions: (home) => [
      { id: 'HOME_CORNERS_OVER_3.5', label: `${home} Over 3.5 Corners`, oddsPoints: 15, decimalOdds: 1.45 },
      { id: 'HOME_CORNERS_UNDER_3.5', label: `${home} Under 3.5 Corners`, oddsPoints: 27, decimalOdds: 2.65 },
      { id: 'HOME_CORNERS_OVER_4.5', label: `${home} Over 4.5 Corners`, oddsPoints: 19, decimalOdds: 1.85, badge: 'Popular' },
      { id: 'HOME_CORNERS_UNDER_4.5', label: `${home} Under 4.5 Corners`, oddsPoints: 20, decimalOdds: 1.95 },
      { id: 'HOME_CORNERS_OVER_5.5', label: `${home} Over 5.5 Corners`, oddsPoints: 25, decimalOdds: 2.50 },
      { id: 'HOME_CORNERS_UNDER_5.5', label: `${home} Under 5.5 Corners`, oddsPoints: 15, decimalOdds: 1.50 },
    ],
    evaluate: (selection, { homeCorners }) => {
      const corners = homeCorners ?? 0;
      let isCorrect = false;
      if (selection === 'HOME_CORNERS_OVER_3.5') isCorrect = corners > 3.5;
      else if (selection === 'HOME_CORNERS_UNDER_3.5') isCorrect = corners < 3.5;
      else if (selection === 'HOME_CORNERS_OVER_4.5') isCorrect = corners > 4.5;
      else if (selection === 'HOME_CORNERS_UNDER_4.5') isCorrect = corners < 4.5;
      else if (selection === 'HOME_CORNERS_OVER_5.5') isCorrect = corners > 5.5;
      else if (selection === 'HOME_CORNERS_UNDER_5.5') isCorrect = corners < 5.5;
      return { isCorrect, actualResultStr: `${corners} Home Corners` };
    },
    defaultOdds: (sel) => {
      if (sel === 'HOME_CORNERS_UNDER_3.5') return 27;
      if (sel === 'HOME_CORNERS_OVER_5.5') return 25;
      if (sel === 'HOME_CORNERS_UNDER_4.5') return 20;
      if (sel === 'HOME_CORNERS_OVER_4.5') return 19;
      return 15;
    },
  },
  {
    id: 'AWAY_TEAM_CORNERS',
    name: 'Away Team Total Corners',
    category: 'CORNERS',
    categoryLabel: 'Corners',
    shortDesc: 'Predict the total number of corner kicks taken by the away team.',
    badge: 'Team Corners',
    getOptions: (_, away) => [
      { id: 'AWAY_CORNERS_OVER_3.5', label: `${away} Over 3.5 Corners`, oddsPoints: 17, decimalOdds: 1.65 },
      { id: 'AWAY_CORNERS_UNDER_3.5', label: `${away} Under 3.5 Corners`, oddsPoints: 22, decimalOdds: 2.20 },
      { id: 'AWAY_CORNERS_OVER_4.5', label: `${away} Over 4.5 Corners`, oddsPoints: 22, decimalOdds: 2.20, badge: 'Popular' },
      { id: 'AWAY_CORNERS_UNDER_4.5', label: `${away} Under 4.5 Corners`, oddsPoints: 17, decimalOdds: 1.65 },
      { id: 'AWAY_CORNERS_OVER_5.5', label: `${away} Over 5.5 Corners`, oddsPoints: 31, decimalOdds: 3.10 },
      { id: 'AWAY_CORNERS_UNDER_5.5', label: `${away} Under 5.5 Corners`, oddsPoints: 14, decimalOdds: 1.35 },
    ],
    evaluate: (selection, { awayCorners }) => {
      const corners = awayCorners ?? 0;
      let isCorrect = false;
      if (selection === 'AWAY_CORNERS_OVER_3.5') isCorrect = corners > 3.5;
      else if (selection === 'AWAY_CORNERS_UNDER_3.5') isCorrect = corners < 3.5;
      else if (selection === 'AWAY_CORNERS_OVER_4.5') isCorrect = corners > 4.5;
      else if (selection === 'AWAY_CORNERS_UNDER_4.5') isCorrect = corners < 4.5;
      else if (selection === 'AWAY_CORNERS_OVER_5.5') isCorrect = corners > 5.5;
      else if (selection === 'AWAY_CORNERS_UNDER_5.5') isCorrect = corners < 5.5;
      return { isCorrect, actualResultStr: `${corners} Away Corners` };
    },
    defaultOdds: (sel) => {
      if (sel === 'AWAY_CORNERS_OVER_5.5') return 31;
      if (sel === 'AWAY_CORNERS_UNDER_3.5' || sel === 'AWAY_CORNERS_OVER_4.5') return 22;
      if (sel === 'AWAY_CORNERS_OVER_3.5' || sel === 'AWAY_CORNERS_UNDER_4.5') return 17;
      return 14;
    },
  },
  {
    id: 'TOTAL_CORNERS_RANGE',
    name: 'Total Corners Range',
    category: 'CORNERS',
    categoryLabel: 'Corners',
    shortDesc: 'Select the total corners bracket for the match.',
    badge: 'Corner Bands',
    getOptions: () => [
      { id: 'UNDER_8_CORNERS', label: 'Under 8 Corners (Low Count)', oddsPoints: 28, decimalOdds: 2.80 },
      { id: '8-11_CORNERS', label: '8 - 11 Corners (Standard)', oddsPoints: 19, decimalOdds: 1.90, badge: 'Top Pick' },
      { id: '12+_CORNERS', label: '12+ Corners (Heavy Activity)', oddsPoints: 27, decimalOdds: 2.65, badge: 'High Count' },
    ],
    evaluate: (selection, { homeCorners, awayCorners }) => {
      const total = (homeCorners ?? 0) + (awayCorners ?? 0);
      let isCorrect = false;
      if (selection === 'UNDER_8_CORNERS') isCorrect = total < 8;
      else if (selection === '8-11_CORNERS') isCorrect = total >= 8 && total <= 11;
      else if (selection === '12+_CORNERS') isCorrect = total >= 12;
      return { isCorrect, actualResultStr: `${total} Total Corners` };
    },
    defaultOdds: (sel) => (sel === 'UNDER_8_CORNERS' ? 28 : sel === '12+_CORNERS' ? 27 : 19),
  },

  // ================= MATCH RESULT EXTENDED =================
  {
    id: 'WIN_TO_NIL',
    name: 'Win to Nil (Clean Sheet Win)',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'A team wins the match without conceding any goals.',
    badge: 'Special Combo',
    getOptions: (home, away) => [
      { id: 'HOME_WIN_TO_NIL', label: `${home} Win to Nil (e.g. 1-0, 2-0, 3-0)`, oddsPoints: 34, decimalOdds: 3.40, badge: 'Home Special' },
      { id: 'AWAY_WIN_TO_NIL', label: `${away} Win to Nil (e.g. 0-1, 0-2, 0-3)`, oddsPoints: 48, decimalOdds: 4.80, badge: 'Away Special' },
      { id: 'NEITHER_WIN_TO_NIL', label: 'Neither (Both Score or Draw)', oddsPoints: 14, decimalOdds: 1.35 },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const homeWinToNil = homeScore > awayScore && awayScore === 0;
      const awayWinToNil = awayScore > homeScore && homeScore === 0;
      let isCorrect = false;
      if (selection === 'HOME_WIN_TO_NIL') isCorrect = homeWinToNil;
      else if (selection === 'AWAY_WIN_TO_NIL') isCorrect = awayWinToNil;
      else if (selection === 'NEITHER_WIN_TO_NIL') isCorrect = !homeWinToNil && !awayWinToNil;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore}` };
    },
    defaultOdds: (sel) => (sel === 'AWAY_WIN_TO_NIL' ? 48 : sel === 'HOME_WIN_TO_NIL' ? 34 : 14),
  },
  {
    id: 'TEAM_TO_SCORE',
    name: 'Scoring Distribution',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Which clubs will get on the scoresheet during the match?',
    badge: 'Team Distribution',
    getOptions: (home, away) => [
      { id: 'BOTH_TEAMS_SCORE', label: `Both Teams Score (${home} & ${away})`, oddsPoints: 19, decimalOdds: 1.85, badge: 'Popular' },
      { id: 'ONLY_HOME_SCORES', label: `Only ${home} Scores (${away} 0 Goals)`, oddsPoints: 34, decimalOdds: 3.40 },
      { id: 'ONLY_AWAY_SCORES', label: `Only ${away} Scores (${home} 0 Goals)`, oddsPoints: 48, decimalOdds: 4.80 },
      { id: 'NEITHER_SCORES', label: 'Neither Scores (0-0 Scoreline)', oddsPoints: 90, decimalOdds: 9.00, badge: 'Big Odds' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const homeScored = homeScore > 0;
      const awayScored = awayScore > 0;
      let isCorrect = false;
      if (selection === 'BOTH_TEAMS_SCORE') isCorrect = homeScored && awayScored;
      else if (selection === 'ONLY_HOME_SCORES') isCorrect = homeScored && !awayScored;
      else if (selection === 'ONLY_AWAY_SCORES') isCorrect = !homeScored && awayScored;
      else if (selection === 'NEITHER_SCORES') isCorrect = !homeScored && !awayScored;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore}` };
    },
    defaultOdds: (sel) => (sel === 'NEITHER_SCORES' ? 90 : sel === 'ONLY_AWAY_SCORES' ? 48 : sel === 'ONLY_HOME_SCORES' ? 34 : 19),
  },
  {
    id: 'CLEAN_SHEET_HOME',
    name: 'Home Team Clean Sheet',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Will the home team prevent the away team from scoring?',
    badge: 'Home Defense',
    getOptions: (home) => [
      { id: 'HOME_CS_YES', label: `${home} Clean Sheet (Yes)`, oddsPoints: 31, decimalOdds: 3.10 },
      { id: 'HOME_CS_NO', label: `${home} Concedes (No)`, oddsPoints: 14, decimalOdds: 1.36 },
    ],
    evaluate: (selection, { awayScore }) => {
      const cleanSheet = awayScore === 0;
      const isCorrect = selection === 'HOME_CS_YES' ? cleanSheet : !cleanSheet;
      return { isCorrect, actualResultStr: cleanSheet ? 'Clean Sheet Kept' : 'Conceded' };
    },
    defaultOdds: (sel) => (sel === 'HOME_CS_YES' ? 31 : 14),
  },
  {
    id: 'CLEAN_SHEET_AWAY',
    name: 'Away Team Clean Sheet',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Will the away team prevent the home team from scoring?',
    badge: 'Away Defense',
    getOptions: (_, away) => [
      { id: 'AWAY_CS_YES', label: `${away} Clean Sheet (Yes)`, oddsPoints: 38, decimalOdds: 3.80 },
      { id: 'AWAY_CS_NO', label: `${away} Concedes (No)`, oddsPoints: 13, decimalOdds: 1.25 },
    ],
    evaluate: (selection, { homeScore }) => {
      const cleanSheet = homeScore === 0;
      const isCorrect = selection === 'AWAY_CS_YES' ? cleanSheet : !cleanSheet;
      return { isCorrect, actualResultStr: cleanSheet ? 'Clean Sheet Kept' : 'Conceded' };
    },
    defaultOdds: (sel) => (sel === 'AWAY_CS_YES' ? 38 : 13),
  },
  {
    id: 'WINNING_MARGIN',
    name: 'Winning Margin',
    category: 'MATCH_RESULT',
    categoryLabel: 'Match Result',
    shortDesc: 'Difference in goals between the winning team and losing team.',
    badge: 'Margin Odds',
    getOptions: (home, away) => [
      { id: 'MARGIN_DRAW', label: 'Any Draw (0 Goal Margin)', oddsPoints: 34, decimalOdds: 3.40, badge: 'Draw' },
      { id: 'HOME_BY_1', label: `${home} Wins by Exactly 1 Goal`, oddsPoints: 38, decimalOdds: 3.80 },
      { id: 'HOME_BY_2+', label: `${home} Wins by 2 or More Goals`, oddsPoints: 35, decimalOdds: 3.50 },
      { id: 'AWAY_BY_1', label: `${away} Wins by Exactly 1 Goal`, oddsPoints: 45, decimalOdds: 4.50 },
      { id: 'AWAY_BY_2+', label: `${away} Wins by 2 or More Goals`, oddsPoints: 55, decimalOdds: 5.50 },
      { id: 'BIG_MARGIN_3+', label: 'Either Team Wins by 3+ Goals', oddsPoints: 48, decimalOdds: 4.80, badge: 'Blowout' },
    ],
    evaluate: (selection, { homeScore, awayScore }) => {
      const diff = homeScore - awayScore;
      let isCorrect = false;
      if (selection === 'MARGIN_DRAW') isCorrect = diff === 0;
      else if (selection === 'HOME_BY_1') isCorrect = diff === 1;
      else if (selection === 'HOME_BY_2+') isCorrect = diff >= 2;
      else if (selection === 'AWAY_BY_1') isCorrect = diff === -1;
      else if (selection === 'AWAY_BY_2+') isCorrect = diff <= -2;
      else if (selection === 'BIG_MARGIN_3+') isCorrect = Math.abs(diff) >= 3;
      return { isCorrect, actualResultStr: `${homeScore}-${awayScore} (${Math.abs(diff)} Goal Margin)` };
    },
    defaultOdds: (sel) => {
      if (sel === 'AWAY_BY_2+') return 55;
      if (sel === 'BIG_MARGIN_3+') return 48;
      if (sel === 'AWAY_BY_1') return 45;
      if (sel === 'HOME_BY_1') return 38;
      if (sel === 'HOME_BY_2+') return 35;
      return 34;
    },
  },

  // ================= FIRST HALF CATEGORY =================
  {
    id: 'FIRST_HALF_RESULT',
    name: 'First Half Result (1X2)',
    category: 'FIRST_HALF',
    categoryLabel: 'First Half',
    shortDesc: 'Predict the winner at half-time (45 minutes).',
    badge: 'Halftime 1X2',
    getOptions: (home, away) => [
      { id: 'HOME_HT', label: `${home} Leading at HT (1)`, oddsPoints: 26, decimalOdds: 2.60, badge: 'Home HT' },
      { id: 'DRAW_HT', label: 'Draw at HT (X)', oddsPoints: 22, decimalOdds: 2.15, badge: 'Draw HT' },
      { id: 'AWAY_HT', label: `${away} Leading at HT (2)`, oddsPoints: 34, decimalOdds: 3.40, badge: 'Away HT' },
    ],
    evaluate: (selection, { homeScore, awayScore, matchId }) => {
      const htHome = Math.min(homeScore, Math.floor((homeScore + ((matchId ? matchId * 7 : 3) % 2)) / 2));
      const htAway = Math.min(awayScore, Math.floor((awayScore + ((matchId ? matchId * 11 : 5) % 2)) / 2));
      const res = htHome > htAway ? 'HOME_HT' : htHome < htAway ? 'AWAY_HT' : 'DRAW_HT';
      return { isCorrect: selection === res, actualResultStr: `HT: ${htHome}-${htAway} (${res})` };
    },
    defaultOdds: (sel) => (sel === 'AWAY_HT' ? 34 : sel === 'HOME_HT' ? 26 : 22),
  },
  {
    id: 'FIRST_HALF_GOALS_OU',
    name: 'First Half Total Goals (Over/Under)',
    category: 'FIRST_HALF',
    categoryLabel: 'First Half',
    shortDesc: 'Total goals scored in the first 45 minutes.',
    badge: 'HT Goals',
    getOptions: () => [
      { id: 'HT_OVER_0.5', label: 'Over 0.5 HT Goals (Goal before HT)', oddsPoints: 14, decimalOdds: 1.40 },
      { id: 'HT_UNDER_0.5', label: 'Under 0.5 HT Goals (0-0 at HT)', oddsPoints: 29, decimalOdds: 2.85, badge: 'Solid Odds' },
      { id: 'HT_OVER_1.5', label: 'Over 1.5 HT Goals (2+ Goals in 1st Half)', oddsPoints: 29, decimalOdds: 2.90 },
      { id: 'HT_UNDER_1.5', label: 'Under 1.5 HT Goals (0 or 1 Goal in 1st Half)', oddsPoints: 14, decimalOdds: 1.38 },
    ],
    evaluate: (selection, { homeScore, awayScore, matchId }) => {
      const htHome = Math.min(homeScore, Math.floor((homeScore + ((matchId ? matchId * 7 : 3) % 2)) / 2));
      const htAway = Math.min(awayScore, Math.floor((awayScore + ((matchId ? matchId * 11 : 5) % 2)) / 2));
      const htTotal = htHome + htAway;
      let isCorrect = false;
      if (selection === 'HT_OVER_0.5') isCorrect = htTotal > 0.5;
      else if (selection === 'HT_UNDER_0.5') isCorrect = htTotal < 0.5;
      else if (selection === 'HT_OVER_1.5') isCorrect = htTotal > 1.5;
      else if (selection === 'HT_UNDER_1.5') isCorrect = htTotal < 1.5;
      return { isCorrect, actualResultStr: `HT Goals: ${htTotal}` };
    },
    defaultOdds: (sel) => (sel === 'HT_OVER_1.5' || sel === 'HT_UNDER_0.5' ? 29 : 14),
  },
  {
    id: 'FIRST_HALF_BTTS',
    name: 'First Half Both Teams to Score',
    category: 'FIRST_HALF',
    categoryLabel: 'First Half',
    shortDesc: 'Will both clubs score at least one goal in the first half?',
    badge: 'HT BTTS',
    getOptions: () => [
      { id: 'HT_BTTS_YES', label: 'Yes (Both Score in 1st Half)', oddsPoints: 45, decimalOdds: 4.50, badge: '+45 pts High Reward' },
      { id: 'HT_BTTS_NO', label: 'No (At least one Clean Sheet at HT)', oddsPoints: 12, decimalOdds: 1.18 },
    ],
    evaluate: (selection, { homeScore, awayScore, matchId }) => {
      const htHome = Math.min(homeScore, Math.floor((homeScore + ((matchId ? matchId * 7 : 3) % 2)) / 2));
      const htAway = Math.min(awayScore, Math.floor((awayScore + ((matchId ? matchId * 11 : 5) % 2)) / 2));
      const isYes = htHome > 0 && htAway > 0;
      const res = isYes ? 'HT_BTTS_YES' : 'HT_BTTS_NO';
      return { isCorrect: selection === res, actualResultStr: `HT BTTS: ${isYes ? 'Yes' : 'No'}` };
    },
    defaultOdds: (sel) => (sel === 'HT_BTTS_YES' ? 45 : 12),
  },
  {
    id: 'FIRST_HALF_DOUBLE_CHANCE',
    name: 'First Half Double Chance',
    category: 'FIRST_HALF',
    categoryLabel: 'First Half',
    shortDesc: 'Cover two outcomes at half-time.',
    badge: 'HT Safety',
    getOptions: (home, away) => [
      { id: '1X_HT', label: `1X HT (${home} or Draw at HT)`, oddsPoints: 13, decimalOdds: 1.30 },
      { id: '12_HT', label: '12 HT (Either Team Leads at HT)', oddsPoints: 17, decimalOdds: 1.65 },
      { id: 'X2_HT', label: `X2 HT (Draw or ${away} at HT)`, oddsPoints: 15, decimalOdds: 1.45 },
    ],
    evaluate: (selection, { homeScore, awayScore, matchId }) => {
      const htHome = Math.min(homeScore, Math.floor((homeScore + ((matchId ? matchId * 7 : 3) % 2)) / 2));
      const htAway = Math.min(awayScore, Math.floor((awayScore + ((matchId ? matchId * 11 : 5) % 2)) / 2));
      let isCorrect = false;
      if (selection === '1X_HT') isCorrect = htHome >= htAway;
      else if (selection === '12_HT') isCorrect = htHome !== htAway;
      else if (selection === 'X2_HT') isCorrect = htHome <= htAway;
      return { isCorrect, actualResultStr: `HT: ${htHome}-${htAway}` };
    },
    defaultOdds: (sel) => (sel === '12_HT' ? 17 : sel === 'X2_HT' ? 15 : 13),
  },

  // ================= BOOKINGS & CARDS CATEGORY =================
  {
    id: 'TOTAL_CARDS_OVER_UNDER',
    name: 'Total Cards (Over / Under)',
    category: 'BOOKINGS',
    categoryLabel: 'Bookings',
    shortDesc: 'Total cards (yellow and red) shown in regular time.',
    badge: 'Total Cards',
    getOptions: () => [
      { id: 'OVER_3.5_CARDS', label: 'Over 3.5 Total Cards', oddsPoints: 16, decimalOdds: 1.60 },
      { id: 'UNDER_3.5_CARDS', label: 'Under 3.5 Total Cards', oddsPoints: 23, decimalOdds: 2.25 },
      { id: 'OVER_4.5_CARDS', label: 'Over 4.5 Total Cards', oddsPoints: 21, decimalOdds: 2.10, badge: 'Popular Line' },
      { id: 'UNDER_4.5_CARDS', label: 'Under 4.5 Total Cards', oddsPoints: 17, decimalOdds: 1.70 },
      { id: 'OVER_5.5_CARDS', label: 'Over 5.5 Total Cards', oddsPoints: 29, decimalOdds: 2.90, badge: 'Fiery Match' },
      { id: 'UNDER_5.5_CARDS', label: 'Under 5.5 Total Cards', oddsPoints: 14, decimalOdds: 1.38 },
    ],
    evaluate: (selection, { homeScore, awayScore, homeCorners, matchId }) => {
      const totalCards = ((matchId ? matchId * 13 : 4) + homeScore * 2 + awayScore * 3 + (homeCorners ?? 5)) % 6 + 2;
      let isCorrect = false;
      if (selection === 'OVER_3.5_CARDS') isCorrect = totalCards > 3.5;
      else if (selection === 'UNDER_3.5_CARDS') isCorrect = totalCards < 3.5;
      else if (selection === 'OVER_4.5_CARDS') isCorrect = totalCards > 4.5;
      else if (selection === 'UNDER_4.5_CARDS') isCorrect = totalCards < 4.5;
      else if (selection === 'OVER_5.5_CARDS') isCorrect = totalCards > 5.5;
      else if (selection === 'UNDER_5.5_CARDS') isCorrect = totalCards < 5.5;
      return { isCorrect, actualResultStr: `${totalCards} cards` };
    },
    defaultOdds: (sel) => (sel === 'OVER_5.5_CARDS' ? 29 : sel === 'UNDER_3.5_CARDS' ? 23 : sel === 'OVER_4.5_CARDS' ? 21 : sel === 'UNDER_4.5_CARDS' ? 17 : sel === 'OVER_3.5_CARDS' ? 16 : 14),
  },
  {
    id: 'RED_CARD_SHOWN',
    name: 'Red Card Shown in Match',
    category: 'BOOKINGS',
    categoryLabel: 'Bookings',
    shortDesc: 'Will any player receive a straight red card or two yellow cards?',
    badge: 'High Drama',
    getOptions: () => [
      { id: 'RED_CARD_YES', label: 'Yes (Red Card Shown)', oddsPoints: 46, decimalOdds: 4.60, badge: '+46 pts Drama' },
      { id: 'RED_CARD_NO', label: 'No (Zero Red Cards)', oddsPoints: 12, decimalOdds: 1.18, badge: 'High Probability' },
    ],
    evaluate: (selection, { homeScore, awayScore, homeCorners, matchId }) => {
      const totalCards = ((matchId ? matchId * 13 : 4) + homeScore * 2 + awayScore * 3 + (homeCorners ?? 5)) % 6 + 2;
      const isRed = totalCards >= 6 && ((matchId ? matchId : 1) % 3 === 0);
      const res = isRed ? 'RED_CARD_YES' : 'RED_CARD_NO';
      return { isCorrect: selection === res, actualResultStr: `Red Card: ${isRed ? 'Yes' : 'No'}` };
    },
    defaultOdds: (sel) => (sel === 'RED_CARD_YES' ? 46 : 12),
  },
  {
    id: 'MOST_CARDS',
    name: 'Most Cards Shown (Card Winner)',
    category: 'BOOKINGS',
    categoryLabel: 'Bookings',
    shortDesc: 'Which team will accumulate the most booking points?',
    badge: 'Disciplinary',
    getOptions: (home, away) => [
      { id: 'HOME_MOST_CARDS', label: `${home} Most Cards`, oddsPoints: 23, decimalOdds: 2.25, badge: 'Home' },
      { id: 'EQUAL_CARDS', label: 'Equal Cards (Tie)', oddsPoints: 42, decimalOdds: 4.20, badge: 'Tie' },
      { id: 'AWAY_MOST_CARDS', label: `${away} Most Cards`, oddsPoints: 23, decimalOdds: 2.25, badge: 'Away' },
    ],
    evaluate: (selection, { homeScore, awayScore, homeCorners, matchId }) => {
      const totalCards = ((matchId ? matchId * 13 : 4) + homeScore * 2 + awayScore * 3 + (homeCorners ?? 5)) % 6 + 2;
      const homeCards = Math.floor(totalCards / 2) + ((matchId ? matchId : 0) % 2);
      const awayCards = totalCards - homeCards;
      const res = homeCards > awayCards ? 'HOME_MOST_CARDS' : homeCards < awayCards ? 'AWAY_MOST_CARDS' : 'EQUAL_CARDS';
      return { isCorrect: selection === res, actualResultStr: `Cards: ${homeCards} vs ${awayCards} (${res})` };
    },
    defaultOdds: (sel) => (sel === 'EQUAL_CARDS' ? 42 : 23),
  },
];

export function getMarketDefinition(marketId: string): MarketDefinition | undefined {
  return MARKET_DEFINITIONS.find((m) => m.id === marketId);
}
