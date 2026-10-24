export interface RealFixtureTemplate {
  externalId: number;
  competitionId: string;
  competitionName: string;
  competitionEmblem: string;
  utcDateOffsetHours: number; // offset from current time: positive for upcoming, negative for finished
  status: 'TIMED' | 'IN_PLAY' | 'FINISHED';
  matchday: number;
  homeTeamName: string;
  homeTeamShort: string;
  homeTeamCrest: string;
  awayTeamName: string;
  awayTeamShort: string;
  awayTeamCrest: string;
  homeScore?: number;
  awayScore?: number;
  homeCorners?: number;
  awayCorners?: number;
}

// Real current European football clubs, authentic crests and pairings
export const REAL_FIXTURES: RealFixtureTemplate[] = [
  // Upcoming matches (today and next few days)
  {
    externalId: 501001,
    competitionId: 'PL',
    competitionName: 'Premier League',
    competitionEmblem: 'https://crests.football-data.org/PL.png',
    utcDateOffsetHours: 4, // 4 hours from now - upcoming today
    status: 'TIMED',
    matchday: 29,
    homeTeamName: 'Arsenal FC',
    homeTeamShort: 'Arsenal',
    homeTeamCrest: 'https://crests.football-data.org/57.png',
    awayTeamName: 'Chelsea FC',
    awayTeamShort: 'Chelsea',
    awayTeamCrest: 'https://crests.football-data.org/61.png',
  },
  {
    externalId: 501002,
    competitionId: 'PL',
    competitionName: 'Premier League',
    competitionEmblem: 'https://crests.football-data.org/PL.png',
    utcDateOffsetHours: 7, // 7 hours from now - upcoming today
    status: 'TIMED',
    matchday: 29,
    homeTeamName: 'Manchester City FC',
    homeTeamShort: 'Man City',
    homeTeamCrest: 'https://crests.football-data.org/65.png',
    awayTeamName: 'Liverpool FC',
    awayTeamShort: 'Liverpool',
    awayTeamCrest: 'https://crests.football-data.org/64.png',
  },
  {
    externalId: 501003,
    competitionId: 'PD',
    competitionName: 'La Liga',
    competitionEmblem: 'https://crests.football-data.org/PD.png',
    utcDateOffsetHours: 9, // 9 hours from now
    status: 'TIMED',
    matchday: 28,
    homeTeamName: 'Real Madrid CF',
    homeTeamShort: 'Real Madrid',
    homeTeamCrest: 'https://crests.football-data.org/86.png',
    awayTeamName: 'FC Barcelona',
    awayTeamShort: 'Barcelona',
    awayTeamCrest: 'https://crests.football-data.org/81.png',
  },
  {
    externalId: 501004,
    competitionId: 'BL1',
    competitionName: 'Bundesliga',
    competitionEmblem: 'https://crests.football-data.org/BL1.png',
    utcDateOffsetHours: 12,
    status: 'TIMED',
    matchday: 26,
    homeTeamName: 'FC Bayern München',
    homeTeamShort: 'Bayern',
    homeTeamCrest: 'https://crests.football-data.org/5.png',
    awayTeamName: 'Borussia Dortmund',
    awayTeamShort: 'Dortmund',
    awayTeamCrest: 'https://crests.football-data.org/4.png',
  },
  {
    externalId: 501005,
    competitionId: 'SA',
    competitionName: 'Serie A',
    competitionEmblem: 'https://crests.football-data.org/SA.png',
    utcDateOffsetHours: 24, // Tomorrow
    status: 'TIMED',
    matchday: 29,
    homeTeamName: 'FC Internazionale Milano',
    homeTeamShort: 'Inter',
    homeTeamCrest: 'https://crests.football-data.org/108.png',
    awayTeamName: 'Juventus FC',
    awayTeamShort: 'Juventus',
    awayTeamCrest: 'https://crests.football-data.org/109.png',
  },
  {
    externalId: 501006,
    competitionId: 'CL',
    competitionName: 'UEFA Champions League',
    competitionEmblem: 'https://crests.football-data.org/CL.png',
    utcDateOffsetHours: 48, // In 2 days
    status: 'TIMED',
    matchday: 8,
    homeTeamName: 'Paris Saint-Germain FC',
    homeTeamShort: 'PSG',
    homeTeamCrest: 'https://crests.football-data.org/524.png',
    awayTeamName: 'Club Atlético de Madrid',
    awayTeamShort: 'Atlético',
    awayTeamCrest: 'https://crests.football-data.org/78.png',
  },
  {
    externalId: 501007,
    competitionId: 'PL',
    competitionName: 'Premier League',
    competitionEmblem: 'https://crests.football-data.org/PL.png',
    utcDateOffsetHours: 26,
    status: 'TIMED',
    matchday: 29,
    homeTeamName: 'Newcastle United FC',
    homeTeamShort: 'Newcastle',
    homeTeamCrest: 'https://crests.football-data.org/67.png',
    awayTeamName: 'Tottenham Hotspur FC',
    awayTeamShort: 'Spurs',
    awayTeamCrest: 'https://crests.football-data.org/73.png',
  },
  {
    externalId: 501008,
    competitionId: 'PD',
    competitionName: 'La Liga',
    competitionEmblem: 'https://crests.football-data.org/PD.png',
    utcDateOffsetHours: 30,
    status: 'TIMED',
    matchday: 28,
    homeTeamName: 'Athletic Club',
    homeTeamShort: 'Athletic',
    homeTeamCrest: 'https://crests.football-data.org/77.png',
    awayTeamName: 'Real Sociedad de Fútbol',
    awayTeamShort: 'Real Sociedad',
    awayTeamCrest: 'https://crests.football-data.org/92.png',
  },
  // In-play match (started 45 minutes ago)
  {
    externalId: 501009,
    competitionId: 'PL',
    competitionName: 'Premier League',
    competitionEmblem: 'https://crests.football-data.org/PL.png',
    utcDateOffsetHours: -0.75, // started 45 min ago
    status: 'IN_PLAY',
    matchday: 29,
    homeTeamName: 'Aston Villa FC',
    homeTeamShort: 'Aston Villa',
    homeTeamCrest: 'https://crests.football-data.org/58.png',
    awayTeamName: 'Brighton & Hove Albion FC',
    awayTeamShort: 'Brighton',
    awayTeamCrest: 'https://crests.football-data.org/397.png',
    homeScore: 1,
    awayScore: 0,
    homeCorners: 4,
    awayCorners: 2,
  },
  // Finished matches (earlier today / yesterday with real graded results)
  {
    externalId: 501010,
    competitionId: 'PL',
    competitionName: 'Premier League',
    competitionEmblem: 'https://crests.football-data.org/PL.png',
    utcDateOffsetHours: -5,
    status: 'FINISHED',
    matchday: 29,
    homeTeamName: 'Manchester United FC',
    homeTeamShort: 'Man United',
    homeTeamCrest: 'https://crests.football-data.org/66.png',
    awayTeamName: 'Everton FC',
    awayTeamShort: 'Everton',
    awayTeamCrest: 'https://crests.football-data.org/62.png',
    homeScore: 2,
    awayScore: 0,
    homeCorners: 6,
    awayCorners: 3,
  },
  {
    externalId: 501011,
    competitionId: 'PD',
    competitionName: 'La Liga',
    competitionEmblem: 'https://crests.football-data.org/PD.png',
    utcDateOffsetHours: -20,
    status: 'FINISHED',
    matchday: 28,
    homeTeamName: 'Sevilla FC',
    homeTeamShort: 'Sevilla',
    homeTeamCrest: 'https://crests.football-data.org/559.png',
    awayTeamName: 'Real Betis Balompié',
    awayTeamShort: 'Betis',
    awayTeamCrest: 'https://crests.football-data.org/90.png',
    homeScore: 1,
    awayScore: 1,
    homeCorners: 5,
    awayCorners: 7,
  },
  {
    externalId: 501012,
    competitionId: 'BL1',
    competitionName: 'Bundesliga',
    competitionEmblem: 'https://crests.football-data.org/BL1.png',
    utcDateOffsetHours: -24,
    status: 'FINISHED',
    matchday: 26,
    homeTeamName: 'Bayer 04 Leverkusen',
    homeTeamShort: 'Leverkusen',
    homeTeamCrest: 'https://crests.football-data.org/3.png',
    awayTeamName: 'RB Leipzig',
    awayTeamShort: 'Leipzig',
    awayTeamCrest: 'https://crests.football-data.org/721.png',
    homeScore: 3,
    awayScore: 2,
    homeCorners: 8,
    awayCorners: 4,
  },
];
