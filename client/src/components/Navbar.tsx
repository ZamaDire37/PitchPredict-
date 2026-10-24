import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useGameMode } from '../context/GameModeContext';
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
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenRules: () => void;
  onOpenSimulator: () => void;
  onSyncApi: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenRules,
  onOpenSimulator,
  onSyncApi,
  isSyncing,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, setMode, stagedPredictions } = useGameMode();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('matches')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  PITCH<span className="text-emerald-400">PREDICT</span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  REAL FIXTURES
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Real Football Match Predictions</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setMode('BASIC')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                mode === 'BASIC'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Basic Mode</span>
            </button>
            <button
              onClick={() => setMode('SERIOUS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 relative ${
                mode === 'SERIOUS'
                  ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-md shadow-amber-500/30 font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Serious Mode</span>
              {stagedPredictions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-slate-950 font-bold">
                  {stagedPredictions.length}
                </span>
              )}
            </button>
          </div>

          {/* User Points Balances & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && user && (
              <div className="hidden md:flex items-center gap-2">
                {/* Basic Points Pill */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${
                    mode === 'BASIC'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 opacity-70'
                  }`}
                  title="Basic Mode Points (Risk Free)"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{user.basic_points} pts</span>
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

            {/* Test Match Simulator button */}
            <button
              onClick={onOpenSimulator}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition-colors"
              title="Match Simulator & Test Grader"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Sync Live Matches */}
            <button
              onClick={onSyncApi}
              disabled={isSyncing}
              className={`p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-colors ${
                isSyncing ? 'animate-spin' : ''
              }`}
              title="Sync Real Football Fixtures & Scores"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Info / Rules */}
            <button
              onClick={onOpenRules}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="Game Rules & Mechanics"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-xs font-medium text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {user?.username}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Play / Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 sm:space-x-4 border-t border-slate-800/80 py-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'matches'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Fixtures & Matches</span>
          </button>

          <button
            onClick={() => setActiveTab('markets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'markets'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Prediction Markets</span>
          </button>

          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'predictions'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>My Predictions</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>Points Ledger & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboards</span>
          </button>
        </div>
      </div>
    </header>
  );
};
