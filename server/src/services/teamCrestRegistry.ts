/**
 * Official Team Crest and Emblem Registry for European Football and International Tournaments.
 * Provides guaranteed authentic high-resolution badges and clean short names for all clubs.
 */

export interface TeamInfo {
  crest: string;
  shortName: string;
}

export const TEAM_REGISTRY: Record<string, TeamInfo> = {
  // ===================== PREMIER LEAGUE =====================
  'Arsenal FC': { crest: 'https://crests.football-data.org/57.png', shortName: 'Arsenal' },
  'Arsenal': { crest: 'https://crests.football-data.org/57.png', shortName: 'Arsenal' },
  'Aston Villa FC': { crest: 'https://crests.football-data.org/58.png', shortName: 'Aston Villa' },
  'Aston Villa': { crest: 'https://crests.football-data.org/58.png', shortName: 'Aston Villa' },
  'AFC Bournemouth': { crest: 'https://crests.football-data.org/1044.png', shortName: 'Bournemouth' },
  'Bournemouth': { crest: 'https://crests.football-data.org/1044.png', shortName: 'Bournemouth' },
  'Brentford FC': { crest: 'https://crests.football-data.org/402.png', shortName: 'Brentford' },
  'Brentford': { crest: 'https://crests.football-data.org/402.png', shortName: 'Brentford' },
  'Brighton & Hove Albion FC': { crest: 'https://crests.football-data.org/397.png', shortName: 'Brighton' },
  'Brighton': { crest: 'https://crests.football-data.org/397.png', shortName: 'Brighton' },
  'Chelsea FC': { crest: 'https://crests.football-data.org/61.png', shortName: 'Chelsea' },
  'Chelsea': { crest: 'https://crests.football-data.org/61.png', shortName: 'Chelsea' },
  'Crystal Palace FC': { crest: 'https://crests.football-data.org/354.png', shortName: 'Crystal Palace' },
  'Crystal Palace': { crest: 'https://crests.football-data.org/354.png', shortName: 'Crystal Palace' },
  'Everton FC': { crest: 'https://crests.football-data.org/62.png', shortName: 'Everton' },
  'Everton': { crest: 'https://crests.football-data.org/62.png', shortName: 'Everton' },
  'Fulham FC': { crest: 'https://crests.football-data.org/63.png', shortName: 'Fulham' },
  'Fulham': { crest: 'https://crests.football-data.org/63.png', shortName: 'Fulham' },
  'Ipswich Town FC': { crest: 'https://crests.football-data.org/349.png', shortName: 'Ipswich' },
  'Ipswich Town': { crest: 'https://crests.football-data.org/349.png', shortName: 'Ipswich' },
  'Leicester City FC': { crest: 'https://crests.football-data.org/338.png', shortName: 'Leicester' },
  'Leicester City': { crest: 'https://crests.football-data.org/338.png', shortName: 'Leicester' },
  'Liverpool FC': { crest: 'https://crests.football-data.org/64.png', shortName: 'Liverpool' },
  'Liverpool': { crest: 'https://crests.football-data.org/64.png', shortName: 'Liverpool' },
  'Manchester City FC': { crest: 'https://crests.football-data.org/65.png', shortName: 'Man City' },
  'Manchester City': { crest: 'https://crests.football-data.org/65.png', shortName: 'Man City' },
  'Manchester United FC': { crest: 'https://crests.football-data.org/66.png', shortName: 'Man United' },
  'Manchester United': { crest: 'https://crests.football-data.org/66.png', shortName: 'Man United' },
  'Newcastle United FC': { crest: 'https://crests.football-data.org/67.png', shortName: 'Newcastle' },
  'Newcastle United': { crest: 'https://crests.football-data.org/67.png', shortName: 'Newcastle' },
  'Nottingham Forest FC': { crest: 'https://crests.football-data.org/351.png', shortName: 'Nottm Forest' },
  'Nottingham Forest': { crest: 'https://crests.football-data.org/351.png', shortName: 'Nottm Forest' },
  'Southampton FC': { crest: 'https://crests.football-data.org/340.png', shortName: 'Southampton' },
  'Southampton': { crest: 'https://crests.football-data.org/340.png', shortName: 'Southampton' },
  'Tottenham Hotspur FC': { crest: 'https://crests.football-data.org/73.png', shortName: 'Tottenham' },
  'Tottenham Hotspur': { crest: 'https://crests.football-data.org/73.png', shortName: 'Tottenham' },
  'West Ham United FC': { crest: 'https://crests.football-data.org/563.png', shortName: 'West Ham' },
  'West Ham United': { crest: 'https://crests.football-data.org/563.png', shortName: 'West Ham' },
  'Wolverhampton Wanderers FC': { crest: 'https://crests.football-data.org/76.png', shortName: 'Wolves' },
  'Wolverhampton Wanderers': { crest: 'https://crests.football-data.org/76.png', shortName: 'Wolves' },

  // ===================== LA LIGA =====================
  'Athletic Club': { crest: 'https://crests.football-data.org/77.png', shortName: 'Athletic Club' },
  'Club Atlético de Madrid': { crest: 'https://crests.football-data.org/78.png', shortName: 'Atlético Madrid' },
  'Atlético de Madrid': { crest: 'https://crests.football-data.org/78.png', shortName: 'Atlético Madrid' },
  'CA Osasuna': { crest: 'https://crests.football-data.org/79.png', shortName: 'Osasuna' },
  'CD Leganés': { crest: 'https://crests.football-data.org/745.png', shortName: 'Leganés' },
  'Deportivo Alavés': { crest: 'https://crests.football-data.org/263.png', shortName: 'Alavés' },
  'FC Barcelona': { crest: 'https://crests.football-data.org/81.png', shortName: 'Barcelona' },
  'Barcelona': { crest: 'https://crests.football-data.org/81.png', shortName: 'Barcelona' },
  'Getafe CF': { crest: 'https://crests.football-data.org/82.png', shortName: 'Getafe' },
  'Girona FC': { crest: 'https://crests.football-data.org/298.png', shortName: 'Girona' },
  'RC Celta de Vigo': { crest: 'https://crests.football-data.org/558.png', shortName: 'Celta Vigo' },
  'RCD Espanyol de Barcelona': { crest: 'https://crests.football-data.org/80.png', shortName: 'Espanyol' },
  'RCD Mallorca': { crest: 'https://crests.football-data.org/89.png', shortName: 'Mallorca' },
  'Rayo Vallecano de Madrid': { crest: 'https://crests.football-data.org/87.png', shortName: 'Rayo Vallecano' },
  'Real Betis Balompié': { crest: 'https://crests.football-data.org/90.png', shortName: 'Real Betis' },
  'Real Betis': { crest: 'https://crests.football-data.org/90.png', shortName: 'Real Betis' },
  'Real Madrid CF': { crest: 'https://crests.football-data.org/86.png', shortName: 'Real Madrid' },
  'Real Madrid': { crest: 'https://crests.football-data.org/86.png', shortName: 'Real Madrid' },
  'Real Sociedad de Fútbol': { crest: 'https://crests.football-data.org/92.png', shortName: 'Real Sociedad' },
  'Real Sociedad': { crest: 'https://crests.football-data.org/92.png', shortName: 'Real Sociedad' },
  'Real Valladolid CF': { crest: 'https://crests.football-data.org/250.png', shortName: 'Valladolid' },
  'Sevilla FC': { crest: 'https://crests.football-data.org/559.png', shortName: 'Sevilla' },
  'Sevilla': { crest: 'https://crests.football-data.org/559.png', shortName: 'Sevilla' },
  'UD Las Palmas': { crest: 'https://crests.football-data.org/275.png', shortName: 'Las Palmas' },
  'Valencia CF': { crest: 'https://crests.football-data.org/95.png', shortName: 'Valencia' },
  'Villarreal CF': { crest: 'https://crests.football-data.org/94.png', shortName: 'Villarreal' },
  'Villarreal': { crest: 'https://crests.football-data.org/94.png', shortName: 'Villarreal' },

  // ===================== BUNDESLIGA =====================
  '1. FC Heidenheim 1846': { crest: 'https://crests.football-data.org/44.png', shortName: 'Heidenheim' },
  '1. FC Union Berlin': { crest: 'https://crests.football-data.org/28.png', shortName: 'Union Berlin' },
  '1. FSV Mainz 05': { crest: 'https://crests.football-data.org/15.png', shortName: 'Mainz 05' },
  'Bayer 04 Leverkusen': { crest: 'https://crests.football-data.org/3.png', shortName: 'Leverkusen' },
  'Borussia Dortmund': { crest: 'https://crests.football-data.org/4.png', shortName: 'Dortmund' },
  'Borussia Mönchengladbach': { crest: 'https://crests.football-data.org/18.png', shortName: 'Mönchengladbach' },
  'Eintracht Frankfurt': { crest: 'https://crests.football-data.org/19.png', shortName: 'Frankfurt' },
  'FC Augsburg': { crest: 'https://crests.football-data.org/16.png', shortName: 'Augsburg' },
  'FC Bayern München': { crest: 'https://crests.football-data.org/5.png', shortName: 'Bayern Munich' },
  'FC St. Pauli 1910': { crest: 'https://crests.football-data.org/29.png', shortName: 'St. Pauli' },
  'FC St. Pauli': { crest: 'https://crests.football-data.org/29.png', shortName: 'St. Pauli' },
  'Holstein Kiel': { crest: 'https://crests.football-data.org/720.png', shortName: 'Holstein Kiel' },
  'RB Leipzig': { crest: 'https://crests.football-data.org/721.png', shortName: 'RB Leipzig' },
  'SC Freiburg': { crest: 'https://crests.football-data.org/17.png', shortName: 'Freiburg' },
  'Freiburg': { crest: 'https://crests.football-data.org/17.png', shortName: 'Freiburg' },
  'SV Werder Bremen': { crest: 'https://crests.football-data.org/12.png', shortName: 'Werder Bremen' },
  'Werder Bremen': { crest: 'https://crests.football-data.org/12.png', shortName: 'Werder Bremen' },
  'TSG 1899 Hoffenheim': { crest: 'https://crests.football-data.org/2.png', shortName: 'Hoffenheim' },
  'TSG Hoffenheim': { crest: 'https://crests.football-data.org/2.png', shortName: 'Hoffenheim' },
  'VfB Stuttgart': { crest: 'https://crests.football-data.org/10.png', shortName: 'Stuttgart' },
  'VfL Bochum 1848': { crest: 'https://crests.football-data.org/36.png', shortName: 'Bochum' },
  'VfL Bochum': { crest: 'https://crests.football-data.org/36.png', shortName: 'Bochum' },
  'VfL Wolfsburg': { crest: 'https://crests.football-data.org/11.png', shortName: 'Wolfsburg' },
  '1. FC Köln': { crest: 'https://crests.football-data.org/1.png', shortName: 'FC Köln' },
  '1. FC Kaiserslautern': { crest: 'https://crests.football-data.org/32.png', shortName: 'Kaiserslautern' },
  'FC Schalke 04': { crest: 'https://crests.football-data.org/6.png', shortName: 'Schalke 04' },
  'Hamburger SV': { crest: 'https://crests.football-data.org/7.png', shortName: 'Hamburger SV' },
  'Hannover 96': { crest: 'https://crests.football-data.org/8.png', shortName: 'Hannover 96' },
  'Hertha BSC': { crest: 'https://crests.football-data.org/9.png', shortName: 'Hertha BSC' },
  'Fortuna Düsseldorf': { crest: 'https://crests.football-data.org/24.png', shortName: 'Düsseldorf' },
  'Karlsruher SC': { crest: 'https://crests.football-data.org/30.png', shortName: 'Karlsruhe' },
  'SC Paderborn 07': { crest: 'https://crests.football-data.org/35.png', shortName: 'Paderborn' },
  'SV Darmstadt 98': { crest: 'https://crests.football-data.org/20.png', shortName: 'Darmstadt' },
  'SV 07 Elversberg': { crest: 'https://crests.football-data.org/717.png', shortName: 'Elversberg' },
  'Elversberg': { crest: 'https://crests.football-data.org/717.png', shortName: 'Elversberg' },

  // ===================== SERIE A =====================
  'AC Milan': { crest: 'https://crests.football-data.org/98.png', shortName: 'AC Milan' },
  'AC Monza': { crest: 'https://crests.football-data.org/5911.png', shortName: 'Monza' },
  'ACF Fiorentina': { crest: 'https://crests.football-data.org/99.png', shortName: 'Fiorentina' },
  'Fiorentina': { crest: 'https://crests.football-data.org/99.png', shortName: 'Fiorentina' },
  'AS Roma': { crest: 'https://crests.football-data.org/100.png', shortName: 'Roma' },
  'Atalanta BC': { crest: 'https://crests.football-data.org/102.png', shortName: 'Atalanta' },
  'Bologna FC 1909': { crest: 'https://crests.football-data.org/103.png', shortName: 'Bologna' },
  'Bologna': { crest: 'https://crests.football-data.org/103.png', shortName: 'Bologna' },
  'Cagliari Calcio': { crest: 'https://crests.football-data.org/104.png', shortName: 'Cagliari' },
  'Como 1907': { crest: 'https://crests.football-data.org/1118.png', shortName: 'Como' },
  'Empoli FC': { crest: 'https://crests.football-data.org/445.png', shortName: 'Empoli' },
  'FC Internazionale Milano': { crest: 'https://crests.football-data.org/108.png', shortName: 'Inter' },
  'Inter Milan': { crest: 'https://crests.football-data.org/108.png', shortName: 'Inter' },
  'Genoa CFC': { crest: 'https://crests.football-data.org/107.png', shortName: 'Genoa' },
  'Hellas Verona FC': { crest: 'https://crests.football-data.org/450.png', shortName: 'Verona' },
  'Juventus FC': { crest: 'https://crests.football-data.org/109.png', shortName: 'Juventus' },
  'Parma Calcio 1913': { crest: 'https://crests.football-data.org/112.png', shortName: 'Parma' },
  'SS Lazio': { crest: 'https://crests.football-data.org/110.png', shortName: 'Lazio' },
  'SSC Napoli': { crest: 'https://crests.football-data.org/113.png', shortName: 'Napoli' },
  'Torino FC': { crest: 'https://crests.football-data.org/586.png', shortName: 'Torino' },
  'US Lecce': { crest: 'https://crests.football-data.org/5890.png', shortName: 'Lecce' },
  'Udinese Calcio': { crest: 'https://crests.football-data.org/115.png', shortName: 'Udinese' },
  'Venezia FC': { crest: 'https://crests.football-data.org/454.png', shortName: 'Venezia' },

  // ===================== LIGUE 1 =====================
  'AJ Auxerre': { crest: 'https://crests.football-data.org/519.png', shortName: 'Auxerre' },
  'Angers SCO': { crest: 'https://crests.football-data.org/532.png', shortName: 'Angers' },
  'AS Monaco FC': { crest: 'https://crests.football-data.org/548.png', shortName: 'Monaco' },
  'AS Saint-Étienne': { crest: 'https://crests.football-data.org/527.png', shortName: 'Saint-Étienne' },
  'FC Nantes': { crest: 'https://crests.football-data.org/543.png', shortName: 'Nantes' },
  'Le Havre AC': { crest: 'https://crests.football-data.org/538.png', shortName: 'Le Havre' },
  'Lille OSC': { crest: 'https://crests.football-data.org/521.png', shortName: 'Lille' },
  'Montpellier HSC': { crest: 'https://crests.football-data.org/518.png', shortName: 'Montpellier' },
  'OGC Nice': { crest: 'https://crests.football-data.org/522.png', shortName: 'Nice' },
  'Olympique Lyonnais': { crest: 'https://crests.football-data.org/523.png', shortName: 'Lyon' },
  'Olympique de Marseille': { crest: 'https://crests.football-data.org/516.png', shortName: 'Marseille' },
  'Paris Saint-Germain FC': { crest: 'https://crests.football-data.org/524.png', shortName: 'PSG' },
  'PSG': { crest: 'https://crests.football-data.org/524.png', shortName: 'PSG' },
  'RC Strasbourg Alsace': { crest: 'https://crests.football-data.org/576.png', shortName: 'Strasbourg' },
  'Racing Club de Lens': { crest: 'https://crests.football-data.org/546.png', shortName: 'Lens' },
  'Stade Brestois 29': { crest: 'https://crests.football-data.org/512.png', shortName: 'Brest' },
  'Stade Rennais FC 1901': { crest: 'https://crests.football-data.org/529.png', shortName: 'Rennes' },
  'Stade de Reims': { crest: 'https://crests.football-data.org/547.png', shortName: 'Reims' },
  'Toulouse FC': { crest: 'https://crests.football-data.org/511.png', shortName: 'Toulouse' },

  // ===================== OTHER EUROPEAN CLUBS =====================
  'Shakhtar Donetsk': { crest: 'https://crests.football-data.org/654.png', shortName: 'Shakhtar' },
  'Club Brugge': { crest: 'https://crests.football-data.org/650.png', shortName: 'Club Brugge' },
  'Celje': { crest: 'https://crests.football-data.org/celje.png', shortName: 'Celje' },
  'Sunderland': { crest: 'https://crests.football-data.org/71.png', shortName: 'Sunderland' },
  'Sporting CP': { crest: 'https://crests.football-data.org/498.png', shortName: 'Sporting CP' },
  'SL Benfica': { crest: 'https://crests.football-data.org/1903.png', shortName: 'Benfica' },
  'Benfica': { crest: 'https://crests.football-data.org/1903.png', shortName: 'Benfica' },
  'FC Porto': { crest: 'https://crests.football-data.org/503.png', shortName: 'Porto' },
  'Porto': { crest: 'https://crests.football-data.org/503.png', shortName: 'Porto' },
  'SC Braga': { crest: 'https://crests.football-data.org/5613.png', shortName: 'Braga' },
  'Braga': { crest: 'https://crests.football-data.org/5613.png', shortName: 'Braga' },
  'Vitória SC': { crest: 'https://crests.football-data.org/5529.png', shortName: 'Vitória SC' },
  'Boavista FC': { crest: 'https://crests.football-data.org/5530.png', shortName: 'Boavista' },
  'Boavista': { crest: 'https://crests.football-data.org/5530.png', shortName: 'Boavista' },

  // ===================== EREDIVISIE =====================
  'AFC Ajax': { crest: 'https://crests.football-data.org/678.png', shortName: 'Ajax' },
  'Ajax': { crest: 'https://crests.football-data.org/678.png', shortName: 'Ajax' },
  'PSV Eindhoven': { crest: 'https://crests.football-data.org/674.png', shortName: 'PSV' },
  'PSV': { crest: 'https://crests.football-data.org/674.png', shortName: 'PSV' },
  'Feyenoord Rotterdam': { crest: 'https://crests.football-data.org/675.png', shortName: 'Feyenoord' },
  'Feyenoord': { crest: 'https://crests.football-data.org/675.png', shortName: 'Feyenoord' },
  'AZ Alkmaar': { crest: 'https://crests.football-data.org/682.png', shortName: 'AZ' },
  'AZ': { crest: 'https://crests.football-data.org/682.png', shortName: 'AZ' },
  'FC Twente': { crest: 'https://crests.football-data.org/666.png', shortName: 'Twente' },
  'Twente': { crest: 'https://crests.football-data.org/666.png', shortName: 'Twente' },
  'FC Utrecht': { crest: 'https://crests.football-data.org/676.png', shortName: 'Utrecht' },
  'Utrecht': { crest: 'https://crests.football-data.org/676.png', shortName: 'Utrecht' },

  // ===================== BELGIAN PRO LEAGUE =====================
  'Club Brugge KV': { crest: 'https://crests.football-data.org/851.png', shortName: 'Club Brugge' },
  'RSC Anderlecht': { crest: 'https://crests.football-data.org/853.png', shortName: 'Anderlecht' },
  'Anderlecht': { crest: 'https://crests.football-data.org/853.png', shortName: 'Anderlecht' },
  'KRC Genk': { crest: 'https://crests.football-data.org/855.png', shortName: 'Genk' },
  'Genk': { crest: 'https://crests.football-data.org/855.png', shortName: 'Genk' },
  'KAA Gent': { crest: 'https://crests.football-data.org/856.png', shortName: 'Gent' },
  'Gent': { crest: 'https://crests.football-data.org/856.png', shortName: 'Gent' },
  'Royale Union Saint-Gilloise': { crest: 'https://crests.football-data.org/1105.png', shortName: 'Union SG' },
  'Union SG': { crest: 'https://crests.football-data.org/1105.png', shortName: 'Union SG' },
  'Celtic FC': { crest: 'https://crests.football-data.org/732.png', shortName: 'Celtic' },
  'Rangers FC': { crest: 'https://crests.football-data.org/731.png', shortName: 'Rangers' },
  'Galatasaray SK': { crest: 'https://crests.football-data.org/613.png', shortName: 'Galatasaray' },
  'Fenerbahçe SK': { crest: 'https://crests.football-data.org/614.png', shortName: 'Fenerbahçe' },

  // ===================== NATIONAL TEAMS (EURO & WORLD CUP) =====================
  'Albania': { crest: 'https://crests.football-data.org/789.png', shortName: 'Albania' },
  'Argentina': { crest: 'https://crests.football-data.org/762.png', shortName: 'Argentina' },
  'Australia': { crest: 'https://crests.football-data.org/779.png', shortName: 'Australia' },
  'Austria': { crest: 'https://crests.football-data.org/816.png', shortName: 'Austria' },
  'Belgium': { crest: 'https://crests.football-data.org/805.png', shortName: 'Belgium' },
  'Brazil': { crest: 'https://crests.football-data.org/764.png', shortName: 'Brazil' },
  'Cameroon': { crest: 'https://crests.football-data.org/777.png', shortName: 'Cameroon' },
  'Canada': { crest: 'https://crests.football-data.org/780.png', shortName: 'Canada' },
  'Costa Rica': { crest: 'https://crests.football-data.org/793.png', shortName: 'Costa Rica' },
  'Croatia': { crest: 'https://crests.football-data.org/799.png', shortName: 'Croatia' },
  'Czech Republic': { crest: 'https://crests.football-data.org/792.png', shortName: 'Czechia' },
  'Denmark': { crest: 'https://crests.football-data.org/782.png', shortName: 'Denmark' },
  'Ecuador': { crest: 'https://crests.football-data.org/781.png', shortName: 'Ecuador' },
  'England': { crest: 'https://crests.football-data.org/770.png', shortName: 'England' },
  'France': { crest: 'https://crests.football-data.org/773.png', shortName: 'France' },
  'Georgia': { crest: 'https://crests.football-data.org/809.png', shortName: 'Georgia' },
  'Germany': { crest: 'https://crests.football-data.org/759.png', shortName: 'Germany' },
  'Ghana': { crest: 'https://crests.football-data.org/778.png', shortName: 'Ghana' },
  'Hungary': { crest: 'https://crests.football-data.org/790.png', shortName: 'Hungary' },
  'Iran': { crest: 'https://crests.football-data.org/840.png', shortName: 'Iran' },
  'Italy': { crest: 'https://crests.football-data.org/784.png', shortName: 'Italy' },
  'Japan': { crest: 'https://crests.football-data.org/766.png', shortName: 'Japan' },
  'Mexico': { crest: 'https://crests.football-data.org/769.png', shortName: 'Mexico' },
  'Morocco': { crest: 'https://crests.football-data.org/815.png', shortName: 'Morocco' },
  'Netherlands': { crest: 'https://crests.football-data.org/670.png', shortName: 'Netherlands' },
  'Poland': { crest: 'https://crests.football-data.org/794.png', shortName: 'Poland' },
  'Portugal': { crest: 'https://crests.football-data.org/765.png', shortName: 'Portugal' },
  'Qatar': { crest: 'https://crests.football-data.org/qatar.png', shortName: 'Qatar' },
  'Romania': { crest: 'https://crests.football-data.org/798.png', shortName: 'Romania' },
  'Saudi Arabia': { crest: 'https://crests.football-data.org/801.png', shortName: 'Saudi Arabia' },
  'Scotland': { crest: 'https://crests.football-data.org/814.png', shortName: 'Scotland' },
  'Senegal': { crest: 'https://crests.football-data.org/804.png', shortName: 'Senegal' },
  'Serbia': { crest: 'https://crests.football-data.org/785.png', shortName: 'Serbia' },
  'Slovakia': { crest: 'https://crests.football-data.org/795.png', shortName: 'Slovakia' },
  'Slovenia': { crest: 'https://crests.football-data.org/797.png', shortName: 'Slovenia' },
  'South Korea': { crest: 'https://crests.football-data.org/771.png', shortName: 'South Korea' },
  'Spain': { crest: 'https://crests.football-data.org/760.png', shortName: 'Spain' },
  'Switzerland': { crest: 'https://crests.football-data.org/788.png', shortName: 'Switzerland' },
  'Tunisia': { crest: 'https://crests.football-data.org/802.png', shortName: 'Tunisia' },
  'Turkey': { crest: 'https://crests.football-data.org/803.png', shortName: 'Turkey' },
  'USA': { crest: 'https://crests.football-data.org/772.png', shortName: 'USA' },
  'Ukraine': { crest: 'https://crests.football-data.org/796.png', shortName: 'Ukraine' },
  'Uruguay': { crest: 'https://crests.football-data.org/758.png', shortName: 'Uruguay' },
  'Wales': { crest: 'https://crests.football-data.org/833.png', shortName: 'Wales' },
};

