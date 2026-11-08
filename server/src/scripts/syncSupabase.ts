import { isSupabaseConfigured, testSupabaseConnection } from '../db/supabaseClient.js';
import { RealFootballApiService } from '../services/realFootballApi.js';

async function main() {
  console.log('\n=========================================');
  console.log('  PitchPredict Supabase Cloud Verifier');
  console.log('=========================================\n');

  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env');
    process.exit(1);
  }

  const conn = await testSupabaseConnection();
  if (!conn.connected) {
    console.error('Failed to connect to Supabase:', conn.error);
    process.exit(1);
  }

  console.log(`Connected to Supabase! Users=${conn.userCount}, Matches=${conn.matchCount}`);
  const syncRes = await RealFootballApiService.syncRealMatches();
  console.log(syncRes.message);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
