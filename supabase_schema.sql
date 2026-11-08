-- ====================================================================
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

-- Index for authentication and leaderboards
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_basic_points ON public.users(basic_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_serious_points ON public.users(serious_points DESC);

-- 3. MATCHES TABLE (1,981+ Verified Real Matches)
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

-- 8. KEEP SEQUENCES ALIGNED AFTER EXPLICIT-ID MIGRATIONS
SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE((SELECT MAX(id) FROM public.users), 1), true);
SELECT setval(pg_get_serial_sequence('public.serious_sets', 'id'), COALESCE((SELECT MAX(id) FROM public.serious_sets), 1), true);
SELECT setval(pg_get_serial_sequence('public.predictions', 'id'), COALESCE((SELECT MAX(id) FROM public.predictions), 1), true);
SELECT setval(pg_get_serial_sequence('public.points_history', 'id'), COALESCE((SELECT MAX(id) FROM public.points_history), 1), true);

