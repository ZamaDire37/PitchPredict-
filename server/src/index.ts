import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initDatabase, testSupabaseConnection } from './db/database.js';
import { enrichAllMatchesInDatabase } from './db/enrichMatches.js';
import { RealFootballApiService } from './services/realFootballApi.js';
import { resolveAndGradePastMatches } from './services/scoringEngine.js';

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

// Verify Supabase connectivity and sync live football fixtures into Supabase on startup
(async () => {
  try {
    await initDatabase();
    console.log('[Startup] Connected to Supabase Free (PostgreSQL) — exclusive database ready.');
    await resolveAndGradePastMatches(true);
    await enrichAllMatchesInDatabase();
    const res = await RealFootballApiService.syncRealMatches();
    console.log(`[Startup] ${res.message}`);
    await enrichAllMatchesInDatabase();
  } catch (err: any) {
    console.error(`[Startup Warning] ${err.message}`);
  }
})();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// System status / health (includes live Supabase status)
app.get('/api/health', async (_req, res) => {
  const dbCheck = await testSupabaseConnection();
  const httpStatus = dbCheck.connected ? 200 : 503;
  res.status(httpStatus).json({
    status: dbCheck.connected ? 'ok' : 'degraded',
    database: dbCheck.connected ? 'connected' : 'unavailable',
    databaseError: dbCheck.error || null,
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
  console.log(`  Database: Supabase Free (PostgreSQL Cloud Only)`);
  console.log(`  API Base URL: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});
