import { db } from './database.js';

export function runFullCleanup() {
  // 1. Purge any synthetic, test, or mock matches
  db.exec(`
    DELETE FROM matches 
    WHERE (external_id >= 501000 AND external_id < 600000)
       OR home_team_name LIKE 'Team %'
       OR home_team_name LIKE 'Test %'
       OR home_team_name LIKE '%Mock%'
       OR home_team_name = 'Live Home'
       OR away_team_name LIKE 'Team %'
       OR away_team_name LIKE 'Test %'
       OR away_team_name LIKE '%Mock%';

    DELETE FROM predictions WHERE match_id NOT IN (SELECT id FROM matches);
  `);

  // 2. Clear all mock/test predictions, serious sets, and point history
  db.exec(`
    DELETE FROM predictions;
    DELETE FROM serious_sets;
    DELETE FROM points_history;
    UPDATE users SET 
      basic_points = 0,
      serious_points = 0,
      basic_streak = 0,
      basic_best_streak = 0,
      serious_streak = 0,
      serious_best_streak = 0;
  `);

  console.log('Test and mock fixtures, predictions, and scores cleaned up successfully.');
}

runFullCleanup();
