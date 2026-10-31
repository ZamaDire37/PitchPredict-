import { config } from '../config.js';
import { isSupabaseConfigured, testSupabaseConnection, syncMatchesToSupabase } from '../db/supabaseClient.js';
import { queryOne } from '../db/database.js';

async function main() {
  console.log('\n=========================================');
  console.log('  PitchPredict Supabase Sync Engine');
  console.log('=========================================\n');

  if (!isSupabaseConfigured()) {
    console.log('⚠️  Supabase is not configured yet.');
    console.log('Please set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in server/.env');
    console.log('Example:');
    console.log('SUPABASE_URL=https://xyzcompany.supabase.co');
    console.log('SUPABASE_ANON_KEY=eyJhbGciOi...');
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${config.supabaseUrl}...`);
  const conn = await testSupabaseConnection();

  if (!conn.connected) {
    console.error('❌ Failed to connect to Supabase:', conn.error);
    console.log('\nTip: Make sure you have executed the schema migration script in Supabase:');
    console.log('1. Open your Supabase Dashboard -> SQL Editor');
    console.log('2. Paste the contents of supabase_schema.sql and click Run');
    process.exit(1);
  }

  console.log('✅ Connected successfully to Supabase!');
  const localCount = queryOne<{ count: number }>('SELECT count(*) as count FROM matches')?.count || 0;
  console.log(`Uploading ${localCount} verified real matches from local database to Supabase...`);

  const result = await syncMatchesToSupabase();
  if (result.success) {
    console.log(`\n🎉 Successfully synchronized ${result.totalSynced} matches to Supabase!`);
    console.log('All real football matches are now live on your Supabase PostgreSQL database.');
  } else {
    console.error('\n❌ Error during sync:', result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
