import axios from 'axios';

async function runE2E() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('\n=== RUNNING FULL END-TO-END SYSTEM INTEGRATION TEST ===\n');

  // Step 1: Register User
  const username = `champ_${Date.now()}`;
  const email = `champ_${Date.now()}@test.com`;
  console.log(`[1] Registering user "${username}"...`);

  const regRes = await axios.post(`${BASE_URL}/auth/register`, {
    username,
    email,
    password: 'password123',
  });

  const token = regRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  console.log(`User registered! Initial balances: Basic=${regRes.data.user.basic_points}, Serious=${regRes.data.user.serious_points}`);

  // Step 2: Fetch Upcoming Matches
  console.log('\n[2] Fetching upcoming matches...');
  const matchesRes = await axios.get(`${BASE_URL}/matches?filter=upcoming`, { headers });
  const matches = matchesRes.data.matches;
  console.log(`Retrieved ${matches.length} upcoming matches from system.`);

  const futureMatches = matches.filter((m: any) => new Date(m.utc_date).getTime() > Date.now());
  const m1 = futureMatches[0] || matches[0];
  const m2 = futureMatches[1] || matches[1];

  console.log(`Match 1: ${m1.home_team_name} vs ${m1.away_team_name}`);
  console.log(`Match 2: ${m2.home_team_name} vs ${m2.away_team_name}`);

  // Step 3: Place Basic Mode Prediction on Match 1 (Exact Score: 2-1, 30 pts)
  console.log('\n[3] Submitting Basic Mode prediction (Exact Score 2-1)...');
  const basicRes = await axios.post(
    `${BASE_URL}/predictions/basic`,
    {
      predictions: [{ matchId: m1.id, marketType: 'EXACT_SCORE', selection: '2-1' }],
    },
    { headers }
  );
  console.log(`Basic Mode Response:`, basicRes.data.message);

  // Step 4: Place Serious Mode Set on Match 1 (1X, 6 pts) and Match 2 (OVER_2.5, 10 pts)
  console.log('\n[4] Submitting Serious Mode Multi-Set (2 picks, potential +16 pts / -10 risk)...');
  const seriousRes = await axios.post(
    `${BASE_URL}/predictions/serious-set`,
    {
      name: 'Weekend European Double',
      predictions: [
        { matchId: m1.id, marketType: 'DOUBLE_CHANCE', selection: '1X' },
        { matchId: m2.id, marketType: 'GOALS_OVER_UNDER', selection: 'OVER_2.5' },
      ],
    },
    { headers }
  );
  console.log(`Serious Mode Response:`, seriousRes.data.message);

  // Step 5: Simulate Match 1 Finishing 2-1 (Exact score correct, 1X correct)
  console.log('\n[5] Simulating Match 1 finish: 2-1 with 10 corners...');
  const sim1 = await axios.post(
    `${BASE_URL}/matches/${m1.id}/simulate-result`,
    { homeScore: 2, awayScore: 1, homeCorners: 6, awayCorners: 4 },
    { headers }
  );
  console.log(`Match 1 result:`, sim1.data.message);

  // Check user after Match 1
  let me = (await axios.get(`${BASE_URL}/auth/me`, { headers })).data.user;
  console.log(`User after Match 1: Basic Points=${me.basic_points} (expected 30), Serious Points=${me.serious_points} (expected 0)`);
  if (me.basic_points !== 30) throw new Error(`Expected basic points to be 30, got ${me.basic_points}`);
  if (me.serious_points !== 0) throw new Error(`Expected serious points to be 0, got ${me.serious_points}`);

  // Step 6: Simulate Match 2 Finishing 1-0 (Under 2.5 goals -> OVER_2.5 fails -> Set LOST!)
  console.log('\n[6] Simulating Match 2 finish: 1-0 (OVER_2.5 fails -> Set fails!)...');
  const sim2 = await axios.post(
    `${BASE_URL}/matches/${m2.id}/simulate-result`,
    { homeScore: 1, awayScore: 0, homeCorners: 5, awayCorners: 3 },
    { headers }
  );
  console.log(`Match 2 result:`, sim2.data.message);

  // Check user after Match 2
  me = (await axios.get(`${BASE_URL}/auth/me`, { headers })).data.user;
  console.log(`User after Match 2: Basic Points=${me.basic_points} (expected 30), Serious Points=${me.serious_points} (expected -10)`);
  if (me.basic_points !== 30) throw new Error(`Expected basic points to remain 30, got ${me.basic_points}`);
  if (me.serious_points !== -10) throw new Error(`Expected serious points to be deducted by 10 to -10, got ${me.serious_points}`);

  // Step 7: Inspect Points History Ledger
  console.log('\n[7] Verifying Points History Audit Ledger...');
  const ledgerRes = await axios.get(`${BASE_URL}/history/ledger`, { headers });
  console.log(`Retrieved ${ledgerRes.data.history.length} ledger transactions:`);
  for (const entry of ledgerRes.data.history) {
    console.log(` - [${entry.mode}] ${entry.delta >= 0 ? '+' : ''}${entry.delta} pts (balance: ${entry.balance_after}) -> ${entry.reason}`);
  }

  // Step 8: Verify Leaderboards
  console.log('\n[8] Checking Leaderboards...');
  const basicBoard = await axios.get(`${BASE_URL}/leaderboard/basic`);
  const seriousBoard = await axios.get(`${BASE_URL}/leaderboard/serious`);
  console.log(`Basic leaderboard has ${basicBoard.data.leaderboard.length} users. Top: ${basicBoard.data.leaderboard[0].username} (${basicBoard.data.leaderboard[0].basic_points} pts)`);
  console.log(`Serious leaderboard has ${seriousBoard.data.leaderboard.length} users. Top: ${seriousBoard.data.leaderboard[0].username} (${seriousBoard.data.leaderboard[0].serious_points} pts)`);

  console.log('\n>>> ALL END-TO-END INTEGRATION TESTS PASSED WITH 100% SUCCESS! <<<\n');
}

runE2E().catch((err) => {
  console.error('E2E Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
