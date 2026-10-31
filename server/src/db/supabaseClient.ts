import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { queryAll, queryOne } from './database.js';

let supabaseInstance: SupabaseClient | null = null;
let lastSupabaseSync: string | null = null;
let lastConnectionStatus: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR' = 'NOT_CONFIGURED';
let lastErrorMessage: string | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    config.supabaseUrl &&
    config.supabaseUrl.startsWith('http') &&
    (config.supabaseServiceRoleKey || config.supabaseAnonKey)
  );
}

export function updateSupabaseCredentials(url?: string, anonKey?: string, serviceRoleKey?: string) {
  if (url) config.supabaseUrl = url;
  if (anonKey) config.supabaseAnonKey = anonKey;
  if (serviceRoleKey) config.supabaseServiceRoleKey = serviceRoleKey;
  supabaseInstance = null;
  lastConnectionStatus = 'NOT_CONFIGURED';
  lastErrorMessage = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    const key = config.supabaseServiceRoleKey || config.supabaseAnonKey;
    supabaseInstance = createClient(config.supabaseUrl, key, {
      auth: { persistSession: false },
    });
  }

  return supabaseInstance;
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  error?: string;
  matchCount?: number;
}> {
  if (!isSupabaseConfigured()) {
    lastConnectionStatus = 'NOT_CONFIGURED';
    return {
      connected: false,
      status: 'NOT_CONFIGURED',
      error: 'Supabase credentials not set. Add SUPABASE_URL and SUPABASE_ANON_KEY to server/.env',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    lastConnectionStatus = 'NOT_CONFIGURED';
    return { connected: false, status: 'NOT_CONFIGURED', error: 'Failed to initialize Supabase client' };
  }

  try {
    const { count, error } = await client.from('matches').select('id', { count: 'exact', head: true });
    if (error) {
      if (error.code === 'PGRST205') {
        // Connected and authenticated, but tables need to be created in Supabase SQL editor
        lastConnectionStatus = 'CONNECTED';
        lastErrorMessage = 'Connected! Schema tables pending: Run supabase_schema.sql in your Supabase SQL Editor.';
        return {
          connected: true,
          status: 'CONNECTED',
          error: lastErrorMessage,
          matchCount: 0,
        };
      }
      lastConnectionStatus = 'ERROR';
      lastErrorMessage = error.message;
      return { connected: false, status: 'ERROR', error: error.message };
    }

    lastConnectionStatus = 'CONNECTED';
    lastErrorMessage = null;
    return { connected: true, status: 'CONNECTED', matchCount: count ?? 0 };
  } catch (err: any) {
    lastConnectionStatus = 'ERROR';
    lastErrorMessage = err.message || 'Unknown network error';
    return { connected: false, status: 'ERROR', error: lastErrorMessage || undefined };
  }
}

/**
 * Upload all verified real matches from local database into Supabase in batches of 100
 */
export async function syncMatchesToSupabase(): Promise<{
  success: boolean;
  totalSynced: number;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, totalSynced: 0, error: 'Supabase client not configured.' };
  }

  try {
    const localMatches = queryAll<any>('SELECT * FROM matches ORDER BY id ASC');
    if (localMatches.length === 0) {
      return { success: true, totalSynced: 0 };
    }

    const batchSize = 100;
    let synced = 0;

    for (let i = 0; i < localMatches.length; i += batchSize) {
      const chunk = localMatches.slice(i, i + batchSize).map((m) => ({
        id: m.id,
        external_id: m.external_id,
        competition_id: m.competition_id,
        competition_name: m.competition_name,
        competition_emblem: m.competition_emblem,
        utc_date: m.utc_date,
        status: m.status,
        matchday: m.matchday,
        home_team_id: m.home_team_id,
        home_team_name: m.home_team_name,
        home_team_short: m.home_team_short,
        home_team_crest: m.home_team_crest,
        away_team_id: m.away_team_id,
        away_team_name: m.away_team_name,
        away_team_short: m.away_team_short,
        away_team_crest: m.away_team_crest,
        home_score: m.home_score,
        away_score: m.away_score,
        home_corners: m.home_corners,
        away_corners: m.away_corners,
        winner: m.winner,
        data_source: m.data_source,
        is_graded: m.is_graded,
        created_at: m.created_at || new Date().toISOString(),
        updated_at: m.updated_at || new Date().toISOString(),
      }));

      const { error } = await client.from('matches').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error('Supabase chunk upload error:', error.message);
        return { success: false, totalSynced: synced, error: error.message };
      }
      synced += chunk.length;
    }

    lastSupabaseSync = new Date().toISOString();
    return { success: true, totalSynced: synced };
  } catch (err: any) {
    console.error('Failed to sync matches to Supabase:', err);
    return { success: false, totalSynced: 0, error: err.message };
  }
}

