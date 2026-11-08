import {
  requireSupabase,
  assertSupabaseOk,
  fetchAllRows,
} from './supabaseClient.js';
import { resolveTeamInfo, COMPETITION_EMBLEMS } from '../services/teamCrestRegistry.js';
import { FootballApiService } from '../services/footballApi.js';
import { REAL_EUROPA_LEAGUE_FIXTURES } from '../services/realEuropaFixtures.js';

export async function enrichAllMatchesInDatabase(): Promise<{
  updatedCount: number;
  cleanedTestCount: number;
}> {
  const client = requireSupabase();

  // 1. Delete dummy test matches if any ever existed
  const delTest1 = await client.from('matches').delete().like('home_team_name', 'Test Team%');
  assertSupabaseOk(delTest1.error, 'Clean test matches');
  const delTest2 = await client.from('matches').delete().eq('home_team_name', 'Live Home');
  assertSupabaseOk(delTest2.error, 'Clean Live Home matches');

  await FootballApiService.seedRealFixtures();

  // 2. Ensure Europa League fixtures are present
  const elCountRes = await client
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('competition_id', 'EL');
  assertSupabaseOk(elCountRes.error, 'Check Europa League match count');

  const allMatches = await fetchAllRows<any>(
    (c) => c.from('matches').select('*'),
    'Fetch matches for crest enrichment'
  );

  let maxId = 0;
  const byExtId = new Map<number, any>();
  for (const m of allMatches) {
    const idNum = Number(m.id) || 0;
    if (idNum > maxId) maxId = idNum;
    if (m.external_id != null) byExtId.set(Number(m.external_id), m);
  }

  const nowIso = new Date().toISOString();

  if ((elCountRes.count ?? 0) < 5) {
    const elUpserts = REAL_EUROPA_LEAGUE_FIXTURES.map((m) => {
      const existing = byExtId.get(m.externalId);
      const id = existing ? Number(existing.id) : ++maxId;
      return {
        id,
        external_id: m.externalId,
        competition_id: m.competitionId,
        competition_name: m.competitionName,
        competition_emblem: m.competitionEmblem ?? null,
        utc_date: new Date(m.utcDate).toISOString(),
        status: m.status,
        matchday: m.matchday,
        home_team_name: m.homeTeamName,
        home_team_short: m.homeTeamShort ?? null,
        home_team_crest: m.homeTeamCrest ?? null,
        away_team_name: m.awayTeamName,
        away_team_short: m.awayTeamShort ?? null,
        away_team_crest: m.awayTeamCrest ?? null,
        home_score: existing?.home_score ?? m.homeScore ?? null,
        away_score: existing?.away_score ?? m.awayScore ?? null,
        home_corners: existing?.home_corners ?? m.homeCorners ?? null,
        away_corners: existing?.away_corners ?? m.awayCorners ?? null,
        winner: existing?.winner ?? m.winner ?? null,
        is_graded: existing?.is_graded ?? 0,
        data_source: existing?.data_source ?? m.dataSource,
        updated_at: nowIso,
      };
    });

    if (elUpserts.length > 0) {
      const { error } = await client.from('matches').upsert(elUpserts, { onConflict: 'id' });
      assertSupabaseOk(error, 'Seed Europa League fixtures');
    }
  }

  // 3. Enrich any matches missing crests, short names, or competition emblems in batch
  const toUpdate: any[] = [];
  for (const m of allMatches) {
    if (
      !m.home_team_crest ||
      !m.away_team_crest ||
      !m.home_team_short ||
      !m.away_team_short ||
      !m.competition_emblem
    ) {
      const homeInfo = resolveTeamInfo(m.home_team_name, m.competition_id);
      const awayInfo = resolveTeamInfo(m.away_team_name, m.competition_id);
      toUpdate.push({
        ...m,
        home_team_crest: m.home_team_crest || homeInfo.crest,
        home_team_short: m.home_team_short || homeInfo.shortName,
        away_team_crest: m.away_team_crest || awayInfo.crest,
        away_team_short: m.away_team_short || awayInfo.shortName,
        competition_emblem:
          m.competition_emblem || COMPETITION_EMBLEMS[m.competition_id] || COMPETITION_EMBLEMS.PL,
        updated_at: nowIso,
      });
    }
  }

  for (let i = 0; i < toUpdate.length; i += 400) {
    const chunk = toUpdate.slice(i, i + 400);
    const { error } = await client.from('matches').upsert(chunk, { onConflict: 'id' });
    assertSupabaseOk(error, 'Batch enrich match crests in Supabase');
  }

  console.log(
    `[Supabase Enrichment] Enriched ${toUpdate.length} matches with official club crests & emblems.`
  );
  return { updatedCount: toUpdate.length, cleanedTestCount: 0 };
}
