import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initDatabase } from './db/database.js';
import { enrichAllMatchesInDatabase } from './db/enrichMatches.js';
import { RealFootballApiService } from './services/realFootballApi.js';
import { FootballApiService } from './services/footballApi.js';

import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import predictionRoutes from './routes/predictions.js';
import historyRoutes from './routes/history.js';
import leaderboardRoutes from './routes/leaderboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB and sync real football fixtures from live APIs
initDatabase();
enrichAllMatchesInDatabase();
RealFootballApiService.syncRealMatches().then((res) => {
  console.log(`[Startup] ${res.message}`);
  enrichAllMatchesInDatabase();
}).catch((err) => {
  console.warn(`[Startup API Sync] ${err.message}`);
  enrichAllMatchesInDatabase();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// System status / health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    service: 'Football Prediction System',
    version: '1.0.0',
  });
});

// Serve frontend static build if present
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Background auto-poller for live match results (runs every 10 minutes)
setInterval(async () => {
  try {
    console.log('[Scheduler] Checking live real football API updates...');
    const syncRes = await RealFootballApiService.syncRealMatches();
    console.log(`[Scheduler] Live API update complete: ${syncRes.syncedCount} matches synced.`);
  } catch (err: any) {
    console.error('[Scheduler] Error during real API auto sync:', err.message);
  }
}, 10 * 60 * 1000);

const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  Football Prediction Engine running on port ${PORT}`);
  console.log(`  API Base URL: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});
