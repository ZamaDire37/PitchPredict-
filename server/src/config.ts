import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server-side .env files when present (local dev); Render injects env vars directly
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-football-jwt-key-2026',
  supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
  supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || '').trim(),
  supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '').trim(),
  footballDataApiKey: (process.env.FOOTBALL_DATA_API_KEY || '').trim(),
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
