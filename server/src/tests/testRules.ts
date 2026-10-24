import { evaluatePrediction, evaluateSeriousSet, gradeMatch } from '../services/scoringEngine.js';
import { PredictionService } from '../services/predictionService.js';
import { run, queryOne, queryAll, initDatabase, db } from '../db/database.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log('\n=== RUNNING SCORING & RULE TESTS ===\n');

  // Test 1: Prediction Evaluation for all markets
  console.log('--- Testing Market Evaluations ---');
  // Match Winner
  assert(evaluatePrediction('MATCH_WINNER', 'HOME', { homeScore: 2, awayScore: 1, homeCorners: 5, awayCorners: 4 }).isCorrect === true, 'Home win correct');
  assert(evaluatePrediction('MATCH_WINNER', 'AWAY', { homeScore: 2, awayScore: 1, homeCorners: 5, awayCorners: 4 }).isCorrect === false, 'Away win incorrect on 2-1');
  assert(evaluatePrediction('MATCH_WINNER', 'DRAW', { homeScore: 1, awayScore: 1, homeCorners: 5, awayCorners: 4 }).isCorrect === true, 'Draw correct on 1-1');

  // Double Chance
  assert(evaluatePrediction('DOUBLE_CHANCE', '1X', { homeScore: 2, awayScore: 2, homeCorners: 5, awayCorners: 4 }).isCorrect === true, '1X correct on draw');
  assert(evaluatePrediction('DOUBLE_CHANCE', '1X', { homeScore: 1, awayScore: 2, homeCorners: 5, awayCorners: 4 }).isCorrect === false, '1X false on away win');
  assert(evaluatePrediction('DOUBLE_CHANCE', '12', { homeScore: 1, awayScore: 2, homeCorners: 5, awayCorners: 4 }).isCorrect === true, '12 correct on away win');
  assert(evaluatePrediction('DOUBLE_CHANCE', '12', { homeScore: 1, awayScore: 1, homeCorners: 5, awayCorners: 4 }).isCorrect === false, '12 false on draw');

  // Goals Over / Under
  assert(evaluatePrediction('GOALS_OVER_UNDER', 'OVER_2.5', { homeScore: 2, awayScore: 1, homeCorners: 5, awayCorners: 4 }).isCorrect === true, 'Over 2.5 correct on 3 goals');
  assert(evaluatePrediction('GOALS_OVER_UNDER', 'UNDER_2.5', { homeScore: 1, awayScore: 1, homeCorners: 5, awayCorners: 4 }).isCorrect === true, 'Under 2.5 correct on 2 goals');
  assert(evaluatePrediction('GOALS_OVER_UNDER', 'OVER_3.5', { homeScore: 2, awayScore: 1, homeCorners: 5, awayCorners: 4 }).isCorrect === false, 'Over 3.5 false on 3 goals');

  // Corners Over / Under
  assert(evaluatePrediction('CORNERS_OVER_UNDER', 'OVER_8.5', { homeScore: 1, awayScore: 0, homeCorners: 6, awayCorners: 4 }).isCorrect === true, 'Corners Over 8.5 correct on 10 corners');
  assert(evaluatePrediction('CORNERS_OVER_UNDER', 'UNDER_8.5', { homeScore: 1, awayScore: 0, homeCorners: 4, awayCorners: 3 }).isCorrect === true, 'Corners Under 8.5 correct on 7 corners');

  // Exact Score
  assert(evaluatePrediction('EXACT_SCORE', '2-1', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Exact score 2-1 correct');
  assert(evaluatePrediction('EXACT_SCORE', '2-0', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === false, 'Exact score 2-0 false');

  // BTTS
  assert(evaluatePrediction('BTTS', 'YES', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'BTTS YES correct on 2-1');
  assert(evaluatePrediction('BTTS', 'NO', { homeScore: 2, awayScore: 0, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'BTTS NO correct on 2-0');
  assert(evaluatePrediction('BTTS', 'YES', { homeScore: 2, awayScore: 0, homeCorners: 0, awayCorners: 0 }).isCorrect === false, 'BTTS YES false on 2-0');

  console.log('\n--- Testing Basic Mode vs Serious Mode in Database ---');
  // Create a dedicated test user
  const testUserRes = run(
    `INSERT INTO users (username, email, password_hash, basic_points, serious_points)
     VALUES (?, ?, 'hash', 100, 100)`,
    [`test_bot_${Date.now()}`, `bot_${Date.now()}@test.com`]
  );
  const testUserId = testUserRes.lastInsertRowid;

  // Insert two test matches in the future
  const future1 = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
  const future2 = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
  const m1Res = run(
    `INSERT INTO matches (external_id, competition_id, competition_name, utc_date, status, home_team_name, away_team_name)
     VALUES (?, 'PL', 'Premier League', ?, 'TIMED', 'Test Team A', 'Test Team B')`,
    [Math.floor(Math.random() * 900000) + 100000, future1]
  );
  const m2Res = run(
    `INSERT INTO matches (external_id, competition_id, competition_name, utc_date, status, home_team_name, away_team_name)
     VALUES (?, 'PL', 'Premier League', ?, 'TIMED', 'Test Team C', 'Test Team D')`,
    [Math.floor(Math.random() * 900000) + 100000, future2]
  );
  const match1Id = m1Res.lastInsertRowid;
  const match2Id = m2Res.lastInsertRowid;

  // Test Basic Mode predictions
  PredictionService.createBasicPredictions(testUserId, [
    { matchId: match1Id, marketType: 'MATCH_WINNER', selection: 'HOME' }, // 10 pts
    { matchId: match2Id, marketType: 'EXACT_SCORE', selection: '2-0' },   // 30 pts
  ]);

  // Finish match 1 with 2-1 (HOME won!) -> Basic prediction correct (+10 pts)
  run(
    `UPDATE matches SET status = 'FINISHED', home_score = 2, away_score = 1, home_corners = 5, away_corners = 4 WHERE id = ?`,
    [match1Id]
  );
  gradeMatch(match1Id);

  let user = queryOne<any>('SELECT * FROM users WHERE id = ?', [testUserId]);
  assert(user.basic_points === 110, `Basic points increased from 100 to 110 on correct prediction (actual: ${user.basic_points})`);
  assert(user.serious_points === 100, `Serious points remained untouched at 100 (actual: ${user.serious_points})`);

  // Finish match 2 with 1-1 (2-0 missed!) -> Basic prediction wrong (0 pts, NO penalty)
  run(
    `UPDATE matches SET status = 'FINISHED', home_score = 1, away_score = 1, home_corners = 5, away_corners = 4 WHERE id = ?`,
    [match2Id]
  );
  gradeMatch(match2Id);

  user = queryOne<any>('SELECT * FROM users WHERE id = ?', [testUserId]);
  assert(user.basic_points === 110, `Basic points remain 110 with 0 penalty on incorrect prediction (actual: ${user.basic_points})`);
  assert(user.serious_points === 100, `Serious points remain completely separate at 100 (actual: ${user.serious_points})`);

  console.log('\n--- Testing Serious Mode Sets & -10 Point Rule ---');
  // Create 2 new matches for a Serious Set
  const future3 = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
  const future4 = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
  const m3Res = run(
    `INSERT INTO matches (external_id, competition_id, competition_name, utc_date, status, home_team_name, away_team_name)
     VALUES (?, 'PL', 'Premier League', ?, 'TIMED', 'Test Team E', 'Test Team F')`,
    [Math.floor(Math.random() * 900000) + 100000, future3]
  );
  const m4Res = run(
    `INSERT INTO matches (external_id, competition_id, competition_name, utc_date, status, home_team_name, away_team_name)
     VALUES (?, 'PL', 'Premier League', ?, 'TIMED', 'Test Team G', 'Test Team H')`,
    [Math.floor(Math.random() * 900000) + 100000, future4]
  );
  const match3Id = m3Res.lastInsertRowid;
  const match4Id = m4Res.lastInsertRowid;

  // Create a Serious Set:
  // Pick 1: match 3 HOME (10 pts)
  // Pick 2: match 4 BTTS YES (10 pts)
  // Potential: 20 pts
  const seriousSet = PredictionService.createSeriousSet(testUserId, 'Test Double', [
    { matchId: match3Id, marketType: 'MATCH_WINNER', selection: 'HOME' },
    { matchId: match4Id, marketType: 'BTTS', selection: 'YES' },
  ]);

  assert(seriousSet.potentialPoints === 20, 'Serious Set potential points calculated as 20');

  // Match 3 finishes: 2-0 (HOME won -> correct)
  run(`UPDATE matches SET status = 'FINISHED', home_score = 2, away_score = 0 WHERE id = ?`, [match3Id]);
  gradeMatch(match3Id);

  // Set is still pending because match 4 hasn't finished yet
  let setInDb = queryOne<any>('SELECT * FROM serious_sets WHERE id = ?', [seriousSet.setId]);
  assert(setInDb.status === 'PENDING', 'Serious set is still PENDING while second match is unfinished');

  // Match 4 finishes: 1-0 (BTTS is NO -> so BTTS YES failed!)
  // Requirement: "If at least one prediction in a set is wrong, deduct 10 points once for that entire set, regardless of how many predictions were wrong."
  run(`UPDATE matches SET status = 'FINISHED', home_score = 1, away_score = 0 WHERE id = ?`, [match4Id]);
  gradeMatch(match4Id);

  setInDb = queryOne<any>('SELECT * FROM serious_sets WHERE id = ?', [seriousSet.setId]);
  assert(setInDb.status === 'LOST', 'Serious set status is LOST');
  assert(setInDb.points_delta === -10, 'Set points_delta is -10');

  user = queryOne<any>('SELECT * FROM users WHERE id = ?', [testUserId]);
  assert(user.serious_points === 90, `Serious points deducted by 10 to 90 (actual: ${user.serious_points})`);
  assert(user.basic_points === 110, `Basic points completely unchanged at 110 (actual: ${user.basic_points})`);

  console.log('\n--- Testing Kickoff Lock ---');
  // Insert past match
  const pastMatchRes = run(
    `INSERT INTO matches (external_id, competition_id, competition_name, utc_date, status, home_team_name, away_team_name)
     VALUES (?, 'PL', 'Premier League', datetime('now', '-10 minutes'), 'IN_PLAY', 'Live Home', 'Live Away')`,
    [Math.floor(Math.random() * 900000) + 100000]
  );
  let lockedCaught = false;
  try {
    PredictionService.createBasicPredictions(testUserId, [
      { matchId: pastMatchRes.lastInsertRowid, marketType: 'MATCH_WINNER', selection: 'HOME' }
    ]);
  } catch (err: any) {
    lockedCaught = true;
    assert(err.message.includes('locked') || err.message.includes('started') || err.message.includes('no longer accepting'), 'Kickoff lock correctly rejected');
  }
  assert(lockedCaught, 'Past match prediction was successfully rejected by kickoff lock');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
