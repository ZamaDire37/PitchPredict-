import { initDatabase } from './database.js';
import { enrichAllMatchesInDatabase } from './enrichMatches.js';
import { RealFootballApiService } from '../services/realFootballApi.js';

async function seed() {
  console.log('--- Initializing Database Schema ---');
  initDatabase();

  console.log('--- Purging Mock Fixtures & Enriching Matches ---');
  enrichAllMatchesInDatabase();

  console.log('--- Syncing Real Matches from External APIs ---');
  try {
    const res = await RealFootballApiService.syncRealMatches();
    console.log(`[Seed Sync] ${res.message}`);
  } catch (err: any) {
    console.warn(`[Seed Sync Error] ${err.message}`);
  }

  console.log('--- Database Initialization Complete (Zero Mock Data) ---');
}

seed().catch(console.error);
