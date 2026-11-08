import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Zap,
  ShieldCheck,
  Server,
  Cloud,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DatabaseModalProps {
  onClose: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- ====================================================================
-- PitchPredict Official Supabase Database Schema (PostgreSQL)
-- Run this script directly in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE (Official Verified Accounts)
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    basic_points INTEGER NOT NULL DEFAULT 0,
    serious_points INTEGER NOT NULL DEFAULT 0,
    basic_streak INTEGER NOT NULL DEFAULT 0,
    basic_best_streak INTEGER NOT NULL DEFAULT 0,
    serious_streak INTEGER NOT NULL DEFAULT 0,
    serious_best_streak INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT true,
    account_type VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_basic_points ON public.users(basic_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_serious_points ON public.users(serious_points DESC);

-- 3. MATCHES TABLE (1,954+ Verified Real Matches)
CREATE TABLE IF NOT EXISTS public.matches (
    id BIGINT PRIMARY KEY,
    external_id BIGINT UNIQUE,
    competition_id VARCHAR(20) NOT NULL,
    competition_name VARCHAR(100) NOT NULL,
    competition_emblem TEXT,
    utc_date VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TIMED',
    matchday INTEGER DEFAULT 1,
    home_team_id INTEGER,
    home_team_name VARCHAR(100) NOT NULL,
    home_team_short VARCHAR(50),
    home_team_crest TEXT,
    away_team_id INTEGER,
    away_team_name VARCHAR(100) NOT NULL,
    away_team_short VARCHAR(50),
    away_team_crest TEXT,
    home_score INTEGER,
    away_score INTEGER,
    home_corners INTEGER,
    away_corners INTEGER,
    winner VARCHAR(20),
    data_source VARCHAR(100),
    is_graded INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_matches_utc_date ON public.matches(utc_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_competition ON public.matches(competition_id);
CREATE INDEX IF NOT EXISTS idx_matches_external_id ON public.matches(external_id);

-- 4. SERIOUS SETS TABLE (Serious Mode Bundled Slips)
CREATE TABLE IF NOT EXISTS public.serious_sets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    potential_points INTEGER NOT NULL DEFAULT 0,
    points_delta INTEGER NOT NULL DEFAULT 0,
    total_predictions INTEGER NOT NULL DEFAULT 0,
    correct_predictions INTEGER NOT NULL DEFAULT 0,
    incorrect_predictions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_serious_sets_user_id ON public.serious_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_serious_sets_status ON public.serious_sets(status);

-- 5. PREDICTIONS TABLE (Official User Predictions)
CREATE TABLE IF NOT EXISTS public.predictions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_id BIGINT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('BASIC', 'SERIOUS')),
    serious_set_id BIGINT REFERENCES public.serious_sets(id) ON DELETE CASCADE,
    market_type VARCHAR(50) NOT NULL,
    selection VARCHAR(50) NOT NULL,
    odds_points INTEGER NOT NULL DEFAULT 10,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    actual_result VARCHAR(100),
    points_awarded INTEGER NOT NULL DEFAULT 0,
    is_verified_account BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_mode ON public.predictions(mode);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON public.predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_serious_set_id ON public.predictions(serious_set_id);

-- 6. POINTS HISTORY TABLE (Full Transparent Audit Trail)
CREATE TABLE IF NOT EXISTS public.points_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('BASIC', 'SERIOUS')),
    delta INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT NOT NULL,
    prediction_id BIGINT REFERENCES public.predictions(id) ON DELETE SET NULL,
    serious_set_id BIGINT REFERENCES public.serious_sets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON public.points_history(user_id);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serious_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access to matches and leaderboard profiles
CREATE POLICY "Public matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public predictions are viewable by everyone" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Public sets are viewable by everyone" ON public.serious_sets FOR SELECT USING (true);

-- Allow backend sync with anon or service key
CREATE POLICY "Enable all access for matches sync" ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for users sync" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for predictions sync" ON public.predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for serious_sets sync" ON public.serious_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for points_history sync" ON public.points_history FOR ALL USING (true) WITH CHECK (true);
`;

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ onClose }) => {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getDatabaseStatus();
      setDbStatus(res.database);
    } catch (err) {
      console.error('Failed to get database status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSyncSupabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.syncSupabase();
      setSyncResult(res);
      await fetchStatus();
    } catch (err: any) {
      setSyncResult({ success: false, error: err.message || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = Boolean(dbStatus?.connected);
  const sqlEditorUrl = 'https://supabase.com/dashboard/project/_/sql/new';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-black text-white">
                  Database & Supabase Center
                </h2>
                <span
                  className={`px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                    }`}
                  ></span>
                  <span>{isConnected ? 'Connected' : 'Unavailable'}</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Supabase Free PostgreSQL — Exclusive Primary Database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain text-xs text-slate-300 pb-6">
          {/* Connection Overview Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Supabase Cloud PostgreSQL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  Server-side Environment Config
                </span>
                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Refresh Connection"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Connection Status</span>
                <span
                  className={`font-bold font-mono text-xs flex items-center gap-1 mt-0.5 ${
                    isConnected ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isConnected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                  <span>{dbStatus?.status || (loading ? 'CHECKING' : 'UNAVAILABLE')}</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Registered Users</span>
                <span className="text-white font-bold font-mono text-xs mt-0.5 block">
                  {dbStatus?.userCount !== undefined ? `${dbStatus.userCount} Users` : '—'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Cloud Matches</span>
                <span className="text-cyan-400 font-bold font-mono text-xs mt-0.5 block">
                  {dbStatus?.matchCount !== undefined ? `${dbStatus.matchCount} Matches` : '—'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Credentials</span>
                <span className="text-slate-300 font-bold font-mono text-xs mt-0.5 block truncate">
                  Server Env Only
                </span>
              </div>
            </div>

            {dbStatus?.error && (
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-bold">Schema Notice:</strong>
                  <span>{dbStatus.error}</span>
                </div>
              </div>
            )}
          </div>

          {/* 3 Steps to Finish Database Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>How to Finish the Supabase Cloud Setup</span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              To complete the cloud database setup, PostgreSQL requires the database tables and Row Level Security (RLS) policies to be active in your Supabase project. Follow these simple steps:
            </p>

            <div className="space-y-2.5 text-xs">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-white block font-bold">Copy the Schema Script</strong>
                    <span className="text-slate-400 text-[11px]">
                      Copies the complete 143-line SQL schema (users, matches, predictions, sets, ledger & RLS).
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopySql}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                    copied
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Schema SQL'}</span>
                </button>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-white block font-bold">Run in Supabase SQL Editor</strong>
                    <span className="text-slate-400 text-[11px]">
                      Open the SQL Editor in your Supabase dashboard, paste the copied SQL, and click <strong>"Run"</strong>.
                    </span>
                  </div>
                </div>

                <a
                  href={sqlEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Open SQL Editor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-white block font-bold">Sync All Records to Supabase</strong>
                    <span className="text-slate-400 text-[11px]">
                      Uploads all 1,954 verified real matches, official accounts, predictions, and ledger to the cloud.
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSyncSupabase}
                  disabled={syncing}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync Everything to Cloud'}</span>
                </button>
              </div>
            </div>

            {/* Sync Feedback */}
            {syncResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  syncResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/60 border-red-500/40 text-red-300'
                }`}
              >
                {syncResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-bold">
                    {syncResult.success ? 'Sync Completed Successfully!' : 'Sync Notice:'}
                  </strong>
                  <span>
                    {syncResult.success
                      ? `Synced ${syncResult.matchesSynced ?? syncResult.totalSynced ?? 0} matches, ${syncResult.usersSynced ?? 0} users, and ${syncResult.predictionsSynced ?? 0} predictions into Supabase Cloud!`
                      : syncResult.error || 'Failed to sync with Supabase'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Schema Preview Codebox */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                PostgreSQL Schema Preview (supabase_schema.sql)
              </span>
              <button
                onClick={handleCopySql}
                className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Full SQL</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto leading-relaxed select-all">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-safe">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Exclusive Cloud Storage: Supabase Free PostgreSQL (Zero Local SQLite)</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 min-h-[40px] sm:min-h-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
