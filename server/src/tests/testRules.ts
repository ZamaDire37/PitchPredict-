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

  // Draw No Bet
  assert(evaluatePrediction('DRAW_NO_BET', 'HOME_DNB', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'DNB HOME correct on 2-1');
  assert(evaluatePrediction('DRAW_NO_BET', 'AWAY_DNB', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === false, 'DNB AWAY false on 2-1');

  // Match Result & Total Goals Combo
  assert(evaluatePrediction('MATCH_RESULT_AND_TOTAL_GOALS', 'HOME_OVER_2.5', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Result + O2.5 correct on 2-1');
  assert(evaluatePrediction('MATCH_RESULT_AND_TOTAL_GOALS', 'HOME_UNDER_2.5', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === false, 'Result + U2.5 false on 2-1');
  assert(evaluatePrediction('MATCH_RESULT_AND_TOTAL_GOALS', 'DRAW_UNDER_2.5', { homeScore: 1, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Draw + U2.5 correct on 1-1');

  // European Handicap (-1)
  assert(evaluatePrediction('HANDICAP_RESULT', 'HOME_MINUS_1', { homeScore: 3, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Handicap HOME -1 correct on 3-1');
  assert(evaluatePrediction('HANDICAP_RESULT', 'HANDICAP_TIE', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Handicap DRAW -1 correct on 2-1');
  assert(evaluatePrediction('HANDICAP_RESULT', 'AWAY_PLUS_1', { homeScore: 1, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Handicap AWAY +1 correct on 1-1');

  // Goals & Corners Ranges
  assert(evaluatePrediction('HOME_TEAM_GOALS', 'HOME_OVER_1.5', { homeScore: 2, awayScore: 0, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Home team goals Over 1.5 correct on 2');
  assert(evaluatePrediction('AWAY_TEAM_GOALS', 'AWAY_UNDER_0.5', { homeScore: 2, awayScore: 0, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Away team goals Under 0.5 correct on 0');
  assert(evaluatePrediction('EXACT_TOTAL_GOALS', '3_GOALS', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Exact total goals 3 correct on 2-1');
  assert(evaluatePrediction('TOTAL_GOALS_RANGE', '2-3_GOALS', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Total goals range 2-3 correct on 3 goals');
  assert(evaluatePrediction('ODD_EVEN_GOALS', 'ODD', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Odd/Even ODD correct on 3 goals');
  assert(evaluatePrediction('ODD_EVEN_GOALS', 'EVEN', { homeScore: 2, awayScore: 2, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Odd/Even EVEN correct on 4 goals');

  // BTTS Combos & Margins
  assert(evaluatePrediction('BTTS_AND_WIN', 'BTTS_YES_HOME', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'BTTS & Win HOME_AND_YES correct on 2-1');
  assert(evaluatePrediction('BTTS_AND_OVER_UNDER', 'BTTS_YES_OVER_2.5', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'BTTS & O2.5 correct on 2-1');
  assert(evaluatePrediction('BTTS_OR_OVER_2_5', 'BTTS_OR_OVER_YES', { homeScore: 3, awayScore: 0, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'BTTS or Over 2.5 YES correct on 3-0');
  assert(evaluatePrediction('WIN_TO_NIL', 'HOME_WIN_TO_NIL', { homeScore: 2, awayScore: 0, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Win to nil HOME correct on 2-0');
  assert(evaluatePrediction('TEAM_TO_SCORE', 'ONLY_HOME_SCORES', { homeScore: 2, awayScore: 0, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Team to score ONLY_HOME correct on 2-0');
  assert(evaluatePrediction('CLEAN_SHEET_HOME', 'HOME_CS_YES', { homeScore: 1, awayScore: 0, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Clean sheet home YES on 1-0');
  assert(evaluatePrediction('CLEAN_SHEET_AWAY', 'AWAY_CS_NO', { homeScore: 1, awayScore: 0, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Clean sheet away NO on 1-0');
  assert(evaluatePrediction('WINNING_MARGIN', 'HOME_BY_1', { homeScore: 2, awayScore: 1, homeCorners: 0, awayCorners: 0 }).isCorrect === true, 'Winning margin HOME_BY_1 correct on 2-1');

  // Corners Special
  assert(evaluatePrediction('MOST_CORNERS', 'HOME_MOST_CORNERS', { homeScore: 0, awayScore: 0, homeCorners: 6, awayCorners: 3 }).isCorrect === true, 'Most corners HOME on 6-3');
  assert(evaluatePrediction('TOTAL_CORNERS_RANGE', '8-11_CORNERS', { homeScore: 0, awayScore: 0, homeCorners: 6, awayCorners: 4 }).isCorrect === true, 'Corners range 8-11 on 10 corners');

  console.log('\n--- Testing Basic Mode vs Serious Mode in Database ---');
  // 1. Verify all new users start at 0 points
  const defaultUserRes = run(
    `INSERT INTO users (username, email, password_hash)
     VALUES (?, ?, 'hash')`,
    [`default_user_${Date.now()}`, `default_${Date.now()}@test.com`]
  );
  const defaultUserId = defaultUserRes.lastInsertRowid;
  const defaultUser = queryOne<any>('SELECT * FROM users WHERE id = ?', [defaultUserId]);
  assert(defaultUser.basic_points === 0, 'New user defaults to 0 Basic Points');
  assert(defaultUser.serious_points === 0, 'New user defaults to 0 Serious Points');

  // Create a dedicated test user starting at 0 points
  const testUserRes = run(
    `INSERT INTO users (username, email, password_hash, basic_points, serious_points)
     VALUES (?, ?, 'hash', 0, 0)`,
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
  assert(user.basic_points === 10, `Basic points increased from 0 to 10 on correct prediction (actual: ${user.basic_points})`);
  assert(user.serious_points === 0, `Serious points remained untouched at 0 (actual: ${user.serious_points})`);

  // Finish match 2 with 1-1 (2-0 missed!) -> Basic prediction wrong (0 pts, NO penalty)
  run(
    `UPDATE matches SET status = 'FINISHED', home_score = 1, away_score = 1, home_corners = 5, away_corners = 4 WHERE id = ?`,
    [match2Id]
  );
  gradeMatch(match2Id);

  user = queryOne<any>('SELECT * FROM users WHERE id = ?', [testUserId]);
  assert(user.basic_points === 10, `Basic points remain 10 with 0 penalty on incorrect prediction (actual: ${user.basic_points})`);
  assert(user.serious_points === 0, `Serious points remain completely separate at 0 (actual: ${user.serious_points})`);

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
  assert(user.serious_points === -10, `Serious points deducted by 10 from 0 to -10 (actual: ${user.serious_points})`);
  assert(user.basic_points === 10, `Basic points completely unchanged at 10 (actual: ${user.basic_points})`);

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

  console.log('\n--- Testing Basic Mode 10 Selections Limit ---');
  // Create 11 future matches
  const matchIds: number[] = [];
  for (let i = 1; i <= 11; i++) {
    const res = run(
      `INSERT INTO matches (external_id, competition_id, competition_name, utc_date, status, home_team_name, away_team_name)
       VALUES (?, 'PL', 'Premier League', datetime('now', '+${i + 5} hours'), 'TIMED', 'Team ${i}A', 'Team ${i}B')`,
      [Math.floor(Math.random() * 900000) + 100000]
    );
    matchIds.push(res.lastInsertRowid);
  }

  // Create a fresh test user (starts at 0 points by default)
  const limitUserRes = run(
    `INSERT INTO users (username, email, password_hash)
     VALUES (?, ?, 'hash')`,
    [`limit_user_${Date.now()}`, `limit_${Date.now()}@test.com`]
  );
  const limitUserId = limitUserRes.lastInsertRowid;

  // 1. Attempting 11 selections in a single batch should fail
  let batchLimitCaught = false;
  try {
    const items11 = matchIds.map(id => ({ matchId: id, marketType: 'MATCH_WINNER', selection: 'HOME' }));
    PredictionService.createBasicPredictions(limitUserId, items11);
  } catch (err: any) {
    batchLimitCaught = true;
    assert(err.message.includes('10 selections per day') || err.message.includes('limit of 10 selections'), `Batch > 10 correctly rejected: ${err.message}`);
  }
  assert(batchLimitCaught, 'Batch of 11 selections was successfully blocked');

  // 2. Making 10 selections should succeed
  const items10 = matchIds.slice(0, 10).map(id => ({ matchId: id, marketType: 'MATCH_WINNER', selection: 'HOME' }));
  const created10 = PredictionService.createBasicPredictions(limitUserId, items10);
  assert(created10.length === 10, 'Successfully placed exactly 10 Basic Mode selections');

  // 3. Attempting to add an 11th selection today must fail
  let excessCaught = false;
  try {
    PredictionService.createBasicPredictions(limitUserId, [
      { matchId: matchIds[10], marketType: 'MATCH_WINNER', selection: 'AWAY' }
    ]);
  } catch (err: any) {
    excessCaught = true;
    assert(err.message.includes('10 selections per day') || err.message.includes('limit of 10 selections'), `11th selection correctly rejected: ${err.message}`);
  }
  assert(excessCaught, '11th daily Basic Mode selection was blocked by daily quota of 10');

  // 4. Updating an already pending selection (same match & market) made today should succeed without exceeding daily limit
  const updated = PredictionService.createBasicPredictions(limitUserId, [
    { matchId: matchIds[0], marketType: 'MATCH_WINNER', selection: 'DRAW' }
  ]);
  assert(updated[0].updated === true, 'Updating an existing pending pick is permitted without consuming extra daily slots');

  // Clean up all test data so database is never polluted
  run(`DELETE FROM predictions WHERE user_id IN (?, ?, ?)`, [defaultUserId, testUserId, limitUserId]);
  run(`DELETE FROM serious_sets WHERE user_id IN (?, ?, ?)`, [defaultUserId, testUserId, limitUserId]);
  run(`DELETE FROM users WHERE id IN (?, ?, ?)`, [defaultUserId, testUserId, limitUserId]);
  run(`DELETE FROM matches WHERE home_team_name LIKE 'Team %' OR home_team_name LIKE 'Test Team%' OR home_team_name LIKE 'Live Home%'`);

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
