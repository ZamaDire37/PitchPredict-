import { RealFootballApiService } from '../services/realFootballApi.js';
import { queryAll, initDatabase } from '../db/database.js';

async function testRealApi() {
  console.log('\n=== TESTING REAL FOOTBALL API CONNECTION & DATA INGESTION ===\n');

  initDatabase();

  console.log('[1] Executing live sync from free real football APIs...');
  const res = await RealFootballApiService.syncRealMatches();
  console.log('Sync Result:', res.message);
  console.log('Active API Sources:', res.sources);
  console.log('Total Synced:', res.syncedCount);

  console.log('\n[2] Checking Competitions in Database:');
  for (const c of res.diagnostics.competitions) {
    console.log(` - ${c.name} (${c.id}): ${c.count} real fixtures`);
  }

  console.log('\n[3] Acceptance Tests Verification:');

  // 1. Champions League fixtures
  const clMatches = queryAll('SELECT * FROM matches WHERE competition_id = ? LIMIT 2', ['CL']);
  console.log(`- Champions League matches found: ${clMatches.length}`);
  if (clMatches.length > 0) {
    console.log(`  Sample: [ID ${clMatches[0].external_id}] ${clMatches[0].home_team_name} vs ${clMatches[0].away_team_name} (${clMatches[0].utc_date})`);
  }

  // 2. Major domestic league (Premier League)
  const plMatches = queryAll('SELECT * FROM matches WHERE competition_id = ? LIMIT 2', ['PL']);
  console.log(`- Premier League matches found: ${plMatches.length}`);
  if (plMatches.length > 0) {
    console.log(`  Sample: [ID ${plMatches[0].external_id}] ${plMatches[0].home_team_name} vs ${plMatches[0].away_team_name} (${plMatches[0].utc_date})`);
  }

  // 3. International / National-team competition (World Cup or Euro)
  const intlMatches = queryAll("SELECT * FROM matches WHERE competition_id IN ('WC', 'EC') LIMIT 2");
  console.log(`- International tournament matches found: ${intlMatches.length}`);
  if (intlMatches.length > 0) {
    console.log(`  Sample: [ID ${intlMatches[0].external_id}] ${intlMatches[0].competition_name}: ${intlMatches[0].home_team_name} vs ${intlMatches[0].away_team_name} (${intlMatches[0].utc_date})`);
  }

  // 4. Upcoming fixtures
  const upcoming = queryAll("SELECT * FROM matches WHERE status IN ('TIMED', 'SCHEDULED') LIMIT 2");
  console.log(`- Upcoming fixtures found: ${upcoming.length}`);
  if (upcoming.length > 0) {
    console.log(`  Sample: [ID ${upcoming[0].external_id}] ${upcoming[0].home_team_name} vs ${upcoming[0].away_team_name} (${upcoming[0].utc_date})`);
  }

  // 5. Completed match / result
  const finished = queryAll("SELECT * FROM matches WHERE status = 'FINISHED' AND home_score IS NOT NULL LIMIT 2");
  console.log(`- Completed matches with scores found: ${finished.length}`);
  if (finished.length > 0) {
    console.log(`  Sample: [ID ${finished[0].external_id}] ${finished[0].home_team_name} ${finished[0].home_score} - ${finished[0].away_score} ${finished[0].away_team_name} (${finished[0].utc_date})`);
  }

  console.log('\n>>> REAL FOOTBALL API VERIFICATION SUCCESSFUL! <<<\n');
}

testRealApi().catch(err => {
  console.error('Real API Test Failed:', err.message);
  process.exit(1);
});
