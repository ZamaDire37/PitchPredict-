/**
 * Official 50-League Priority Ranking & Stable Competition ID Architecture for PitchPredict (Client).
 *
 * Fixed Priority Order:
 * #1  Premier League (PL)
 * #2  La Liga (PD)
 * #3  Serie A (SA)
 * #4  Bundesliga (BL1)
 * #5  Ligue 1 (FL1)
 * #6  Primeira Liga (PPL) - Portugal
 * #7  Belgian Pro League (BEL) - Belgium (shown only when usable fixtures/results exist)
 * #8  Eredivisie (DED) - Netherlands
 * #9  UEFA Champions League (CL)
 * #10 UEFA Europa League (EL)
 * ... (up to 50 leagues + unranked placed last at rank 999)
 */

export interface LeagueRankEntry {
  rank: number;
  id: string; // Stable competition ID
  name: string;
  country: string;
  emblem: string;
  aliases: string[];
}

export const LEAGUE_RANKING_LIST: LeagueRankEntry[] = [
  // Top 8 Priority Fixed
  {
    rank: 1,
    id: 'PL',
    name: 'Premier League',
    country: 'England',
    emblem: 'https://crests.football-data.org/PL.png',
    aliases: ['4328', 'en.1', 'English Premier League', 'Barclays Premier League', 'Premier League', 'EPL'],
  },
  {
    rank: 2,
    id: 'PD',
    name: 'La Liga',
    country: 'Spain',
    emblem: 'https://crests.football-data.org/PD.png',
    aliases: ['4335', 'es.1', 'Primera Division', 'LaLiga', 'LaLiga EA Sports', 'Spanish La Liga', 'La Liga'],
  },
  {
    rank: 3,
    id: 'SA',
    name: 'Serie A',
    country: 'Italy',
    emblem: 'https://crests.football-data.org/SA.png',
    aliases: ['4332', 'it.1', 'Serie A TIM', 'Italian Serie A', 'Serie A'],
  },
  {
    rank: 4,
    id: 'BL1',
    name: 'Bundesliga',
    country: 'Germany',
    emblem: 'https://crests.football-data.org/BL1.png',
    aliases: ['bl1', 'de.1', 'German Bundesliga', '1. Bundesliga', 'Bundesliga'],
  },
  {
    rank: 5,
    id: 'FL1',
    name: 'Ligue 1',
    country: 'France',
    emblem: 'https://crests.football-data.org/FL1.png',
    aliases: ['4334', 'fr.1', "Ligue 1 McDonald's", 'Ligue 1 Uber Eats', 'French Ligue 1', 'Ligue 1'],
  },
  {
    rank: 6,
    id: 'PPL',
    name: 'Primeira Liga',
    country: 'Portugal',
    emblem: 'https://crests.football-data.org/PPL.png',
    aliases: ['4344', 'pt.1', 'Liga Portugal', 'Liga Portugal Betclic', 'Portuguese Liga', 'Primeira Liga', 'Liga NOS'],
  },
  {
    rank: 7,
    id: 'BEL',
    name: 'Belgian Pro League',
    country: 'Belgium',
    emblem: 'https://crests.football-data.org/BEL.png',
    aliases: ['4338', 'be.1', 'BJL', 'Jupiler Pro League', 'Belgian Pro League', 'Belgian First Division A'],
  },
  {
    rank: 8,
    id: 'DED',
    name: 'Eredivisie',
    country: 'Netherlands',
    emblem: 'https://crests.football-data.org/DED.png',
    aliases: ['4337', 'nl.1', 'Dutch Eredivisie', 'Eredivisie'],
  },

  // 9 - 15 European Tournaments & Secondary Major Leagues
  {
    rank: 9,
    id: 'CL',
    name: 'UEFA Champions League',
    country: 'Europe',
    emblem: 'https://crests.football-data.org/CL.png',
    aliases: ['4480', 'Champions League', 'UEFA Champions League'],
  },
  {
    rank: 10,
    id: 'EL',
    name: 'UEFA Europa League',
    country: 'Europe',
    emblem: 'https://crests.football-data.org/EL.png',
    aliases: ['4481', 'Europa League', 'UEFA Europa League'],
  },
  {
    rank: 11,
    id: 'ECL',
    name: 'UEFA Conference League',
    country: 'Europe',
    emblem: 'https://crests.football-data.org/ECL.png',
    aliases: ['Conference League', 'Europa Conference League', 'UEFA Europa Conference League'],
  },
  {
    rank: 12,
    id: 'ELC',
    name: 'Championship',
    country: 'England',
    emblem: 'https://crests.football-data.org/ELC.png',
    aliases: ['4329', 'English League Championship', 'EFL Championship'],
  },
  {
    rank: 13,
    id: 'BL2',
    name: '2. Bundesliga',
    country: 'Germany',
    emblem: 'https://crests.football-data.org/BL1.png',
    aliases: ['bl2', '2. Bundesliga'],
  },
  {
    rank: 14,
    id: 'BSA',
    name: 'Brasileirão Série A',
    country: 'Brazil',
    emblem: 'https://crests.football-data.org/BSA.png',
    aliases: ['4351', 'Brasileirão', 'Serie A Brazil', 'Campeonato Brasileiro'],
  },
  {
    rank: 15,
    id: 'ARG',
    name: 'Primera División',
    country: 'Argentina',
    emblem: 'https://crests.football-data.org/ARG.png',
    aliases: ['4350', 'Liga Profesional Argentina', 'Argentine Primera Division'],
  },

  // 16 - 25 Top European Domestic Leagues
  {
    rank: 16,
    id: 'TSL',
    name: 'Süper Lig',
    country: 'Turkey',
    emblem: 'https://crests.football-data.org/TR.png',
    aliases: ['4339', 'Turkish Super Lig', 'Trendyol Süper Lig', 'Super Lig'],
  },
  {
    rank: 17,
    id: 'SCO',
    name: 'Scottish Premiership',
    country: 'Scotland',
    emblem: 'https://crests.football-data.org/SCO.png',
    aliases: ['4330', 'Scottish Premier League', 'Premiership Scotland'],
  },
  {
    rank: 18,
    id: 'SUI',
    name: 'Swiss Super League',
    country: 'Switzerland',
    emblem: 'https://crests.football-data.org/SUI.png',
    aliases: ['4346', 'Credit Suisse Super League', 'Super League Switzerland'],
  },
  {
    rank: 19,
    id: 'AUT',
    name: 'Austrian Bundesliga',
    country: 'Austria',
    emblem: 'https://crests.football-data.org/AUT.png',
    aliases: ['4347', 'Admiral Bundesliga', 'Austrian Bundesliga'],
  },
  {
    rank: 20,
    id: 'GRE',
    name: 'Super League Greece',
    country: 'Greece',
    emblem: 'https://crests.football-data.org/GRE.png',
    aliases: ['4348', 'Stoiximan Super League', 'Super League Greece'],
  },
  {
    rank: 21,
    id: 'DEN',
    name: 'Danish Superliga',
    country: 'Denmark',
    emblem: 'https://crests.football-data.org/DEN.png',
    aliases: ['4340', '3F Superliga', 'Danish Superliga'],
  },
  {
    rank: 22,
    id: 'CZE',
    name: 'Czech First League',
    country: 'Czech Republic',
    emblem: 'https://crests.football-data.org/CZE.png',
    aliases: ['4345', 'Chance Liga', 'Czech First League'],
  },
  {
    rank: 23,
    id: 'CRO',
    name: 'Croatian Football League',
    country: 'Croatia',
    emblem: 'https://crests.football-data.org/CRO.png',
    aliases: ['4355', 'SuperSport HNL', 'HNL'],
  },
  {
    rank: 24,
    id: 'POL',
    name: 'Ekstraklasa',
    country: 'Poland',
    emblem: 'https://crests.football-data.org/POL.png',
    aliases: ['4352', 'PKO BP Ekstraklasa', 'Polish Ekstraklasa'],
  },
  {
    rank: 25,
    id: 'NOR',
    name: 'Eliteserien',
    country: 'Norway',
    emblem: 'https://crests.football-data.org/NOR.png',
    aliases: ['4342', 'Eliteserien Norway'],
  },

  // 26 - 35
  {
    rank: 26,
    id: 'SWE',
    name: 'Allsvenskan',
    country: 'Sweden',
    emblem: 'https://crests.football-data.org/SWE.png',
    aliases: ['4343', 'Allsvenskan Sweden'],
  },
  {
    rank: 27,
    id: 'RUS',
    name: 'Russian Premier League',
    country: 'Russia',
    emblem: 'https://crests.football-data.org/RUS.png',
    aliases: ['4353', 'Russian Premier Liga'],
  },
  {
    rank: 28,
    id: 'UKR',
    name: 'Ukrainian Premier League',
    country: 'Ukraine',
    emblem: 'https://crests.football-data.org/UKR.png',
    aliases: ['4354', 'VBET Liha'],
  },
  {
    rank: 29,
    id: 'ISR',
    name: 'Israeli Premier League',
    country: 'Israel',
    emblem: 'https://crests.football-data.org/ISR.png',
    aliases: ['4356', 'Ligat HaAl'],
  },
  {
    rank: 30,
    id: 'CYP',
    name: 'Cypriot First Division',
    country: 'Cyprus',
    emblem: 'https://crests.football-data.org/CYP.png',
    aliases: ['4357', 'Cyta Championship'],
  },
  {
    rank: 31,
    id: 'SRB',
    name: 'Serbian SuperLiga',
    country: 'Serbia',
    emblem: 'https://crests.football-data.org/SRB.png',
    aliases: ['4358', 'Mozzart Bet SuperLiga'],
  },
  {
    rank: 32,
    id: 'ROU',
    name: 'SuperLiga Romania',
    country: 'Romania',
    emblem: 'https://crests.football-data.org/ROU.png',
    aliases: ['4359', 'SuperLiga Românească'],
  },
  {
    rank: 33,
    id: 'BUL',
    name: 'First Professional League',
    country: 'Bulgaria',
    emblem: 'https://crests.football-data.org/BUL.png',
    aliases: ['4360', 'efbet Liga'],
  },
  {
    rank: 34,
    id: 'SVK',
    name: 'Slovak Super Liga',
    country: 'Slovakia',
    emblem: 'https://crests.football-data.org/SVK.png',
    aliases: ['4361', 'Niké liga'],
  },
  {
    rank: 35,
    id: 'HUN',
    name: 'Nemzeti Bajnokság I',
    country: 'Hungary',
    emblem: 'https://crests.football-data.org/HUN.png',
    aliases: ['4362', 'OTP Bank Liga'],
  },

  // 36 - 45
  {
    rank: 36,
    id: 'AZE',
    name: 'Azerbaijan Premier League',
    country: 'Azerbaijan',
    emblem: 'https://crests.football-data.org/AZE.png',
    aliases: ['4363', 'Misli Premyer Liqası'],
  },
  {
    rank: 37,
    id: 'KAZ',
    name: 'Kazakhstan Premier League',
    country: 'Kazakhstan',
    emblem: 'https://crests.football-data.org/KAZ.png',
    aliases: ['4364', 'OLIMPBET Premier League'],
  },
  {
    rank: 38,
    id: 'SVN',
    name: 'Slovenian PrvaLiga',
    country: 'Slovenia',
    emblem: 'https://crests.football-data.org/SVN.png',
    aliases: ['4365', 'Prva liga Telemach'],
  },
  {
    rank: 39,
    id: 'MDA',
    name: 'Moldovan Super Liga',
    country: 'Moldova',
    emblem: 'https://crests.football-data.org/MDA.png',
    aliases: ['4366', 'Super Liga Moldova'],
  },
  {
    rank: 40,
    id: 'KOS',
    name: 'Superleague of Kosovo',
    country: 'Kosovo',
    emblem: 'https://crests.football-data.org/KOS.png',
    aliases: ['4367', 'AlbiMall Superliga'],
  },
  {
    rank: 41,
    id: 'LVA',
    name: 'Latvian Higher League',
    country: 'Latvia',
    emblem: 'https://crests.football-data.org/LVA.png',
    aliases: ['4368', 'Tonybet Virslīga'],
  },
  {
    rank: 42,
    id: 'IRL',
    name: 'League of Ireland',
    country: 'Ireland',
    emblem: 'https://crests.football-data.org/IRL.png',
    aliases: ['4369', 'SSE Airtricity League'],
  },
  {
    rank: 43,
    id: 'FIN',
    name: 'Veikkausliiga',
    country: 'Finland',
    emblem: 'https://crests.football-data.org/FIN.png',
    aliases: ['4370', 'Veikkausliiga Finland'],
  },
  {
    rank: 44,
    id: 'LTU',
    name: 'A Lyga',
    country: 'Lithuania',
    emblem: 'https://crests.football-data.org/LTU.png',
    aliases: ['4371', 'TOPsport A lyga'],
  },
  {
    rank: 45,
    id: 'ARM',
    name: 'Armenian Premier League',
    country: 'Armenia',
    emblem: 'https://crests.football-data.org/ARM.png',
    aliases: ['4372', 'IDBank Premier League'],
  },

  // 46 - 50
  {
    rank: 46,
    id: 'BLR',
    name: 'Belarusian Premier League',
    country: 'Belarus',
    emblem: 'https://crests.football-data.org/BLR.png',
    aliases: ['4373'],
  },
  {
    rank: 47,
    id: 'BIH',
    name: 'Premier League of Bosnia',
    country: 'Bosnia',
    emblem: 'https://crests.football-data.org/BIH.png',
    aliases: ['4374', 'WWin Liga BiH'],
  },
  {
    rank: 48,
    id: 'LUX',
    name: 'Luxembourg National Division',
    country: 'Luxembourg',
    emblem: 'https://crests.football-data.org/LUX.png',
    aliases: ['4375', 'BGL Ligue'],
  },
  {
    rank: 49,
    id: 'FRO',
    name: 'Faroe Islands Premier League',
    country: 'Faroe Islands',
    emblem: 'https://crests.football-data.org/FRO.png',
    aliases: ['4376', 'Betri deildin menn'],
  },
  {
    rank: 50,
    id: 'NIR',
    name: 'NIFL Premiership',
    country: 'Northern Ireland',
    emblem: 'https://crests.football-data.org/NIR.png',
    aliases: ['4377', 'Sports Direct Premiership'],
  },

  // Cups & International Tournaments
  {
    rank: 51,
    id: 'DFB',
    name: 'DFB-Pokal',
    country: 'Germany',
    emblem: 'https://crests.football-data.org/DFB.png',
    aliases: ['dfb', 'DFB Pokal'],
  },
  {
    rank: 52,
    id: 'WC',
    name: 'FIFA World Cup',
    country: 'International',
    emblem: 'https://crests.football-data.org/qatar.png',
    aliases: ['World Cup', 'FIFA World Cup'],
  },
  {
    rank: 53,
    id: 'EC',
    name: 'UEFA European Championship (Euro)',
    country: 'International',
    emblem: 'https://crests.football-data.org/EC.png',
    aliases: ['Euro', 'UEFA Euro'],
  },
];

