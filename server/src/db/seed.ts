import { initDatabase } from './database.js';
import { enrichAllMatchesInDatabase } from './enrichMatches.js';
import { RealFootballApiService } from '../services/realFootballApi.js';

async function seed() {
  console.log('--- Verifying Supabase PostgreSQL Connection ---');
  await initDatabase();

  console.log('--- Purging Mock Fixtures & Enriching Matches in Supabase ---');
  await enrichAllMatchesInDatabase();

  console.log('--- Syncing Real Matches from External APIs into Supabase ---');
  const res = await RealFootballApiService.syncRealMatches();
  console.log(`[Seed Sync] ${res.message}`);

  console.log('--- Supabase Initialization Complete ---');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
