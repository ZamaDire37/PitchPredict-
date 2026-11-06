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
  Menu,
  X,
  ChevronRight,
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b transition-colors duration-300 ${
          mode === 'SERIOUS'
            ? 'border-rose-900/40 bg-slate-950/95 shadow-sm backdrop-blur-md'
            : 'border-slate-800 bg-slate-950/90 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('matches')}>
              <div
                className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-md transition-all duration-300 border shrink-0 ${
                  mode === 'SERIOUS'
                    ? 'border-rose-800/60 shadow-rose-950/40'
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
                    PITCH<span className={mode === 'SERIOUS' ? 'text-rose-400' : 'text-emerald-400'}>PREDICT</span>
                  </span>
                  {mode === 'SERIOUS' ? (
                    <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/40">
                      SERIOUS
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
                    ? 'bg-rose-700 text-white shadow-md shadow-rose-950/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title="Switch to Serious Mode (-10 Set Penalty)"
              >
                <Flame className="w-3.5 h-3.5 text-rose-300" />
                <span>Serious<span className="hidden sm:inline"> Mode</span></span>
                {stagedPredictions.length > 0 && (
                  <span className="ml-0.5 sm:ml-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] bg-rose-950 text-rose-200 font-bold border border-rose-800/40">
                    {stagedPredictions.length}
                  </span>
                )}
              </button>
            </div>

            {/* User Points Balances & Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Mobile Active Points Pill (< xl) */}
              {isAuthenticated && user && (
                <div
                  className={`flex xl:hidden items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold ${
                    mode === 'BASIC'
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/70 border-rose-800/50 text-rose-300'
                  }`}
                  title={`${mode === 'BASIC' ? 'Basic' : 'Serious'} Points`}
                >
                  {mode === 'BASIC' ? (
                    <>
                      <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{user.basic_points}</span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        ({(user.basic_daily_count ?? user.basic_pending_count ?? 0)}/10)
                      </span>
                      {user.basic_streak > 0 && (
                        <span className="text-[10px] text-emerald-400">🔥{user.basic_streak}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{user.serious_points}</span>
                      {user.serious_streak > 0 && (
                        <span className="text-[10px] text-rose-400">⚡{user.serious_streak}</span>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Desktop Points Balances (>= xl) */}
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

              {/* Database & Supabase Cloud Status (Desktop only to save mobile header space) */}
              {onOpenDatabase && (
                <button
                  onClick={onOpenDatabase}
                  className="hidden sm:flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 transition-colors text-xs font-semibold"
                  title="Supabase Cloud Database & Schema Center"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline text-[11px]">Database</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>
              )}

              {/* Test Match Simulator button (Dev only - hidden in production) */}
              {import.meta.env.DEV && (
                <button
                  onClick={onOpenSimulator}
                  className="hidden sm:flex p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition-colors"
                  title="Match Simulator & Test Grader (Dev Mode Only)"
                >
                  <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

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

              {/* Timezone Selector Button (Hidden on small mobile to avoid header clutter) */}
              {onOpenTimezone && (
                <button
                  onClick={onOpenTimezone}
                  className="hidden sm:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-colors"
                  title={`Active Timezone: ${timezoneLabel} (Click to change)`}
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono font-bold text-[11px] text-cyan-200">
                    {timezoneAbbr || 'TZ'}
                  </span>
                </button>
              )}

              {/* Info / Rules */}
              <button
                onClick={onOpenRules}
                className="hidden xs:flex p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
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

              {/* Mobile Menu & All Options Button (< md) */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex md:hidden p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors select-none active:scale-95"
                title="All Navigation & Tools Menu"
                aria-label="Open Menu"
              >
                <Menu className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Top Navigation Tabs Bar (Scrollable on mobile phones & tablets, Responsive on desktop) */}
          <div
            className={`flex items-center space-x-1.5 sm:space-x-2 border-t py-2 overflow-x-auto no-scrollbar touch-pan-x -mx-2 px-2 sm:mx-0 sm:px-0 transition-colors ${
              mode === 'SERIOUS' ? 'border-red-900/50' : 'border-slate-800/80'
            }`}
          >
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'matches'
                  ? mode === 'SERIOUS'
                    ? 'bg-red-950/70 text-amber-200 border border-red-500/40 shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>Fixtures & Matches</span>
            </button>

            <button
              onClick={() => setActiveTab('markets')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'markets'
                  ? mode === 'SERIOUS'
                    ? 'bg-gradient-to-r from-amber-500/20 via-red-500/20 to-red-600/20 text-amber-300 border border-amber-500/50 font-black shadow-md shadow-red-950/30 ring-1 ring-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>{mode === 'SERIOUS' ? 'Serious Markets' : 'Prediction Markets'}</span>
            </button>

            <button
              onClick={() => setActiveTab('predictions')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'predictions'
                  ? mode === 'SERIOUS'
                    ? 'bg-red-950/70 text-amber-200 border border-red-500/40 shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${mode === 'SERIOUS' ? 'text-red-400' : 'text-cyan-400'}`} />
              <span>Past Predictions</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'analytics'
                  ? mode === 'SERIOUS'
                    ? 'bg-red-950/70 text-amber-200 border border-red-500/40 shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${mode === 'SERIOUS' ? 'text-amber-400' : 'text-purple-400'}`} />
              <span>Points Ledger & Charts</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'leaderboard'
                  ? mode === 'SERIOUS'
                    ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-300 border border-amber-500/40 font-black shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>{mode === 'SERIOUS' ? 'Serious Leaderboard' : 'Leaderboards'}</span>
            </button>

            {/* Rules & Guide Shortcut Pill */}
            <button
              onClick={onOpenRules}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 shrink-0 select-none active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rules & Guide</span>
            </button>

            {/* Timezone Shortcut Pill */}
            {onOpenTimezone && (
              <button
                onClick={onOpenTimezone}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors bg-slate-900/80 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 shrink-0 select-none active:scale-95"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Timezone ({timezoneAbbr})</span>
              </button>
            )}

            {/* Database Shortcut Pill */}
            {onOpenDatabase && (
              <button
                onClick={onOpenDatabase}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors bg-slate-900/80 text-emerald-400 border border-emerald-500/30 shrink-0 select-none active:scale-95"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Database</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Full Options Drawer / Bottom Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/85 backdrop-blur-md md:hidden">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl pb-safe">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">All Options & Navigation</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Section 1: Navigation Tabs */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Main Views</span>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  {[
                    { id: 'matches', label: 'Fixtures & Matches', icon: Calendar, color: 'text-emerald-400' },
                    { id: 'markets', label: 'Prediction Markets Center', icon: Layers, color: 'text-amber-400' },
                    { id: 'predictions', label: 'Past Predictions & Community Picks', icon: History, color: 'text-cyan-400' },
                    { id: 'analytics', label: 'Points Ledger & Charts', icon: BarChart3, color: 'text-purple-400' },
                    { id: 'leaderboard', label: 'Community Leaderboard & Rankings', icon: Trophy, color: 'text-amber-400' },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left font-bold transition-all ${
                          isActive
                            ? 'bg-slate-800 border-emerald-500/50 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${tab.color}`} />
                          <span>{tab.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Utilities & Settings */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Game Tools & Settings</span>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenRules();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 text-left font-bold transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div>Official Game Guide & Scoring Architecture</div>
                        <div className="text-[10px] text-slate-400 font-normal">Rules, 10 daily picks limit & points guide</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>

                  {onOpenTimezone && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenTimezone();
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 text-left font-bold transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <div>Timezone Settings</div>
                          <div className="text-[10px] text-cyan-300 font-normal">Current: {timezoneLabel} ({timezoneAbbr})</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </button>
                  )}

                  {onOpenDatabase && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenDatabase();
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 text-left font-bold transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div>Database & Supabase Cloud Center</div>
                          <div className="text-[10px] text-emerald-400 font-normal">PostgreSQL Cloud Architecture Status</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSyncApi();
                    }}
                    disabled={isSyncing}
                    className="flex items-center justify-between p-3 rounded-xl border bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 text-left font-bold transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <RefreshCw className={`w-4 h-4 text-cyan-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                      <div>
                        <div>Sync Real Football APIs</div>
                        <div className="text-[10px] text-slate-400 font-normal">Refresh Europa League, EPL & Champions League feeds</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>

                  {import.meta.env.DEV && onOpenSimulator && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenSimulator();
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border bg-slate-950/60 border-slate-800/80 text-amber-300 hover:bg-slate-800/50 text-left font-bold transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div>Match Simulator & Grader (Dev Mode)</div>
                          <div className="text-[10px] text-slate-400 font-normal">Simulate full-time results and auto-grade</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </button>
                  )}
                </div>
              </div>

              {/* Section 3: User Auth / Profile */}
              <div className="pt-2 border-t border-slate-800">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      <div>
                        <span className="font-bold text-white text-sm">{user?.username}</span>
                        <div className="text-[10px] text-slate-400">
                          Basic: {user?.basic_points} pts • Serious: {user?.serious_points} pts
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-bold transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In / Create Account</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
            className={`flex flex-col items-center justify-center py-1 transition-all relative select-none touch-manipulation active:scale-95 ${
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
            className={`flex flex-col items-center justify-center py-1 transition-all relative select-none touch-manipulation active:scale-95 ${
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
            className={`flex flex-col items-center justify-center py-1 transition-all relative select-none touch-manipulation active:scale-95 ${
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
            className={`flex flex-col items-center justify-center py-1 transition-all relative select-none touch-manipulation active:scale-95 ${
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
            className={`flex flex-col items-center justify-center py-1 transition-all relative select-none touch-manipulation active:scale-95 ${
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