const ALIAS_LOOKUP = new Map<string, LeagueRankEntry>();
const ID_LOOKUP = new Map<string, LeagueRankEntry>();

for (const entry of LEAGUE_RANKING_LIST) {
  ID_LOOKUP.set(entry.id.toUpperCase(), entry);
  ALIAS_LOOKUP.set(entry.id.toUpperCase(), entry);
  ALIAS_LOOKUP.set(entry.name.toLowerCase(), entry);
  for (const alias of entry.aliases) {
    ALIAS_LOOKUP.set(alias.toLowerCase(), entry);
  }
}

export function getLeagueRank(idOrName?: string | null): number {
  if (!idOrName) return 999;
  const clean = idOrName.trim();
  const byId = ID_LOOKUP.get(clean.toUpperCase());
  if (byId) return byId.rank;

  const byAlias = ALIAS_LOOKUP.get(clean.toLowerCase());
  if (byAlias) return byAlias.rank;

  return 999;
}

export function normalizeCompetition(
  compId?: string | null,
  compName?: string | null,
  fallbackEmblem?: string | null
): { id: string; name: string; rank: number; emblem: string } {
  const code = (compId || '').trim();
  const name = (compName || '').trim();

  let entry: LeagueRankEntry | undefined;

  if (code) {
    entry = ID_LOOKUP.get(code.toUpperCase()) || ALIAS_LOOKUP.get(code.toLowerCase());
  }

  if (!entry && name) {
    entry = ALIAS_LOOKUP.get(name.toLowerCase());
    if (!entry) {
      const lowerName = name.toLowerCase();
      for (const [key, val] of ALIAS_LOOKUP.entries()) {
        if (key.length >= 4 && (lowerName.includes(key) || key.includes(lowerName))) {
          entry = val;
          break;
        }
      }
    }
  }

  if (entry) {
    return {
      id: entry.id,
      name: entry.name,
      rank: entry.rank,
      emblem: entry.emblem,
    };
  }

  return {
    id: code.toUpperCase() || 'OTHER',
    name: name || code || 'Other Competitions',
    rank: 999,
    emblem: fallbackEmblem || 'https://crests.football-data.org/PL.png',
  };
}
