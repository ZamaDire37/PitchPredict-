import bcrypt from 'bcryptjs';
import { initDatabase, run, queryOne, db } from './database.js';
import { FootballApiService } from '../services/footballApi.js';
import { gradeMatch } from '../services/scoringEngine.js';

async function seed() {
  console.log('--- Initializing Database Schema ---');
  initDatabase();

  console.log('--- Seeding Real Football Fixtures ---');
  FootballApiService.seedRealFixtures(true);

  // Check if sample users exist
  const existingUsers = queryOne<{ count: number }>('SELECT count(*) as count FROM users');
  if (existingUsers && existingUsers.count > 0) {
    console.log('Users already present. Seed complete.');
    return;
  }

  console.log('--- Seeding Community Players & Leaderboards ---');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const players = [
    { username: 'AlexFerguson', email: 'alex@example.com', basicPoints: 245, seriousPoints: 190, basicStreak: 4, seriousStreak: 2 },
    { username: 'TacticalMaster', email: 'tactics@example.com', basicPoints: 210, seriousPoints: 170, basicStreak: 3, seriousStreak: 1 },
    { username: 'GoalHunter', email: 'hunter@example.com', basicPoints: 185, seriousPoints: 80, basicStreak: 1, seriousStreak: 0 },
    { username: 'PitchGenius', email: 'pitch@example.com', basicPoints: 160, seriousPoints: 210, basicStreak: 2, seriousStreak: 3 },
    { username: 'Striker99', email: 'striker@example.com', basicPoints: 130, seriousPoints: 120, basicStreak: 0, seriousStreak: 1 },
  ];

  for (const p of players) {
    const userRes = run(
      `INSERT INTO users (username, email, password_hash, basic_points, serious_points, basic_streak, basic_best_streak, serious_streak, serious_best_streak)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.username, p.email, passwordHash, p.basicPoints, p.seriousPoints, p.basicStreak, p.basicStreak + 2, p.seriousStreak, p.seriousStreak + 1]
    );

    const uid = userRes.lastInsertRowid;

    // Seed points history snapshots for charts
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, created_at)
       VALUES (?, 'BASIC', 100, 100, 'Initial bankroll', datetime('now', '-5 days'))`,
      [uid]
    );
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, created_at)
       VALUES (?, 'BASIC', 30, 130, 'Won: Arsenal vs Chelsea (Exact Score 2-1)', datetime('now', '-3 days'))`,
      [uid]
    );
    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, created_at)
       VALUES (?, 'BASIC', ?, ?, 'Won: Real Madrid vs Barcelona (Match Winner)', datetime('now', '-1 days'))`,
      [uid, p.basicPoints - 130, p.basicPoints]
    );

    run(
      `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, created_at)
       VALUES (?, 'SERIOUS', 100, 100, 'Initial bankroll', datetime('now', '-5 days'))`,
      [uid]
    );

    if (p.seriousPoints > 100) {
      run(
        `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, created_at)
         VALUES (?, 'SERIOUS', ?, ?, 'Won Serious Set: "Champions League Double"', datetime('now', '-2 days'))`,
        [uid, p.seriousPoints - 100, p.seriousPoints]
      );
    } else {
      run(
        `INSERT INTO points_history (user_id, mode, delta, balance_after, reason, created_at)
         VALUES (?, 'SERIOUS', -10, 90, 'Failed Serious Set: "Weekend Accumulator" (-10 pts penalty)', datetime('now', '-2 days'))`,
        [uid]
      );
    }
  }

  // Find finished matches to test grading
  const finishedMatch = queryOne<{ id: number }>("SELECT id FROM matches WHERE status = 'FINISHED' LIMIT 1");
  if (finishedMatch) {
    gradeMatch(finishedMatch.id);
  }

  console.log('--- Database Seeding Complete! ---');
}

seed().catch(console.error);
