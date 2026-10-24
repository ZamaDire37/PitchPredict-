import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, run } from '../db/database.js';
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

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }

    if (username.length < 3 || username.length > 25) {
      return res.status(400).json({ error: 'Username must be between 3 and 25 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check existing
    const existing = queryOne(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing) {
      return res.status(409).json({ error: 'Username or email already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = run(
      `INSERT INTO users (username, email, password_hash, basic_points, serious_points)
       VALUES (?, ?, ?, 100, 100)`,
      [username.trim(), email.trim().toLowerCase(), passwordHash]
    );

    const user = queryOne<{
      id: number;
      username: string;
      email: string;
      basic_points: number;
      serious_points: number;
      basic_streak: number;
      serious_streak: number;
    }>('SELECT id, username, email, basic_points, serious_points, basic_streak, serious_streak FROM users WHERE id = ?', [result.lastInsertRowid]);

    if (!user) {
      return res.status(500).json({ error: 'Failed to create user.' });
    }

    // Seed initial points history
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason)
       VALUES (?, 'BASIC', 100, 100, 'Welcome bonus: Initial Basic Mode bankroll')`,
      [user.id]
    );
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason)
       VALUES (?, 'SERIOUS', 100, 100, 'Welcome bonus: Initial Serious Mode bankroll')`,
      [user.id]
    );

    const token = generateToken(user);
    res.json({ token, user });
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
      serious_streak: number;
    }>(
      'SELECT * FROM users WHERE username = ? OR email = ?',
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
        serious_streak: user.serious_streak,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quick Guest login
router.post('/guest', async (req, res) => {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUsername = `Player_${randomSuffix}`;
    const guestEmail = `guest_${randomSuffix}_${Date.now()}@example.com`;
    const guestPass = `guest_pass_${Date.now()}`;
    const salt = await bcrypt.genSalt(6);
    const hash = await bcrypt.hash(guestPass, salt);

    const result = run(
      `INSERT INTO users (username, email, password_hash, basic_points, serious_points)
       VALUES (?, ?, ?, 100, 100)`,
      [guestUsername, guestEmail, hash]
    );

    const user = queryOne<{
      id: number;
      username: string;
      email: string;
      basic_points: number;
      serious_points: number;
      basic_streak: number;
      serious_streak: number;
    }>('SELECT id, username, email, basic_points, serious_points, basic_streak, serious_streak FROM users WHERE id = ?', [result.lastInsertRowid]);

    if (!user) {
      return res.status(500).json({ error: 'Failed to create guest user.' });
    }

    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason)
       VALUES (?, 'BASIC', 100, 100, 'Welcome bonus: Initial Basic Mode bankroll')`,
      [user.id]
    );
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason)
       VALUES (?, 'SERIOUS', 100, 100, 'Welcome bonus: Initial Serious Mode bankroll')`,
      [user.id]
    );

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err: any) {
    console.error('Guest login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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
    created_at: string;
  }>(
    `SELECT id, username, email, basic_points, serious_points,
            basic_streak, basic_best_streak, serious_streak, serious_best_streak, created_at
     FROM users WHERE id = ?`,
    [req.user!.id]
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ user });
});

export default router;