/**
 * Competition Emblem Defaults
 */
export const COMPETITION_EMBLEMS: Record<string, string> = {
  PL: 'https://crests.football-data.org/PL.png',
  CL: 'https://crests.football-data.org/CL.png',
  EL: 'https://crests.football-data.org/EL.png',
  PD: 'https://crests.football-data.org/PD.png',
  BL1: 'https://crests.football-data.org/BL1.png',
  BL2: 'https://crests.football-data.org/BL1.png',
  SA: 'https://crests.football-data.org/SA.png',
  FL1: 'https://crests.football-data.org/FL1.png',
  PPL: 'https://crests.football-data.org/PPL.png',
  BEL: 'https://crests.football-data.org/BEL.png',
  DED: 'https://crests.football-data.org/DED.png',
  DFB: 'https://crests.football-data.org/DFB.png',
  WC: 'https://crests.football-data.org/qatar.png',
  EC: 'https://crests.football-data.org/EC.png',
  INT: 'https://crests.football-data.org/CL.png',
};

/**
 * Resolves crest URL and clean short name for any team name
 */
export function resolveTeamInfo(teamName: string, competitionId?: string): TeamInfo {
  if (!teamName) {
    return { crest: 'https://crests.football-data.org/PL.png', shortName: 'Club' };
  }

  // Exact match
  if (TEAM_REGISTRY[teamName]) {
    return TEAM_REGISTRY[teamName];
  }

  // Try trimmed/normalized name
  const normalized = teamName.trim();
  if (TEAM_REGISTRY[normalized]) {
    return TEAM_REGISTRY[normalized];
  }

  // Try without "FC" / "CF" / "Calcio"
  const stripped = normalized
    .replace(/\s+FC$/, '')
    .replace(/\s+CF$/, '')
    .replace(/^FC\s+/, '')
    .replace(/\s+Calcio$/, '')
    .trim();

  if (TEAM_REGISTRY[stripped]) {
    return TEAM_REGISTRY[stripped];
  }

  // Fuzzy search in registry
  const lower = normalized.toLowerCase();
  for (const [key, val] of Object.entries(TEAM_REGISTRY)) {
    const keyLower = key.toLowerCase();
    if (keyLower.includes(lower) || lower.includes(keyLower)) {
      return val;
    }
  }

  // Fallback: competition emblem or generic football icon with cleanly derived short name
  const fallbackEmblem = (competitionId && COMPETITION_EMBLEMS[competitionId]) || 'https://crests.football-data.org/PL.png';
  const cleanShort = stripped.slice(0, 16);
  return {
    crest: fallbackEmblem,
    shortName: cleanShort,
  };
}
