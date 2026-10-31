import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useGameMode } from '../context/GameModeContext';
import { useTimezone } from '../context/TimezoneContext';
import {
  Trophy,
  Flame,
  Shield,
  Layers,
  BarChart3,
  Calendar,
  History,
  HelpCircle,
  LogIn,
  LogOut,
  RefreshCw,
  Sliders,
  Sparkles,
  Database,
  Globe,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenRules: () => void;
  onOpenSimulator: () => void;
  onOpenDatabase?: () => void;
  onOpenTimezone?: () => void;
  onSyncApi: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenRules,
  onOpenSimulator,
  onOpenDatabase,
  onOpenTimezone,
  onSyncApi,
  isSyncing,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, setMode, stagedPredictions } = useGameMode();
  const { timezoneLabel, timezoneAbbr } = useTimezone();

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b transition-colors duration-300 ${
          mode === 'SERIOUS'
            ? 'border-red-500/40 bg-[#140606]/95 shadow-lg shadow-red-950/40 backdrop-blur-md'
            : 'border-slate-800 bg-slate-950/90 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('matches')}>
              <div
                className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg transition-all duration-300 border shrink-0 ${
                  mode === 'SERIOUS'
                    ? 'border-amber-500/60 shadow-red-500/30 ring-2 ring-red-500/50'
                    : 'border-emerald-500/50 shadow-emerald-500/20'
                }`}
              >
                <img
                  src="/logo.png"
                  alt="PitchPredict P² Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm sm:text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                    PITCH<span className={mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'}>PREDICT</span>
                  </span>
                  {mode === 'SERIOUS' ? (
                    <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                      🔥 SERIOUS
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      🛡️ BASIC
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 hidden lg:block">
                  {mode === 'SERIOUS' ? 'High-Stakes Accumulator Mode' : 'Real Football Match Predictions'}
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-900/90 p-0.5 sm:p-1 rounded-xl border border-slate-800 shadow-inner shrink-0">
              <button
                onClick={() => setMode('BASIC')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  mode === 'BASIC'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title="Switch to Basic Mode (Zero Penalty)"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Basic<span className="hidden sm:inline"> Mode</span></span>
              </button>
              <button
                onClick={() => setMode('SERIOUS')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-200 relative ${
                  mode === 'SERIOUS'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white shadow-lg shadow-red-500/40 font-black ring-2 ring-red-500/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title="Switch to Serious Mode (-10 Set Penalty)"
              >
                <Flame className="w-3.5 h-3.5 text-amber-200" />
                <span>Serious<span className="hidden sm:inline"> Mode</span></span>
                {stagedPredictions.length > 0 && (
                  <span className="ml-0.5 sm:ml-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] bg-white text-slate-950 font-black animate-pulse">
                    {stagedPredictions.length}
                  </span>
                )}
              </button>
            </div>

            {/* User Points Balances & Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {isAuthenticated && user && (
                <div className="hidden xl:flex items-center gap-2">
                  {/* Basic Points Pill */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${
                      mode === 'BASIC'
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 opacity-70'
                    }`}
                    title="Basic Mode Points (10 Daily Selections Limit • Zero Penalty)"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{user.basic_points} pts</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({(user.basic_daily_count ?? user.basic_pending_count ?? 0)}/10 today)
                    </span>
                    {user.basic_streak > 0 && (
                      <span className="flex items-center text-[10px] text-emerald-400 bg-emerald-500/20 px-1 rounded font-bold">
                        🔥 {user.basic_streak}
                      </span>
                    )}
                  </div>

                  {/* Serious Points Pill */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${
                      mode === 'SERIOUS'
                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 opacity-70'
                    }`}
                    title="Serious Mode Points (-10 penalty on failed sets)"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{user.serious_points} pts</span>
                    {user.serious_streak > 0 && (
                      <span className="flex items-center text-[10px] text-amber-400 bg-amber-500/20 px-1 rounded font-bold">
                        ⚡ {user.serious_streak}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Database & Supabase Cloud Status */}
              {onOpenDatabase && (
                <button
                  onClick={onOpenDatabase}
                  className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 transition-colors text-xs font-semibold"
                  title="Supabase Cloud Database & Schema Center"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline text-[11px]">Database</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>
              )}

              {/* Test Match Simulator button */}
              <button
                onClick={onOpenSimulator}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition-colors"
                title="Match Simulator & Test Grader"
              >
                <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Sync Live Matches */}
              <button
                onClick={onSyncApi}
                disabled={isSyncing}
                className={`p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-colors ${
                  isSyncing ? 'animate-spin' : ''
                }`}
                title="Sync Real Football Fixtures & Scores"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Timezone Selector Button */}
              {onOpenTimezone && (
                <button
                  onClick={onOpenTimezone}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-colors"
                  title={`Active Timezone: ${timezoneLabel} (Click to change)`}
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline font-mono font-bold text-[11px] text-cyan-200">
                    {timezoneAbbr || 'TZ'}
                  </span>
                </button>
              )}

              {/* Info / Rules */}
              <button
                onClick={onOpenRules}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                title="Game Rules & Mechanics"
              >
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Auth Button */}
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800" title="Verified Real Account">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="truncate max-w-[90px]">{user?.username}</span>
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs font-medium transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span><span className="hidden sm:inline">Official </span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Tabs Bar (Hidden on Mobile Phones) */}
          <div
            className={`hidden md:flex items-center space-x-1 sm:space-x-4 border-t py-2 overflow-x-auto no-scrollbar transition-colors ${
              mode === 'SERIOUS' ? 'border-red-900/50' : 'border-slate-800/80'
            }`}
          >
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'matches'
                  ? mode === 'SERIOUS'
                    ? 'bg-red-950/70 text-amber-200 border border-red-500/40 shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calendar className={`w-4 h-4 ${mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>Fixtures & Matches</span>
            </button>

            <button
              onClick={() => setActiveTab('markets')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'markets'
                  ? mode === 'SERIOUS'
                    ? 'bg-gradient-to-r from-amber-500/20 via-red-500/20 to-red-600/20 text-amber-300 border border-amber-500/50 font-black shadow-md shadow-red-950/30 ring-1 ring-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className={`w-4 h-4 ${mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>{mode === 'SERIOUS' ? 'Serious Market Center' : 'Prediction Markets'}</span>
            </button>

            <button
              onClick={() => setActiveTab('predictions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'predictions'
                  ? mode === 'SERIOUS'
                    ? 'bg-red-950/70 text-amber-200 border border-red-500/40 shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className={`w-4 h-4 ${mode === 'SERIOUS' ? 'text-red-400' : 'text-cyan-400'}`} />
              <span>Past Predictions</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'analytics'
                  ? mode === 'SERIOUS'
                    ? 'bg-red-950/70 text-amber-200 border border-red-500/40 shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${mode === 'SERIOUS' ? 'text-amber-400' : 'text-purple-400'}`} />
              <span>Points Ledger & Charts</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'leaderboard'
                  ? mode === 'SERIOUS'
                    ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-300 border border-amber-500/40 font-black shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{mode === 'SERIOUS' ? 'Serious Leaderboard' : 'Leaderboards'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (FotMob/ESPN style with Safe Area support) */}
      <nav
        aria-label="Mobile Navigation"
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t backdrop-blur-xl transition-all duration-300 pb-safe ${
          mode === 'SERIOUS'
            ? 'bg-[#120404]/95 border-red-500/40 shadow-2xl shadow-red-950/80'
            : 'bg-slate-950/95 border-slate-800 shadow-2xl shadow-black/80'
        }`}
      >
        <div className="grid grid-cols-5 h-14 items-center px-1">
          {/* 1. Fixtures */}
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === 'matches'
                ? mode === 'SERIOUS'
                  ? 'text-amber-300 font-bold'
                  : 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className={`w-5 h-5 mb-0.5 ${activeTab === 'matches' ? (mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-400'}`} />
            <span className="text-[10px] tracking-tight">Fixtures</span>
            {activeTab === 'matches' && (
              <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${mode === 'SERIOUS' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            )}
          </button>

          {/* 2. Markets */}
          <button
            onClick={() => setActiveTab('markets')}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === 'markets'
                ? mode === 'SERIOUS'
                  ? 'text-amber-300 font-bold'
                  : 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Layers className={`w-5 h-5 mb-0.5 ${activeTab === 'markets' ? (mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-400'}`} />
              {mode === 'SERIOUS' && stagedPredictions.length > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] bg-red-500 text-white font-black animate-pulse">
                  {stagedPredictions.length}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Markets</span>
            {activeTab === 'markets' && (
              <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${mode === 'SERIOUS' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            )}
          </button>

          {/* 3. Past Predictions */}
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === 'predictions'
                ? mode === 'SERIOUS'
                  ? 'text-amber-300 font-bold'
                  : 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className={`w-5 h-5 mb-0.5 ${activeTab === 'predictions' ? (mode === 'SERIOUS' ? 'text-red-400' : 'text-cyan-400') : 'text-slate-400'}`} />
            <span className="text-[10px] tracking-tight">Picks</span>
            {activeTab === 'predictions' && (
              <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${mode === 'SERIOUS' ? 'bg-red-400' : 'bg-cyan-400'}`} />
            )}
          </button>

          {/* 4. Points Ledger & Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === 'analytics'
                ? mode === 'SERIOUS'
                  ? 'text-amber-300 font-bold'
                  : 'text-purple-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className={`w-5 h-5 mb-0.5 ${activeTab === 'analytics' ? (mode === 'SERIOUS' ? 'text-amber-400' : 'text-purple-400') : 'text-slate-400'}`} />
            <span className="text-[10px] tracking-tight">Ledger</span>
            {activeTab === 'analytics' && (
              <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${mode === 'SERIOUS' ? 'bg-amber-400' : 'bg-purple-400'}`} />
            )}
          </button>

          {/* 5. Leaderboard */}
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === 'leaderboard'
                ? 'text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className={`w-5 h-5 mb-0.5 ${activeTab === 'leaderboard' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-[10px] tracking-tight">Ranks</span>
            {activeTab === 'leaderboard' && (
              <span className="w-1 h-1 rounded-full absolute bottom-0.5 bg-amber-400" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