/**
 * Sync a single registered user to Supabase
 */
export async function syncUserToSupabase(user: any): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('users').upsert({
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash || '',
      basic_points: user.basic_points,
      serious_points: user.serious_points,
      basic_streak: user.basic_streak || 0,
      basic_best_streak: user.basic_best_streak || 0,
      serious_streak: user.serious_streak || 0,
      serious_best_streak: user.serious_best_streak || 0,
      is_verified: true,
      account_type: 'OFFICIAL',
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch (err) {
    console.warn('Non-blocking: Failed to sync user to Supabase:', err);
  }
}

/**
 * Sync a prediction to Supabase
 */
export async function syncPredictionToSupabase(prediction: any): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('predictions').upsert({
      id: prediction.id,
      user_id: prediction.user_id,
      match_id: prediction.match_id,
      mode: prediction.mode,
      serious_set_id: prediction.serious_set_id || null,
      market_type: prediction.market_type,
      selection: prediction.selection,
      odds_points: prediction.odds_points,
      status: prediction.status,
      actual_result: prediction.actual_result || null,
      points_awarded: prediction.points_awarded || 0,
      is_verified_account: true,
      created_at: prediction.created_at || new Date().toISOString(),
      resolved_at: prediction.resolved_at || null,
    }, { onConflict: 'id' });
  } catch (err) {
    console.warn('Non-blocking: Failed to sync prediction to Supabase:', err);
  }
}

/**
 * Sync all local data (matches, users, serious sets, predictions, points history) to Supabase Cloud
 */
