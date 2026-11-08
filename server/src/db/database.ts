import { testSupabaseConnection, DatabaseUnavailableError } from './supabaseClient.js';

export {
  DatabaseUnavailableError,
  isDatabaseUnavailableError,
  sendRouteError,
  requireSupabase,
  assertSupabaseOk,
  insertRowWithAutoId,
  fetchAllRows,
  testSupabaseConnection,
  getSupabaseDiagnostics,
} from './supabaseClient.js';

/**
 * Verifies connectivity to Supabase PostgreSQL (sole database).
 * Throws DatabaseUnavailableError if Supabase is unconfigured or unreachable.
 */
export async function initDatabase(): Promise<void> {
  const status = await testSupabaseConnection();
  if (!status.connected) {
    throw new DatabaseUnavailableError(
      status.error || 'Unable to connect to Supabase PostgreSQL database.'
    );
  }
}
