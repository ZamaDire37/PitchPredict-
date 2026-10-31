import { db } from './database.js';

db.exec(`
  DELETE FROM matches 
  WHERE (external_id >= 501000 AND external_id < 600000)
     OR home_team_name LIKE 'Team %'
     OR home_team_name LIKE 'Test Team%'
     OR home_team_name = 'Live Home'
     OR away_team_name LIKE 'Team %'
     OR away_team_name LIKE 'Test Team%';

  DELETE FROM predictions WHERE match_id NOT IN (SELECT id FROM matches);
`);
console.log('Test and mock fixtures cleaned up successfully.');
