import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  requireSupabase,
  assertSupabaseOk,
  insertRowWithAutoId,
  sendRouteError,
  getSupabaseDiagnostics,
  testSupabaseConnection,
} from '../db/supabaseClient.js';
import { config } from '../config.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

function generateToken(user: { id: number; username: string; email: string }) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    config.jwtSecret,
    { expiresIn: '30d' }
  );
}

function escapeIlikePattern(val: string): string {
  return val.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

async function getBasicCounts(userId: number): Promise<{
  basicDailyCount: number;
  basicPendingCount: number;
}> {
  const client = requireSupabase();
  const todayStartIso = `${new Date().toISOString().split('T')[0]}T00:00:00.000Z`;

  const [dailyRes, pendingRes] = await Promise.all([
    client
      .from('predictions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('mode', 'BASIC')
      .gte('created_at', todayStartIso),
    client
      .from('predictions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('mode', 'BASIC')
      .eq('status', 'PENDING'),
  ]);

  assertSupabaseOk(dailyRes.error, 'Count daily Basic predictions');
  assertSupabaseOk(pendingRes.error, 'Count pending Basic predictions');

  return {
    basicDailyCount: dailyRes.count ?? 0,
    basicPendingCount: pendingRes.count ?? 0,
  };
}

// Register Official Real Account (Supabase-exclusive)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, valid email, and password are required.' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res
        .status(400)
        .json({ error: 'Please enter a valid real email address (e.g. name@domain.com).' });
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 25) {
      return res.status(400).json({ error: 'Username must be between 3 and 25 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res
        .status(400)
        .json({ error: 'Username can only contain letters, numbers, and underscores.' });
    }

    if (
      cleanUsername.toLowerCase().startsWith('player_') ||
      cleanUsername.toLowerCase().startsWith('guest_')
    ) {
      return res
        .status(400)
        .json({ error: 'Official accounts cannot use temporary guest name prefixes.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const client = requireSupabase();

    // Case-insensitive uniqueness check on username & email without creating duplicates
    const [existingByUsername, existingByEmail] = await Promise.all([
      client
        .from('users')
        .select('id, username')
        .ilike('username', escapeIlikePattern(cleanUsername))
        .limit(5),
      client
        .from('users')
        .select('id, email')
        .ilike('email', escapeIlikePattern(cleanEmail))
        .limit(5),
    ]);

    assertSupabaseOk(existingByUsername.error, 'Check existing username');
    assertSupabaseOk(existingByEmail.error, 'Check existing email');

    const usernameConflict = (existingByUsername.data || []).some(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    const emailConflict = (existingByEmail.data || []).some(
      (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
    );

    if (usernameConflict || emailConflict) {
      return res
        .status(409)
        .json({ error: 'An official account with this username or email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);
    const nowIso = new Date().toISOString();

    const user = await insertRowWithAutoId<{
      id: number;
      username: string;
      email: string;
      basic_points: number;
      serious_points: number;
      basic_streak: number;
      basic_best_streak: number;
      serious_streak: number;
      serious_best_streak: number;
      is_verified: boolean;
      account_type: string;
      created_at: string;
    }>(
      'users',
      {
        username: cleanUsername,
        email: cleanEmail,
        password_hash: passwordHash,
        basic_points: 0,
        serious_points: 0,
        basic_streak: 0,
        basic_best_streak: 0,
        serious_streak: 0,
        serious_best_streak: 0,
        is_verified: true,
        account_type: 'OFFICIAL',
        created_at: nowIso,
        updated_at: nowIso,
      },
      'id, username, email, basic_points, serious_points, basic_streak, basic_best_streak, serious_streak, serious_best_streak, is_verified, account_type, created_at'
    );

    // Seed initial points history in Supabase (starting balance: 0 points)
    await insertRowWithAutoId('points_history', {
      user_id: user.id,
      mode: 'BASIC',
      delta: 0,
      balance_after: 0,
      reason: 'Welcome: Initial Basic Mode balance (0 points)',
      created_at: nowIso,
    });
    await insertRowWithAutoId('points_history', {
      user_id: user.id,
      mode: 'SERIOUS',
      delta: 0,
      balance_after: 0,
      reason: 'Welcome: Initial Serious Mode balance (0 points)',
      created_at: nowIso,
    });

    const token = generateToken(user);
    res.json({
      token,
      user: {
        ...user,
        is_verified: Boolean(user.is_verified ?? true),
        account_type: user.account_type || 'OFFICIAL',
        basic_daily_count: 0,
        basic_pending_count: 0,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    if (err?.code === '23505') {
      return res
        .status(409)
        .json({ error: 'An official account with this username or email already exists.' });
    }
    return sendRouteError(res, err, 'Registration failed due to server error.');
  }
});

// Login (Supabase-exclusive)
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Please provide credentials.' });
    }

    const identifier = String(usernameOrEmail).trim();
    const client = requireSupabase();

    const selectCols =
      'id, username, email, password_hash, basic_points, serious_points, basic_streak, basic_best_streak, serious_streak, serious_best_streak, is_verified, account_type';

    let user: any = null;
    if (identifier.includes('@')) {
      const byEmail = await client
        .from('users')
        .select(selectCols)
        .ilike('email', escapeIlikePattern(identifier.toLowerCase()))
        .limit(5);
      assertSupabaseOk(byEmail.error, 'Lookup user by email');
      user = (byEmail.data || []).find(
        (u) => u.email.toLowerCase() === identifier.toLowerCase()
      );
    } else {
      const byUsername = await client
        .from('users')
        .select(selectCols)
        .ilike('username', escapeIlikePattern(identifier))
        .limit(5);
      assertSupabaseOk(byUsername.error, 'Lookup user by username');
      user = (byUsername.data || []).find(
        (u) => u.username.toLowerCase() === identifier.toLowerCase()
      );
    }

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const { basicDailyCount, basicPendingCount } = await getBasicCounts(user.id);
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        basic_points: user.basic_points,
        serious_points: user.serious_points,
        basic_streak: user.basic_streak,
        basic_best_streak: user.basic_best_streak,
        serious_streak: user.serious_streak,
        serious_best_streak: user.serious_best_streak,
        is_verified: Boolean(user.is_verified ?? true),
        account_type: user.account_type || 'OFFICIAL',
        basic_daily_count: basicDailyCount,
        basic_pending_count: basicPendingCount,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return sendRouteError(res, err, 'Login failed due to server error.');
  }
});

// Deprecate anonymous guest login: Official accounts are required
router.post('/guest', (_req, res) => {
  res.status(403).json({
    error:
      'Guest predictions have been disabled. PitchPredict is now in Official mode. Please Sign Up for a free verified account to place predictions.',
    code: 'OFFICIAL_ACCOUNT_REQUIRED',
  });
});

// Me (current authenticated user profile from Supabase)
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const client = requireSupabase();
    const { data: user, error } = await client
      .from('users')
      .select(
        'id, username, email, basic_points, serious_points, basic_streak, basic_best_streak, serious_streak, serious_best_streak, is_verified, account_type, created_at'
      )
      .eq('id', req.user!.id)
      .maybeSingle();

    assertSupabaseOk(error, 'Fetch current user');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { basicDailyCount, basicPendingCount } = await getBasicCounts(user.id);

    res.json({
      user: {
        ...user,
        is_verified: Boolean(user.is_verified ?? true),
        account_type: user.account_type || 'OFFICIAL',
        basic_daily_count: basicDailyCount,
        basic_pending_count: basicPendingCount,
      },
    });
  } catch (err: any) {
    console.error('Get current user error:', err);
    return sendRouteError(res, err, 'Failed to fetch current user profile.');
  }
});

// Database & Supabase Connectivity Status (no raw credentials exposed)
router.get('/database-status', async (_req, res) => {
  try {
    const connection = await testSupabaseConnection();
    const diagnostics = getSupabaseDiagnostics();
    const statusCode = connection.connected ? 200 : 503;
    res.status(statusCode).json({
      database: {
        ...diagnostics,
        ...connection,
        unifiedProvider: 'Supabase Free (PostgreSQL Cloud — Exclusive)',
      },
    });
  } catch (err: any) {
    return sendRouteError(res, err, 'Failed to retrieve database status');
  }
});

// Verify Supabase Cloud live counts (replaces legacy SQLite->Supabase sync)
router.post('/sync-supabase', async (_req, res) => {
  try {
    const conn = await testSupabaseConnection();
    if (!conn.connected) {
      return res.status(503).json({
        success: false,
        totalSynced: 0,
        error: conn.error || 'Supabase PostgreSQL is unavailable.',
        code: 'DATABASE_UNAVAILABLE',
      });
    }
    res.json({
      success: true,
      totalSynced: conn.matchCount ?? 0,
      matchesSynced: conn.matchCount ?? 0,
      usersSynced: conn.userCount ?? 0,
      predictionsSynced: 0,
      message: 'Supabase PostgreSQL is active as the exclusive primary database.',
    });
  } catch (err: any) {
    return sendRouteError(res, err, 'Failed to verify Supabase status');
  }
});

export default router;
