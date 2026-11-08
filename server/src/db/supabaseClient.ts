import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Response } from 'express';
import { config } from '../config.js';

export class DatabaseUnavailableError extends Error {
  public readonly statusCode = 503;
  public readonly code = 'DATABASE_UNAVAILABLE';

  constructor(message: string) {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

export function isDatabaseUnavailableError(err: unknown): err is DatabaseUnavailableError {
  return (
    err instanceof DatabaseUnavailableError ||
    (typeof err === 'object' && err !== null && (err as any).code === 'DATABASE_UNAVAILABLE')
  );
}

export function sendRouteError(
  res: Response,
  err: any,
  fallbackMessage: string,
  fallbackStatus: number = 500
) {
  if (isDatabaseUnavailableError(err)) {
    return res.status(503).json({
      error: err.message,
      code: 'DATABASE_UNAVAILABLE',
    });
  }
  const status = typeof err?.statusCode === 'number' ? err.statusCode : fallbackStatus;
  return res.status(status).json({
    error: err?.message || fallbackMessage,
  });
}

let supabaseInstance: SupabaseClient | null = null;
let cachedConfigKey = '';
let lastConnectionStatus: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR' = 'NOT_CONFIGURED';
let lastErrorMessage: string | null = null;

function getEffectiveSupabaseKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    config.supabaseServiceRoleKey ||
    process.env.SUPABASE_ANON_KEY ||
    config.supabaseAnonKey ||
    ''
  ).trim();
}

function getEffectiveSupabaseUrl(): string {
  return (process.env.SUPABASE_URL || config.supabaseUrl || '').trim();
}

export function isSupabaseConfigured(): boolean {
  const url = getEffectiveSupabaseUrl();
  const key = getEffectiveSupabaseKey();
  return Boolean(url && url.startsWith('http') && key);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = getEffectiveSupabaseUrl();
  const key = getEffectiveSupabaseKey();
  const nextCacheKey = `${url}::${key}`;

  if (!supabaseInstance || cachedConfigKey !== nextCacheKey) {
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
    cachedConfigKey = nextCacheKey;
  }

  return supabaseInstance;
}

/**
 * Returns an active Supabase client or throws a clear 503 DatabaseUnavailableError.
 * Never falls back to SQLite.
 */
export function requireSupabase(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    lastConnectionStatus = 'NOT_CONFIGURED';
    lastErrorMessage =
      'Database unavailable: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be configured in server environment variables.';
    throw new DatabaseUnavailableError(lastErrorMessage);
  }
  return client;
}

/**
 * Inspects a Supabase PostgrestError or thrown error and throws DatabaseUnavailableError
 * when Supabase cannot be reached or schema tables are unavailable.
 */
export function assertSupabaseOk(
  error: PostgrestError | Error | null | undefined,
  context: string
): void {
  if (!error) {
    lastConnectionStatus = 'CONNECTED';
    lastErrorMessage = null;
    return;
  }

  const rawMsg = error.message || 'Unknown Supabase error';
  const code = (error as PostgrestError).code || '';
  const lower = rawMsg.toLowerCase();

  const isUnavailable =
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('aborted') ||
    lower.includes('invalid api key') ||
    lower.includes('jwt') ||
    lower.includes('service unavailable') ||
    lower.includes('bad gateway') ||
    lower.includes('gateway timeout') ||
    code === 'PGRST205' ||
    code === 'PGRST301' ||
    code === '08000' ||
    code === '08006' ||
    code === '57P03';

  if (isUnavailable) {
    lastConnectionStatus = 'ERROR';
    lastErrorMessage = `Database unavailable (${context}): ${rawMsg}`;
    throw new DatabaseUnavailableError(lastErrorMessage);
  }

  const err = new Error(`${context}: ${rawMsg}`);
  (err as any).code = code;
  throw err;
}

/**
 * Inserts a single row into a BIGSERIAL table, safely advancing past any migrated explicit IDs
 * if the PostgreSQL sequence has not caught up yet.
 */
