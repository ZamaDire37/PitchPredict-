import { getLeagueRank, normalizeCompetition } from '../services/leagueRanking.js';

interface TestMatch {
  id: number;
  home_team_name: string;
  away_team_name: string;
  competition_id: string;
  competition_name: string;
  utc_date: string;
}

// Saturday Test Fixtures:
// - Eredivisie at 13:00 UTC
// - Primeira Liga at 15:00 UTC
// - Premier League at 17:00 UTC
// - Premier League at 20:00 UTC
const saturdayMatches: TestMatch[] = [
  {
    id: 1,
    home_team_name: 'AFC Ajax',
    away_team_name: 'Feyenoord Rotterdam',
    competition_id: 'DED',
    competition_name: 'Dutch Eredivisie',
    utc_date: '2026-11-14T13:00:00.000Z',
  },
  {
    id: 2,
    home_team_name: 'Sporting CP',
    away_team_name: 'SL Benfica',
    competition_id: 'PPL',
    competition_name: 'Liga Portugal Betclic',
    utc_date: '2026-11-14T15:00:00.000Z',
  },
  {
    id: 3,
    home_team_name: 'Arsenal FC',
    away_team_name: 'Chelsea FC',
    competition_id: 'PL',
    competition_name: 'Barclays Premier League',
    utc_date: '2026-11-14T17:00:00.000Z',
  },
  {
    id: 4,
    home_team_name: 'Manchester City',
    away_team_name: 'Liverpool FC',
    competition_id: 'PL',
    competition_name: 'Premier League',
    utc_date: '2026-11-14T20:00:00.000Z',
  },
];

console.log('===============================================================');
console.log('  TEST: VERIFY SATURDAY FIXTURE ORDERING (BY LEAGUE VS CHRONO)');
console.log('===============================================================\n');

// 1. CHRONOLOGICAL VIEW ORDER
const chronoSorted = [...saturdayMatches].sort(
  (a, b) => new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime()
);

console.log('--- 1. CHRONOLOGICAL VIEW (Sort by Kickoff Time) ---');
chronoSorted.forEach((m, idx) => {
  const time = new Date(m.utc_date).toISOString().substring(11, 16);
  console.log(`[Pos ${idx + 1}] ${time} UTC | [${m.competition_id}] ${m.home_team_name} vs ${m.away_team_name}`);
});

if (chronoSorted[0].competition_id === 'DED' && chronoSorted[0].utc_date.includes('13:00')) {
  console.log('✅ CHRONOLOGICAL PASS: 13:00 Eredivisie match appears first!\n');
} else {
  console.error('❌ CHRONOLOGICAL FAIL');
  process.exit(1);
}

// 2. BY LEAGUE VIEW ORDER
interface LeagueGroup {
  id: string;
  name: string;
  rank: number;
  matches: TestMatch[];
}

const groupsMap = new Map<string, LeagueGroup>();

for (const m of saturdayMatches) {
  const norm = normalizeCompetition(m.competition_id, m.competition_name);
  if (!groupsMap.has(norm.id)) {
    groupsMap.set(norm.id, {
      id: norm.id,
      name: norm.name,
      rank: norm.rank,
      matches: [],
    });
  }
  groupsMap.get(norm.id)!.matches.push(m);
}

// Sort each league's matches by kickoff, then sort groups by league rank
const byLeagueGroups = Array.from(groupsMap.values())
  .filter((g) => g.matches.length > 0)
  .map((g) => ({
    ...g,
    matches: g.matches.sort(
      (a, b) => new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime()
    ),
  }))
  .sort((a, b) => a.rank - b.rank);

console.log('--- 2. BY LEAGUE VIEW (Order by 50-League Priority Ranking) ---');
const flatByLeagueList: { groupName: string; rank: number; match: TestMatch }[] = [];

byLeagueGroups.forEach((g) => {
  console.log(`\nLeague #${g.rank}: ${g.name} (${g.id}) [${g.matches.length} matches]`);
  g.matches.forEach((m) => {
    const time = new Date(m.utc_date).toISOString().substring(11, 16);
    console.log(`  -> ${time} UTC: ${m.home_team_name} vs ${m.away_team_name}`);
    flatByLeagueList.push({ groupName: g.name, rank: g.rank, match: m });
  });
});

console.log('\n--- VERIFICATION CHECKS ---');
// Check: The two Premier League matches should appear first
const plMatches = flatByLeagueList.slice(0, 2);
const firstTwoArePL =
  plMatches.length === 2 &&
  plMatches[0].match.competition_id === 'PL' &&
  plMatches[1].match.competition_id === 'PL' &&
  plMatches[0].match.utc_date.includes('17:00') &&
  plMatches[1].match.utc_date.includes('20:00');

console.log(
  firstTwoArePL
    ? '✅ Check 1 PASS: The two Premier League matches (17:00 & 20:00) appear first.'
    : '❌ Check 1 FAIL'
);

// Check: Then Primeira Liga (#6)
const thirdIsPPL =
  flatByLeagueList[2].match.competition_id === 'PPL' &&
  flatByLeagueList[2].match.utc_date.includes('15:00');

console.log(
  thirdIsPPL
    ? '✅ Check 2 PASS: Primeira Liga match (15:00) appears second.'
    : '❌ Check 2 FAIL'
);

// Check: Then Eredivisie (#8)
const fourthIsDED =
  flatByLeagueList[3].match.competition_id === 'DED' &&
  flatByLeagueList[3].match.utc_date.includes('13:00');

console.log(
  fourthIsDED
    ? '✅ Check 3 PASS: Eredivisie match (13:00) appears third.'
    : '❌ Check 3 FAIL'
);

if (firstTwoArePL && thirdIsPPL && fourthIsDED) {
  console.log('\n🎉 ALL SATURDAY ORDERING REQUIREMENTS VERIFIED & CONFIRMED PERFECTLY!');
} else {
  process.exit(1);
}
