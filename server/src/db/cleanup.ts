import { requireSupabase, assertSupabaseOk } from './supabaseClient.js';

export async function runSafeTestCleanup() {
  const client = requireSupabase();

  // Only remove synthetic test fixtures and @test.com automated test accounts;
  // NEVER delete real users, real predictions, serious sets, or points history.
  const delMatches = await client
    .from('matches')
    .delete()
    .or('home_team_name.like.Test Team%,home_team_name.like.Team %,home_team_name.eq.Live Home');
  assertSupabaseOk(delMatches.error, 'Clean test matches');

  const delTemplate = await client
    .from('matches')
    .delete()
    .gte('external_id', 501000)
    .lt('external_id', 600000);
  assertSupabaseOk(delTemplate.error, 'Clean synthetic template matches');

  const delTestUsers = await client
    .from('users')
    .delete()
    .like('email', '%@test.com');
  assertSupabaseOk(delTestUsers.error, 'Clean automated @test.com users');

  console.log('Synthetic test fixtures and @test.com accounts cleaned safely (real users & predictions untouched).');
}
