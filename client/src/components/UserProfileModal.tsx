import React, { useState, useEffect } from 'react';
import { UserProfileData, Prediction, SeriousSet } from '../types';
import { api } from '../services/api';
import { useGameMode } from '../context/GameModeContext';
import {
  X,
  Trophy,
  Shield,
  ShieldCheck,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Percent,
  Layers,
  Award,
  Calendar,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';

interface UserProfileModalProps {
  userId: number | null;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const { mode } = useGameMode();
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'ALL' | 'BASIC' | 'SERIOUS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT'>('ALL');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    api.getUserProfile(userId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Failed to load user profile:', err);
        setError(err.message || 'Failed to load user past predictions');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  if (!userId) return null;

  const filteredPredictions = (data?.predictions || []).filter((p) => {
    if (activeTab === 'BASIC' && p.mode !== 'BASIC') return false;
    if (activeTab === 'SERIOUS' && p.mode !== 'SERIOUS') return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  const filteredSeriousSets = (data?.seriousSets || []).filter((s) => {
    if (statusFilter === 'CORRECT' && s.status !== 'WON') return false;
    if (statusFilter === 'INCORRECT' && s.status !== 'LOST') return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div
        className={`relative w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col border transition-all duration-300 ${
          mode === 'SERIOUS'
            ? 'bg-[#150707] border-red-900/60 shadow-red-950/60'
            : 'bg-slate-900 border-slate-800 shadow-slate-950/50'
        }`}
      >
        {/* Top Header */}
        <div
          className={`shrink-0 flex items-center justify-between p-3.5 sm:p-5 border-b transition-colors ${
            mode === 'SERIOUS'
              ? 'bg-gradient-to-r from-red-950/90 via-[#1c0808] to-amber-950/80 border-red-900/50'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shadow-md shrink-0 ${
                mode === 'SERIOUS'
                  ? 'bg-gradient-to-br from-amber-500 to-red-600 text-white shadow-red-500/30'
                  : 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {data?.user?.username?.slice(0, 1).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white">
                  {data?.user?.username || 'User Profile'}
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold hidden sm:inline">
                  #{data?.user?.id || userId}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Community Track Record
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

        {loading ? (
          <div className="p-8 space-y-4 flex-1 overflow-y-auto">
            <div className="h-24 rounded-2xl bg-slate-800/40 animate-pulse" />
            <div className="h-48 rounded-2xl bg-slate-800/40 animate-pulse" />
          </div>
        ) : error || !data ? (
          <div className="p-8 text-center space-y-3 flex-1 overflow-y-auto">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Could Not Load Predictions</h4>
            <p className="text-xs text-slate-400">{error || 'User not found.'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain pb-safe">
            {/* User Stats Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Basic Points & Streak */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Basic Mode</span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {data.user.basic_points} <span className="text-xs text-emerald-400 font-sans">pts</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>Streak:</span>
                  <strong className="text-emerald-400 font-mono">{data.user.basic_streak} 🔥</strong>
                  <span>(Best: {data.user.basic_best_streak})</span>
                </div>
              </div>

              {/* Serious Points & Streak */}
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Serious Mode</span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {data.user.serious_points} <span className="text-xs text-amber-400 font-sans">pts</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>Streak:</span>
                  <strong className="text-amber-400 font-mono">{data.user.serious_streak} ⚡</strong>
                  <span>(Best: {data.user.serious_best_streak})</span>
                </div>
              </div>

              {/* Win Rate */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold mb-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Win Rate</span>
                </div>
                <div className="text-xl font-black text-cyan-300 font-mono">
                  {data.stats.winRate}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  <span className="text-emerald-400 font-bold">{data.stats.correctCount} won</span> •{' '}
                  <span className="text-red-400 font-bold">{data.stats.incorrectCount} lost</span>
                </div>
              </div>

              {/* Serious Sets Record */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Serious Sets</span>
                </div>
                <div className="text-xl font-black text-purple-300 font-mono">
                  {data.stats.totalSets} <span className="text-xs text-slate-400 font-sans">sets</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  <span className="text-emerald-400 font-bold">{data.stats.wonSets} won</span> •{' '}
                  <span className="text-red-400 font-bold">{data.stats.lostSets} failed</span>
                </div>
              </div>
            </div>

            {/* Sub-Tabs: All / Basic / Serious Sets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'ALL'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Past Picks ({data.predictions.length})
                </button>
                <button
                  onClick={() => setActiveTab('BASIC')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'BASIC'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Basic Mode ({data.predictions.filter((p) => p.mode === 'BASIC').length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('SERIOUS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'SERIOUS'
                      ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  <span>Serious Sets ({data.seriousSets.length})</span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto no-scrollbar">
                {[
                  { id: 'ALL', label: 'All Outcomes' },
                  { id: 'CORRECT', label: '✓ Won' },
                  { id: 'INCORRECT', label: '✕ Lost' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      statusFilter === st.id
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Serious Sets View */}
            {activeTab === 'SERIOUS' ? (
              <div className="space-y-3">
                {filteredSeriousSets.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <Flame className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <h5 className="text-xs font-bold text-white">No Serious Sets Found</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This user has not placed any Serious Sets matching the current filter.
                    </p>
                  </div>
                ) : (
                  filteredSeriousSets.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                            🔥
                          </span>
                          <div>
                            <h5 className="text-xs font-black text-white">{s.name}</h5>
                            <span className="text-[10px] text-slate-400">
                              {s.predictions.length} picks in set • {new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div>
                          {s.status === 'WON' ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              ✓ SET WON (+{s.points_delta} pts)
                            </span>
                          ) : s.status === 'LOST' ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
                              ✕ FAILED ({s.points_delta} pts penalty)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              ⏳ PENDING (+{s.potential_points} pts potential)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nested predictions inside the set */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                        {s.predictions.map((p, idx) => (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <div className="font-bold text-white truncate flex items-center gap-1.5">
                                <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">#{idx + 1}</span>
                                <span>{p.home_team_short || p.home_team_name} vs {p.away_team_short || p.away_team_name}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {p.market_type}: <strong className="text-amber-400 font-mono">{p.selection}</strong>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {p.status === 'CORRECT' ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Won
                                </span>
                              ) : p.status === 'INCORRECT' ? (
                                <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" /> Missed
                                </span>
                              ) : (
                                <span className="text-cyan-400 font-bold flex items-center gap-1 text-[11px]">
                                  <Clock className="w-3.5 h-3.5" /> Pending
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono block">+{p.odds_points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Predictions List View */
              <div className="space-y-2.5">
                {filteredPredictions.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <h5 className="text-xs font-bold text-white">No Predictions Found</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No predictions match the selected filters.
                    </p>
                  </div>
                ) : (
                  filteredPredictions.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left: Match & Teams */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                              p.mode === 'SERIOUS'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {p.mode}
                          </span>
                          <span className="text-slate-400 font-semibold">{p.competition_name}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500">
                            {new Date(p.match_date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {p.home_team_short || p.home_team_name}
                          </span>
                          <span className="text-xs font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {p.home_score !== null && p.away_score !== null
                              ? `${p.home_score} - ${p.away_score}`
                              : 'VS'}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {p.away_team_short || p.away_team_name}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Market & Selection */}
                      <div className="flex flex-col sm:items-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          Market: {p.market_type}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-300">Predicted:</span>
                          <strong className="text-xs font-mono font-black text-amber-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                            {p.selection}
                          </strong>
                        </div>
                        {p.actual_result && (
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Actual: {p.actual_result}
                          </span>
                        )}
                      </div>

                      {/* Right: Status & Points */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center shrink-0">
                        <div>
                          {p.status === 'CORRECT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>WON (+{p.points_awarded} pts)</span>
                            </span>
                          ) : p.status === 'INCORRECT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>MISSED (0 pts)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              <Clock className="w-3.5 h-3.5" />
                              <span>PENDING (+{p.odds_points} pts)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