export async function syncAllDataToSupabase(): Promise<{
  success: boolean;
  matchesSynced: number;
  usersSynced: number;
  setsSynced: number;
  predictionsSynced: number;
  historySynced: number;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      matchesSynced: 0,
      usersSynced: 0,
      setsSynced: 0,
      predictionsSynced: 0,
      historySynced: 0,
      error: 'Supabase client not configured.',
    };
  }

  try {
    // 1. Sync Matches
    const matchesRes = await syncMatchesToSupabase();
    if (!matchesRes.success && matchesRes.error?.includes('Could not find the table')) {
      return {
        success: false,
        matchesSynced: 0,
        usersSynced: 0,
        setsSynced: 0,
        predictionsSynced: 0,
        historySynced: 0,
        error: matchesRes.error,
      };
    }

    // 2. Sync Users
    const localUsers = queryAll<any>('SELECT * FROM users ORDER BY id ASC');
    let usersSynced = 0;
    if (localUsers.length > 0) {
      const userPayload = localUsers.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        password_hash: u.password_hash || '',
        basic_points: u.basic_points,
        serious_points: u.serious_points,
        basic_streak: u.basic_streak || 0,
        basic_best_streak: u.basic_best_streak || 0,
        serious_streak: u.serious_streak || 0,
        serious_best_streak: u.serious_best_streak || 0,
        is_verified: true,
        account_type: u.account_type || 'OFFICIAL',
        created_at: u.created_at || new Date().toISOString(),
        updated_at: u.updated_at || new Date().toISOString(),
      }));
      for (let i = 0; i < userPayload.length; i += 100) {
        const chunk = userPayload.slice(i, i + 100);
        const { error } = await client.from('users').upsert(chunk, { onConflict: 'id' });
        if (error) console.warn('Supabase users chunk sync error:', error.message);
        else usersSynced += chunk.length;
      }
    }

    // 3. Sync Serious Sets
    const localSets = queryAll<any>('SELECT * FROM serious_sets ORDER BY id ASC');
    let setsSynced = 0;
    if (localSets.length > 0) {
      const setsPayload = localSets.map((s) => ({
        id: s.id,
        user_id: s.user_id,
        name: s.name,
        status: s.status,
        potential_points: s.potential_points || 0,
        points_delta: s.points_delta || 0,
        total_predictions: s.total_predictions || 0,
        correct_predictions: s.correct_predictions || 0,
        incorrect_predictions: s.incorrect_predictions || 0,
        created_at: s.created_at || new Date().toISOString(),
        resolved_at: s.resolved_at || null,
      }));
      for (let i = 0; i < setsPayload.length; i += 100) {
        const chunk = setsPayload.slice(i, i + 100);
        const { error } = await client.from('serious_sets').upsert(chunk, { onConflict: 'id' });
        if (error) console.warn('Supabase serious_sets chunk sync error:', error.message);
        else setsSynced += chunk.length;
      }
    }

    // 4. Sync Predictions
    const localPredictions = queryAll<any>('SELECT * FROM predictions ORDER BY id ASC');
    let predictionsSynced = 0;
    if (localPredictions.length > 0) {
      const predPayload = localPredictions.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        match_id: p.match_id,
        mode: p.mode,
        serious_set_id: p.serious_set_id || null,
        market_type: p.market_type,
        selection: p.selection,
        odds_points: p.odds_points,
        status: p.status,
        actual_result: p.actual_result || null,
        points_awarded: p.points_awarded || 0,
        is_verified_account: true,
        created_at: p.created_at || new Date().toISOString(),
        resolved_at: p.resolved_at || null,
      }));
      for (let i = 0; i < predPayload.length; i += 100) {
        const chunk = predPayload.slice(i, i + 100);
        const { error } = await client.from('predictions').upsert(chunk, { onConflict: 'id' });
        if (error) console.warn('Supabase predictions chunk sync error:', error.message);
        else predictionsSynced += chunk.length;
      }
    }

    // 5. Sync Points History Ledger
    const localHistory = queryAll<any>('SELECT * FROM points_history ORDER BY id ASC');
    let historySynced = 0;
    if (localHistory.length > 0) {
      const historyPayload = localHistory.map((h) => ({
        id: h.id,
        user_id: h.user_id,
        mode: h.mode,
        delta: h.delta,
        balance_after: h.balance_after,
        reason: h.reason,
        prediction_id: h.prediction_id || null,
        serious_set_id: h.serious_set_id || null,
        created_at: h.created_at || new Date().toISOString(),
      }));
      for (let i = 0; i < historyPayload.length; i += 100) {
        const chunk = historyPayload.slice(i, i + 100);
        const { error } = await client.from('points_history').upsert(chunk, { onConflict: 'id' });
        if (error) console.warn('Supabase points_history chunk sync error:', error.message);
        else historySynced += chunk.length;
      }
    }

    lastSupabaseSync = new Date().toISOString();
    return {
      success: true,
      matchesSynced: matchesRes.totalSynced,
      usersSynced,
      setsSynced,
      predictionsSynced,
      historySynced,
    };
  } catch (err: any) {
    console.error('Failed complete Supabase sync:', err);
    return {
      success: false,
      matchesSynced: 0,
      usersSynced: 0,
      setsSynced: 0,
      predictionsSynced: 0,
      historySynced: 0,
      error: err.message,
    };
  }
}

/**
 * Diagnostics payload for Supabase connection
 */
export function getSupabaseDiagnostics() {
  const isConfigured = isSupabaseConfigured();
  return {
    isConfigured,
    provider: 'Supabase (PostgreSQL Cloud)',
    status: isConfigured ? lastConnectionStatus : 'NOT_CONFIGURED',
    url: config.supabaseUrl ? config.supabaseUrl.replace(/^(https?:\/\/[^.]+).*/, '$1.supabase.co') : 'Not Configured',
    lastSyncTime: lastSupabaseSync,
    error: lastErrorMessage,
    hasServiceKey: Boolean(config.supabaseServiceRoleKey),
    hasAnonKey: Boolean(config.supabaseAnonKey),
  };
}
