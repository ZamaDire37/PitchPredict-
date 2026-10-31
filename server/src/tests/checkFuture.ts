import { initDatabase, queryAll } from '../db/database.js';

initDatabase();

const nowIso = new Date().toISOString();
console.log('Current System Time:', nowIso);

const futureMatches = queryAll(
  "SELECT id, external_id, competition_id, competition_name, home_team_name, away_team_name, utc_date, status, data_source FROM matches WHERE utc_date > ? ORDER BY utc_date ASC",
  [nowIso]
);

console.log(`\nMatches scheduled to be played in the FUTURE (count: ${futureMatches.length}):\n`);
console.table(futureMatches.slice(0, 20));

const pastTimedMatches = queryAll(
  "SELECT count(*) as count FROM matches WHERE status IN ('TIMED', 'SCHEDULED') AND utc_date <= ?",
  [nowIso]
);
console.log(`\nPast matches mistakenly flagged as TIMED/SCHEDULED: ${pastTimedMatches[0]?.count}`);
