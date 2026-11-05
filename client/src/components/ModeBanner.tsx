import React from 'react';
import { useGameMode } from '../context/GameModeContext';
import { useAuth } from '../context/AuthContext';
import { Shield, Flame, AlertTriangle, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export const ModeBanner: React.FC = () => {
  const { mode, setMode, stagedPredictions } = useGameMode();
  const { user } = useAuth();

  return (
    <div className="w-full relative z-10 transition-all duration-300">
      {mode === 'BASIC' ? (
        /* ================= BASIC MODE: CALM & RISK-FREE ================= */
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-emerald-950/70 border-y border-emerald-500/30 py-2.5 sm:py-3 px-3 sm:px-4 shadow-md backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shadow-sm shrink-0 mt-0.5 sm:mt-0">
                <Shield className="w-4 h-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                    Basic Mode Active
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm">Safe & Risk-Free Mode</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    10 Picks/Day Limit
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5 hidden xs:block">
                  Make predictions with a <strong className="text-emerald-300">limit of 10 selections per day</strong> (resets daily at 00:00 UTC). <strong className="text-emerald-300 underline decoration-emerald-500/60">Zero point penalties</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0">
              {user && (
                <>
                  {/* Mobile Stats Grid */}
                  <div className="grid grid-cols-3 gap-1.5 w-full md:hidden bg-slate-950/90 p-2 rounded-xl border border-emerald-500/30 text-center shadow-inner">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400">Bankroll</span>
                      <strong className="text-emerald-400 font-mono text-xs font-bold">{user.basic_points} pts</strong>
                    </div>
                    <div className="flex flex-col border-x border-slate-800">
                      <span className="text-[10px] text-slate-400">Picks Today</span>
                      <strong
                        className={`font-mono text-xs font-bold ${
                          (user.basic_daily_count ?? user.basic_pending_count ?? 0) >= 10
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {(user.basic_daily_count ?? user.basic_pending_count ?? 0)}/10
                      </strong>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400">Streak</span>
                      <strong className="text-emerald-400 font-mono text-xs font-bold">{user.basic_streak} 🔥</strong>
                    </div>
                  </div>

                  {/* Desktop Inline Pill */}
                  <div className="hidden md:flex items-center gap-2.5 text-slate-300 font-semibold bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 shadow-inner">
                    <span className="text-slate-400 text-[11px]">Basic Bankroll:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{user.basic_points} pts</strong>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 text-[11px]">Today's Picks:</span>
                    <strong
                      className={`font-mono text-sm ${
                        (user.basic_daily_count ?? user.basic_pending_count ?? 0) >= 10
                          ? 'text-amber-400 font-black'
                          : 'text-emerald-400'
                      }`}
                    >
                      {(user.basic_daily_count ?? user.basic_pending_count ?? 0)}/10 Today
                    </strong>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 text-[11px]">Streak:</span>
                    <strong className="text-emerald-400 font-mono">{user.basic_streak} 🔥</strong>
                  </div>
                </>
              )}

              <button
                onClick={() => setMode('SERIOUS')}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-red-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all min-h-[38px] sm:min-h-0"
                title="Switch to Serious Mode"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Try Serious Mode</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SERIOUS MODE: REFINED HIGH-STAKES HUD ================= */
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/30 border-y border-rose-900/40 py-2.5 sm:py-3.5 px-3 sm:px-4 shadow-lg shadow-rose-950/20 backdrop-blur-md relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs relative z-10">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
              <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-950/60 text-rose-300 font-bold border border-rose-800/50 shadow-sm shrink-0 mt-0.5 sm:mt-0">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-rose-700 text-white font-bold text-[10px] tracking-wider uppercase shadow-sm flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Serious Mode
                  </span>
                  <span className="font-bold text-white text-xs sm:text-base tracking-wide">
                    HIGH-STAKES ACCUMULATOR <span className="text-rose-400 font-mono">(-10 PTS PENALTY)</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-300 font-medium hidden xs:flex">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    Predictions are grouped into <strong>Sets</strong> (<strong>Make as many selections as you want!</strong>). <strong className="text-rose-300 underline decoration-rose-500/60 font-bold">If ANY pick fails, 10 points are deducted once</strong>.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0">
              {user && (
                <>
                  {/* Mobile Stats Grid */}
                  <div className="grid grid-cols-2 gap-1.5 w-full md:hidden bg-slate-950/90 p-2 rounded-xl border border-rose-900/40 text-center shadow-inner">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Bankroll</span>
                      <strong className="text-rose-300 font-mono text-sm font-bold">{user.serious_points} pts</strong>
                    </div>
                    <div className="flex flex-col border-l border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Streak</span>
                      <strong className="text-rose-400 font-mono text-sm font-bold">{user.serious_streak} ⚡</strong>
                    </div>
                  </div>

                  {/* Desktop Inline Pill */}
                  <div className="hidden md:flex items-center gap-2.5 text-slate-300 font-semibold bg-slate-950/80 px-4 py-2 rounded-xl border border-rose-900/40 shadow-inner">
                    <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Serious Bankroll:</span>
                    <strong className="text-rose-300 font-mono text-base font-bold">{user.serious_points} pts</strong>
                    <span className="text-slate-700">•</span>
                    <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Streak:</span>
                    <strong className="text-rose-400 font-mono text-sm font-bold">{user.serious_streak} ⚡</strong>
                  </div>
                </>
              )}

              {stagedPredictions.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/40 text-xs font-bold">
                  <span>In Set Builder:</span>
                  <strong className="px-1.5 py-0.2 rounded-full bg-rose-700 text-white font-black">
                    {stagedPredictions.length}
                  </strong>
                </div>
              )}

              <button
                onClick={() => setMode('BASIC')}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-white text-xs font-semibold transition-all min-h-[38px] sm:min-h-0"
                title="Switch back to Basic Mode (Zero Penalty)"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Switch to Basic (Safe)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
