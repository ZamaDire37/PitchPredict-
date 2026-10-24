import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-football-jwt-key-2026',
  footballDataApiKey: process.env.FOOTBALL_DATA_API_KEY || '',
  footballDataBaseUrl: 'https://api.football-data.org/v4',
  supportedCompetitions: [
    { id: 'PL', name: 'Premier League', emblem: 'https://crests.football-data.org/PL.png' },
    { id: 'CL', name: 'UEFA Champions League', emblem: 'https://crests.football-data.org/CL.png' },
    { id: 'PD', name: 'La Liga', emblem: 'https://crests.football-data.org/PD.png' },
    { id: 'BL1', name: 'Bundesliga', emblem: 'https://crests.football-data.org/BL1.png' },
    { id: 'SA', name: 'Serie A', emblem: 'https://crests.football-data.org/SA.png' },
    { id: 'FL1', name: 'Ligue 1', emblem: 'https://crests.football-data.org/FL1.png' },
  ],
};
