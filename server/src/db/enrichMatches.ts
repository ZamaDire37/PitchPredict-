import { queryAll, run } from './database.js';
import { resolveTeamInfo, COMPETITION_EMBLEMS } from '../services/teamCrestRegistry.js';
import { FootballApiService } from '../services/footballApi.js';

export function enrichAllMatchesInDatabase(): { updatedCount: number; cleanedTestCount: number } {
  // 1. Delete dummy test matches inserted by unit tests (e.g. Team 1A, Team 2A, Test Team A)
  const deleteResult = run(`
    DELETE FROM matches 
    WHERE home_team_name LIKE 'Team %'
       OR home_team_name LIKE 'Test Team%'
       OR home_team_name = 'Live Home'
       OR away_team_name LIKE 'Team %'
       OR away_team_name LIKE 'Test Team%'
  `);

  // 1b. Permanently purge all legacy synthetic template fixtures
  run(`
    DELETE FROM matches 
    WHERE external_id >= 501000 
      AND external_id < 600000
  `);

  // 1c. Set authentic data_source for any legacy matches where data_source was NULL
  run(`
    UPDATE matches
    SET data_source = 'OpenLigaDB Live REST API'
    WHERE data_source IS NULL AND external_id >= 900000 AND external_id < 1000000
  `);

  const cleanedTestCount = deleteResult.changes;

  // 2. Ensure marquee upcoming fixtures and authentic schedules are seeded and stale in-play resolved
  try {
    FootballApiService.seedRealFixtures(true);
  } catch (err) {
    console.warn('Marquee fixtures seed warning:', err);
  }

  // 3. Fetch all matches needing crest, short name, or emblem enrichment
  const matchesToEnrich = queryAll<{
    id: number;
    competition_id: string;
    competition_name: string;
    competition_emblem: string | null;
    home_team_name: string;
    home_team_short: string | null;
    home_team_crest: string | null;
    away_team_name: string;
    away_team_short: string | null;
    away_team_crest: string | null;
  }>(`
    SELECT id, competition_id, competition_name, competition_emblem,
           home_team_name, home_team_short, home_team_crest,
           away_team_name, away_team_short, away_team_crest
    FROM matches
    WHERE home_team_crest IS NULL 
       OR away_team_crest IS NULL 
       OR home_team_short IS NULL 
       OR away_team_short IS NULL
       OR competition_emblem IS NULL
  `);

  let updatedCount = 0;

  for (const m of matchesToEnrich) {
    const homeInfo = resolveTeamInfo(m.home_team_name, m.competition_id);
    const awayInfo = resolveTeamInfo(m.away_team_name, m.competition_id);

    const homeCrest = m.home_team_crest || homeInfo.crest;
    const homeShort = m.home_team_short || homeInfo.shortName;

    const awayCrest = m.away_team_crest || awayInfo.crest;
    const awayShort = m.away_team_short || awayInfo.shortName;

    const compEmblem = m.competition_emblem || COMPETITION_EMBLEMS[m.competition_id] || COMPETITION_EMBLEMS.PL;

    run(`
      UPDATE matches
      SET home_team_crest = ?,
          home_team_short = ?,
          away_team_crest = ?,
          away_team_short = ?,
          competition_emblem = ?
      WHERE id = ?
    `, [homeCrest, homeShort, awayCrest, awayShort, compEmblem, m.id]);

    updatedCount++;
  }

  console.log(`[Database Enrichment] Cleaned ${cleanedTestCount} test matches; Enriched ${updatedCount} matches with official club crests & emblems.`);
  return { updatedCount, cleanedTestCount };
}
