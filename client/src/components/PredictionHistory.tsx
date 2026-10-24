import React, { useState, useEffect } from 'react';
import { Prediction, SeriousSet } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  History,
  Shield,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const PredictionHistory: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'BASIC' | 'SERIOUS'>('BASIC');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [basicPredictions, setBasicPredictions] = useState<Prediction[]>([]);
  const [seriousSets, setSeriousSets] = useState<SeriousSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchHistory = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (activeSubTab === 'BASIC') {
        const res = await api.getMyPredictions('BASIC', statusFilter);
        setBasicPredictions(res.predictions);
      } else {
        const res = await api.getMySeriousSets();
        setSeriousSets(res.sets);
      }
    } catch (err) {
      console.error('Error fetching prediction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeSubTab, statusFilter, isAuthenticated]);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this prediction before kickoff?')) return;
    try {
      setCancellingId(id);
      await api.cancelPrediction(id);
      await fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel prediction');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
        <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Sign In to View Predictions</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
          Log in or play as a guest to see all your placed predictions, outcomes, and grading history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Filters Header */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Basic Mode vs Serious Mode tab */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('BASIC')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'BASIC'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Basic Predictions</span>
          </button>

          <button
            onClick={() => setActiveSubTab('SERIOUS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'SERIOUS'
                ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Serious Sets</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {['ALL', 'PENDING', 'CORRECT', 'INCORRECT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {st === 'ALL'
                ? 'All Statuses'
                : st === 'CORRECT'
                ? 'Won'
                : st === 'INCORRECT'
                ? 'Lost'
                : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Mode Predictions List */}
      {activeSubTab === 'BASIC' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-24 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : basicPredictions.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-900/30 border border-slate-800 rounded-3xl">
              <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">No Basic Predictions Found</h4>
              <p className="text-xs text-slate-400">
                You haven't placed any Basic Mode predictions matching this filter yet.
              </p>
            </div>
          ) : (
            basicPredictions.map((pred) => {
              const kickoffDate = new Date(pred.match_date);
              const isStarted = kickoffDate.getTime() <= Date.now();
              return (
                <div
                  key={pred.id}
                  className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">{pred.competition_name}</span>
                      <span>•</span>
                      <span>{kickoffDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {isStarted && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{pred.home_team_short || pred.home_team_name}</span>
                      {pred.match_status === 'FINISHED' ? (
                        <span className="px-2 py-0.5 bg-slate-950 rounded text-xs font-mono text-emerald-400 font-bold border border-slate-800">
                          {pred.home_score} - {pred.away_score}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">vs</span>
                      )}
                      <span>{pred.away_team_short || pred.away_team_name}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="text-slate-400">Your Prediction:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold font-mono text-[11px]">
                        {pred.market_type}: <strong className="text-emerald-400">{pred.selection}</strong>
                      </span>
                      {pred.actual_result && (
                        <span className="text-[11px] text-slate-400">
                          (Actual: {pred.actual_result})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & Points outcome */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div>
                      {pred.status === 'CORRECT' ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            WON (+{pred.points_awarded} pts)
                          </span>
                        </div>
                      ) : pred.status === 'INCORRECT' ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-red-500/20 text-red-400 border border-red-500/30">
                            <XCircle className="w-3.5 h-3.5" />
                            LOST (0 pts penalty)
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            PENDING (+{pred.odds_points} pts potential)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cancel button if match has not started */}
                    {pred.status === 'PENDING' && !isStarted && (
                      <button
                        onClick={() => handleCancel(pred.id)}
                        disabled={cancellingId === pred.id}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Cancel prediction before kickoff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Serious Mode Sets List */}
      {activeSubTab === 'SERIOUS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-32 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : seriousSets.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-900/30 border border-slate-800 rounded-3xl">
              <Flame className="w-10 h-10 text-amber-500/50 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">No Serious Sets Found</h4>
              <p className="text-xs text-slate-400">
                You haven't created any Serious Mode sets yet. Switch to Serious Mode in the header to bundle predictions!
              </p>
            </div>
          ) : (
            seriousSets.map((set) => {
              const isWon = set.status === 'WON';
              const isLost = set.status === 'LOST';
              const isPending = set.status === 'PENDING';

              return (
                <div
                  key={set.id}
                  className={`bg-slate-900/90 rounded-2xl border p-4 sm:p-5 shadow-lg transition-all ${
                    isWon
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : isLost
                      ? 'border-red-500/40 bg-red-950/10'
                      : 'border-amber-500/30'
                  }`}
                >
                  {/* Set Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{set.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {set.total_predictions} picks set • Placed {new Date(set.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Result Badge */}
                    <div>
                      {isWon ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-4 h-4" />
                          SET WON! (+{set.points_delta} pts)
                        </span>
                      ) : isLost ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
                          <XCircle className="w-4 h-4" />
                          SET FAILED (-10 pts penalty)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock className="w-4 h-4" />
                          PENDING (+{set.potential_points} pts / -10 risk)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nested Picks in this Set */}
                  <div className="mt-3 space-y-2">
                    {set.predictions?.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs"
                      >
                        <div className="truncate mr-2">
                          <span className="font-bold text-slate-200">
                            {p.home_team_short || p.home_team_name} vs {p.away_team_short || p.away_team_name}
                          </span>
                          <span className="text-slate-500 mx-1.5">•</span>
                          <span className="text-slate-400">
                            {p.market_type}: <strong className="text-amber-400 font-mono">{p.selection}</strong>
                          </span>
                        </div>

                        <div>
                          {p.status === 'CORRECT' ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Correct
                            </span>
                          ) : p.status === 'INCORRECT' ? (
                            <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                              <XCircle className="w-3 h-3" /> Missed
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[11px]">
                              Pending (+{p.odds_points} pts)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
