import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { queryOne, run } from '../db/database.js';
import { config } from '../config.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  syncUserToSupabase,
  getSupabaseDiagnostics,
  testSupabaseConnection,
  syncMatchesToSupabase,
  syncAllDataToSupabase,
  updateSupabaseCredentials,
} from '../db/supabaseClient.js';

const router = Router();

function generateToken(user: { id: number; username: string; email: string }) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    config.jwtSecret,
    { expiresIn: '30d' }
  );
}

// Helper to count today's Basic Mode predictions for a user (limit: 10 per day)
function getBasicDailyCount(userId: number): number {
  const row = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM predictions WHERE user_id = ? AND mode = 'BASIC' AND date(created_at) = date('now')",
    [userId]
  );
  return row ? row.count : 0;
}

// Helper to count active/pending Basic Mode predictions for a user
function getBasicPendingCount(userId: number): number {
  const row = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM predictions WHERE user_id = ? AND mode = 'BASIC' AND status = 'PENDING'",
    [userId]
  );
  return row ? row.count : 0;
}

// Register Official Real Account
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, valid email, and password are required.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Real email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid real email address (e.g. name@domain.com).' });
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 25) {
      return res.status(400).json({ error: 'Username must be between 3 and 25 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
    }

    if (cleanUsername.toLowerCase().startsWith('player_') || cleanUsername.toLowerCase().startsWith('guest_')) {
      return res.status(400).json({ error: 'Official accounts cannot use temporary guest name prefixes.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check existing
    const existing = queryOne(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existing) {
      return res.status(409).json({ error: 'An official account with this username or email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = run(
      `INSERT INTO users (username, email, password_hash, basic_points, serious_points, is_verified, account_type)
       VALUES (?, ?, ?, 0, 0, 1, 'OFFICIAL')`,
      [cleanUsername, cleanEmail, passwordHash]
    );

    const user = queryOne<{
      id: number;
      username: string;
      email: string;
      basic_points: number;
      serious_points: number;
      basic_streak: number;
      basic_best_streak: number;
      serious_streak: number;
      serious_best_streak: number;
      is_verified: number;
      account_type: string;
      created_at: string;
    }>(
      `SELECT id, username, email, basic_points, serious_points,
              basic_streak, basic_best_streak, serious_streak, serious_best_streak,
              is_verified, account_type, created_at
       FROM users WHERE id = ?`,
      [result.lastInsertRowid]
    );

    if (!user) {
      return res.status(500).json({ error: 'Failed to create user.' });
    }

    // Seed initial points history (starting balance: 0 points)
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason)
       VALUES (?, 'BASIC', 0, 0, 'Welcome: Initial Basic Mode balance (0 points)')`,
      [user.id]
    );
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason)
       VALUES (?, 'SERIOUS', 0, 0, 'Welcome: Initial Serious Mode balance (0 points)')`,
      [user.id]
    );

    // Sync to Supabase in background
    syncUserToSupabase(user).catch((e) => console.warn('Supabase sync warning:', e));

    const token = generateToken(user);
    res.json({
      token,
      user: {
        ...user,
        is_verified: Boolean(user.is_verified),
        account_type: user.account_type || 'OFFICIAL',
        basic_daily_count: getBasicDailyCount(user.id),
        basic_pending_count: getBasicPendingCount(user.id),
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Please provide credentials.' });
    }

    const user = queryOne<{
      id: number;
      username: string;
      email: string;
      password_hash: string;
      basic_points: number;
      serious_points: number;
      basic_streak: number;
      basic_best_streak: number;
      serious_streak: number;
      serious_best_streak: number;
      is_verified: number;
      account_type: string;
    }>(
      `SELECT id, username, email, password_hash, basic_points, serious_points,
              basic_streak, basic_best_streak, serious_streak, serious_best_streak,
              is_verified, account_type
       FROM users WHERE username = ? OR email = ?`,
      [usernameOrEmail.trim(), usernameOrEmail.trim().toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

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
        basic_daily_count: getBasicDailyCount(user.id),
        basic_pending_count: getBasicPendingCount(user.id),
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deprecate anonymous guest login: Official accounts are required
router.post('/guest', (req, res) => {
  res.status(403).json({
    error: 'Guest predictions have been disabled. PitchPredict is now in Official mode. Please Sign Up for a free verified account to place predictions.',
    code: 'OFFICIAL_ACCOUNT_REQUIRED',
  });
});

// Me (current authenticated user profile)
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  const user = queryOne<{
    id: number;
    username: string;
    email: string;
    basic_points: number;
    serious_points: number;
    basic_streak: number;
    basic_best_streak: number;
    serious_streak: number;
    serious_best_streak: number;
    is_verified: number;
    account_type: string;
    created_at: string;
  }>(
    `SELECT id, username, email, basic_points, serious_points,
            basic_streak, basic_best_streak, serious_streak, serious_best_streak,
            is_verified, account_type, created_at
     FROM users WHERE id = ?`,
    [req.user!.id]
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    user: {
      ...user,
      is_verified: Boolean(user.is_verified ?? true),
      account_type: user.account_type || 'OFFICIAL',
      basic_daily_count: getBasicDailyCount(user.id),
      basic_pending_count: getBasicPendingCount(user.id),
    },
  });
});

// Database & Supabase Connectivity Status
router.get('/database-status', async (req, res) => {
  try {
    const connection = await testSupabaseConnection();
    const diagnostics = getSupabaseDiagnostics();
    res.json({
      database: {
        ...diagnostics,
        ...connection,
        unifiedProvider: 'Supabase (PostgreSQL Cloud) + Local Store',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve database status' });
  }
});

// Manual trigger to sync local verified matches, users & data to Supabase
router.post('/sync-supabase', async (req, res) => {
  try {
    const result = await syncAllDataToSupabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync with Supabase' });
  }
});

// Update database configuration (e.g. set Supabase Anon Key)
router.post('/database-config', async (req, res) => {
  try {
    const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = req.body;
    if (supabaseUrl) config.supabaseUrl = supabaseUrl.trim();
    if (supabaseAnonKey) config.supabaseAnonKey = supabaseAnonKey.trim();
    if (supabaseServiceRoleKey) config.supabaseServiceRoleKey = supabaseServiceRoleKey.trim();

    updateSupabaseCredentials(config.supabaseUrl, config.supabaseAnonKey, config.supabaseServiceRoleKey);

    // Save to server/.env
    const envPath = path.resolve(process.cwd(), 'server/.env');
    const envContent = `PORT=${config.port}\nJWT_SECRET=${config.jwtSecret}\nSUPABASE_URL=${config.supabaseUrl}\nSUPABASE_ANON_KEY=${config.supabaseAnonKey}\nSUPABASE_SERVICE_ROLE_KEY=${config.supabaseServiceRoleKey}\n`;
    fs.writeFileSync(envPath, envContent, 'utf8');

    const connection = await testSupabaseConnection();
    res.json({
      success: true,
      message: connection.connected
        ? 'Connected to Supabase successfully!'
        : `Credentials saved: ${connection.error || 'Connection in progress'}`,
      database: connection,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update database config' });
  }
});

export default router;
