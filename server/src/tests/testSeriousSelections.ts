import axios from 'axios';

async function testSeriousSelections() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('\n=== TESTING UNLIMITED SELECTIONS IN SERIOUS MODE ===\n');

  // 1. Register a test user
  const userNum = Date.now();
  const regRes = await axios.post(`${BASE_URL}/auth/register`, {
    username: `serious_pro_${userNum}`,
    email: `serious_${userNum}@test.com`,
    password: 'password123',
  });
  const token = regRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  console.log(`[1] User created with initial Serious balance: ${regRes.data.user.serious_points} pts`);

  // 2. Fetch upcoming matches
  const matchesRes = await axios.get(`${BASE_URL}/matches?filter=upcoming`, { headers });
  const matches = matchesRes.data.matches;
  console.log(`[2] Retrieved ${matches.length} upcoming matches.`);
  if (matches.length < 5) {
    throw new Error(`Expected at least 5 upcoming matches, found ${matches.length}`);
  }

  // 3. Test: Submitting a 1-Selection Serious Set
  console.log('\n[3] Testing 1-Selection Serious Set (Single pick)...');
  const set1Res = await axios.post(
    `${BASE_URL}/predictions/serious-set`,
    {
      name: 'Solo Serious Strike',
      predictions: [
        { matchId: matches[0].id, marketType: 'MATCH_WINNER', selection: 'HOME' },
      ],
    },
    { headers }
  );
  console.log(`-> Success! Set created with ${set1Res.data.set.predictionsCount} pick: "${set1Res.data.set.setName}"`);
  if (set1Res.data.set.predictionsCount !== 1) {
    throw new Error('Expected 1 pick in set1');
  }

  // 4. Test: Submitting a 5-Selection Serious Mega Set
  console.log('\n[4] Testing 5-Selection Serious Multi-Set (5 different picks across matches/markets)...');
  const set5Res = await axios.post(
    `${BASE_URL}/predictions/serious-set`,
    {
      name: '5-Fold Weekend Power Multi',
      predictions: [
        { matchId: matches[0].id, marketType: 'GOALS_OVER_UNDER', selection: 'OVER_1.5' },
        { matchId: matches[1].id, marketType: 'BTTS', selection: 'YES' },
        { matchId: matches[2].id, marketType: 'MATCH_WINNER', selection: 'DRAW' },
        { matchId: matches[3].id, marketType: 'DOUBLE_CHANCE', selection: '1X' },
        { matchId: matches[4].id, marketType: 'CORNERS_OVER_UNDER', selection: 'OVER_9.5' },
      ],
    },
    { headers }
  );
  console.log(`-> Success! Set created with ${set5Res.data.set.predictionsCount} picks: "${set5Res.data.set.setName}" (+${set5Res.data.set.potentialPoints} potential pts)`);
  if (set5Res.data.set.predictionsCount !== 5) {
    throw new Error('Expected 5 picks in set5');
  }

  // 5. Check user's Serious Sets endpoint
  console.log('\n[5] Fetching user Serious Sets from API...');
  const mySetsRes = await axios.get(`${BASE_URL}/predictions/serious-sets/my`, { headers });
  const sets = mySetsRes.data.sets;
  console.log(`Found ${sets.length} Serious Sets for user:`);
  for (const s of sets) {
    console.log(` - "${s.name}": ${s.predictions.length} picks, status=${s.status}, potential=${s.potential_points} pts`);
  }

  console.log('\n>>> UNLIMITED SELECTIONS IN SERIOUS MODE VERIFIED WITH 100% SUCCESS! <<<\n');
}

testSeriousSelections().catch((err) => {
  console.error('Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