export async function insertRowWithAutoId<T = any>(
  table: 'users' | 'serious_sets' | 'predictions' | 'points_history',
  payload: Record<string, any>,
  selectColumns: string = '*'
): Promise<T> {
  const client = requireSupabase();

  // First try native BIGSERIAL auto-increment without explicit id
  const firstAttempt = await client.from(table).insert(payload).select(selectColumns).single();
  if (!firstAttempt.error && firstAttempt.data) {
    lastConnectionStatus = 'CONNECTED';
    lastErrorMessage = null;
    return firstAttempt.data as T;
  }

  const err = firstAttempt.error;
  const isPrimaryKeyIdCollision =
    err &&
    err.code === '23505' &&
    (err.message.includes(`${table}_pkey`) || (err.details || '').includes('(id)='));

  if (!isPrimaryKeyIdCollision) {
    assertSupabaseOk(err, `Insert into ${table}`);
    throw new Error(`Failed to insert into ${table}`);
  }

  // Sequence was behind migrated explicit IDs: compute max(id) + 1 and retry safely
  for (let attempt = 0; attempt < 5; attempt++) {
    const maxRes = await client
      .from(table)
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    assertSupabaseOk(maxRes.error, `Read max id from ${table}`);
    const nextId = Number(maxRes.data?.id || 0) + 1 + attempt;

    const retryRes = await client
      .from(table)
      .insert({ id: nextId, ...payload })
      .select(selectColumns)
      .single();

    if (!retryRes.error && retryRes.data) {
      lastConnectionStatus = 'CONNECTED';
      lastErrorMessage = null;
      return retryRes.data as T;
    }

    if (
      retryRes.error?.code === '23505' &&
      (retryRes.error.message.includes(`${table}_pkey`) ||
        (retryRes.error.details || '').includes('(id)='))
    ) {
      continue;
    }

    assertSupabaseOk(retryRes.error, `Insert into ${table}`);
  }

  throw new Error(`Unable to allocate unique ID for ${table}`);
}

/**
 * Fetches all matching rows across PostgREST 1,000-row pages.
 */
export async function fetchAllRows<T = any>(
  buildQuery: (client: SupabaseClient) => any,
  context: string,
  pageSize: number = 1000
): Promise<T[]> {
  const client = requireSupabase();
  const all: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await buildQuery(client).range(offset, offset + pageSize - 1);
    assertSupabaseOk(error, context);
    const batch = (data || []) as T[];
    all.push(...batch);
    if (batch.length < pageSize) {
      break;
    }
    offset += pageSize;
  }

  return all;
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  error?: string;
  matchCount?: number;
  userCount?: number;
}> {
  if (!isSupabaseConfigured()) {
    lastConnectionStatus = 'NOT_CONFIGURED';
    lastErrorMessage =
      'Supabase credentials not set. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in server environment variables.';
    return {
      connected: false,
      status: 'NOT_CONFIGURED',
      error: lastErrorMessage,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    lastConnectionStatus = 'NOT_CONFIGURED';
    return { connected: false, status: 'NOT_CONFIGURED', error: 'Failed to initialize Supabase client' };
  }

  try {
    const [matchesRes, usersRes] = await Promise.all([
      client.from('matches').select('id', { count: 'exact', head: true }),
      client.from('users').select('id', { count: 'exact', head: true }),
    ]);

    const firstError = matchesRes.error || usersRes.error;
    if (firstError) {
      lastConnectionStatus = 'ERROR';
      lastErrorMessage = firstError.message;
      return {
        connected: false,
        status: 'ERROR',
        error: firstError.message,
      };
    }

    lastConnectionStatus = 'CONNECTED';
    lastErrorMessage = null;
    return {
      connected: true,
      status: 'CONNECTED',
      matchCount: matchesRes.count ?? 0,
      userCount: usersRes.count ?? 0,
    };
  } catch (err: any) {
    lastConnectionStatus = 'ERROR';
    lastErrorMessage = err.message || 'Unknown network error';
    return { connected: false, status: 'ERROR', error: lastErrorMessage || undefined };
  }
}

export function getSupabaseDiagnostics() {
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    provider: 'Supabase Free (PostgreSQL Cloud — Exclusive)',
    status: configured ? lastConnectionStatus : 'NOT_CONFIGURED',
    error: lastErrorMessage,
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseServiceRoleKey),
    hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || config.supabaseAnonKey),
  };
}
