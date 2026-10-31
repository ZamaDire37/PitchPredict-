import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'football_prediction.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

export function initDatabase() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      basic_points INTEGER NOT NULL DEFAULT 0,
      serious_points INTEGER NOT NULL DEFAULT 0,
      basic_streak INTEGER NOT NULL DEFAULT 0,
      basic_best_streak INTEGER NOT NULL DEFAULT 0,
      serious_streak INTEGER NOT NULL DEFAULT 0,
      serious_best_streak INTEGER NOT NULL DEFAULT 0,
      is_verified INTEGER NOT NULL DEFAULT 1,
      account_type TEXT NOT NULL DEFAULT 'OFFICIAL',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Matches table (real fixtures from football-data API or sync)
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id INTEGER UNIQUE,
      competition_id TEXT NOT NULL,
      competition_name TEXT NOT NULL,
      competition_emblem TEXT,
      utc_date TEXT NOT NULL, -- ISO 8601 kickoff time
      status TEXT NOT NULL DEFAULT 'TIMED', -- TIMED, SCHEDULED, IN_PLAY, PAUSED, FINISHED, POSTPONED
      matchday INTEGER DEFAULT 1,
      home_team_id INTEGER,
      home_team_name TEXT NOT NULL,
      home_team_short TEXT,
      home_team_crest TEXT,
      away_team_id INTEGER,
      away_team_name TEXT NOT NULL,
      away_team_short TEXT,
      away_team_crest TEXT,
      home_score INTEGER,
      away_score INTEGER,
      home_corners INTEGER,
      away_corners INTEGER,
      winner TEXT, -- HOME_TEAM, AWAY_TEAM, DRAW
      data_source TEXT,
      is_graded INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Serious Sets table (groups predictions in Serious Mode)
    CREATE TABLE IF NOT EXISTS serious_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, WON, LOST
      potential_points INTEGER NOT NULL DEFAULT 0,
      points_delta INTEGER NOT NULL DEFAULT 0,
      total_predictions INTEGER NOT NULL DEFAULT 0,
      correct_predictions INTEGER NOT NULL DEFAULT 0,
      incorrect_predictions INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    -- Predictions table
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK(mode IN ('BASIC', 'SERIOUS')),
      serious_set_id INTEGER REFERENCES serious_sets(id) ON DELETE CASCADE,
      market_type TEXT NOT NULL, -- MATCH_WINNER, DOUBLE_CHANCE, GOALS_OVER_UNDER, CORNERS_OVER_UNDER, EXACT_SCORE, BTTS
      selection TEXT NOT NULL, -- e.g., 'HOME', 'DRAW', 'AWAY', '1X', '12', 'X2', 'OVER_2.5', 'UNDER_2.5', '2-1', 'YES', 'NO', 'OVER_9.5', etc.
      odds_points INTEGER NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CORRECT, INCORRECT, VOID
      actual_result TEXT,
      points_awarded INTEGER NOT NULL DEFAULT 0,
      is_verified_account INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    -- Points history ledger (audits all point changes for both modes)
    CREATE TABLE IF NOT EXISTS points_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK(mode IN ('BASIC', 'SERIOUS')),
      delta INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      prediction_id INTEGER REFERENCES predictions(id) ON DELETE SET NULL,
      serious_set_id INTEGER REFERENCES serious_sets(id) ON DELETE SET NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- System & API Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_matches_utc_date ON matches(utc_date);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_serious_set_id ON predictions(serious_set_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_mode ON predictions(mode);
    CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_serious_sets_user_id ON serious_sets(user_id);
  `);

  // Safe runtime migrations for existing databases
  try {
    const tableInfo = queryOne<{ sql: string }>("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    if (tableInfo && tableInfo.sql.includes('DEFAULT 100')) {
      db.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE users_migrated (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE COLLATE NOCASE,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT NOT NULL,
          basic_points INTEGER NOT NULL DEFAULT 0,
          serious_points INTEGER NOT NULL DEFAULT 0,
          basic_streak INTEGER NOT NULL DEFAULT 0,
          basic_best_streak INTEGER NOT NULL DEFAULT 0,
          serious_streak INTEGER NOT NULL DEFAULT 0,
          serious_best_streak INTEGER NOT NULL DEFAULT 0,
          is_verified INTEGER NOT NULL DEFAULT 1,
          account_type TEXT NOT NULL DEFAULT 'OFFICIAL',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO users_migrated (id, username, email, password_hash, basic_points, serious_points, basic_streak, basic_best_streak, serious_streak, serious_best_streak, is_verified, account_type, created_at, updated_at)
        SELECT id, username, email, password_hash, basic_points, serious_points, basic_streak, basic_best_streak, serious_streak, serious_best_streak, is_verified, account_type, created_at, updated_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_migrated RENAME TO users;
        PRAGMA foreign_keys = ON;
      `);
    }
  } catch (e) {
    console.warn('Migration users table error:', e);
  }

  try {
    db.exec('ALTER TABLE matches ADD COLUMN data_source TEXT;');
  } catch {}
  try {
    db.exec('ALTER TABLE users ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 1;');
  } catch {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN account_type TEXT NOT NULL DEFAULT 'OFFICIAL';");
  } catch {}
  try {
    db.exec('ALTER TABLE predictions ADD COLUMN is_verified_account INTEGER NOT NULL DEFAULT 1;');
  } catch {}
}

// Auto-initialize schema and run migrations
initDatabase();

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return {
    lastInsertRowid: Number(result.lastInsertRowid),
    changes: Number(result.changes),
  };
}
