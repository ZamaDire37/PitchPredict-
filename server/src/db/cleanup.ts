import { db } from './database.js';

db.exec(`
  DELETE FROM matches WHERE home_team_name LIKE 'Test Team%' OR home_team_name LIKE 'Live Home%';
  DELETE FROM predictions WHERE match_id NOT IN (SELECT id FROM matches);
`);
console.log('Test fixtures cleaned up successfully.');
