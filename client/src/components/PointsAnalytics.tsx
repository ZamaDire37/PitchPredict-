import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PointsHistoryEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Shield,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
} from 'lucide-react';

export const PointsAnalytics: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [ledger, setLedger] = useState<PointsHistoryEntry[]>([]);
  const [progression, setProgression] = useState<{
    basicProgression: PointsHistoryEntry[];
    seriousProgression: PointsHistoryEntry[];
  }>({ basicProgression: [], seriousProgression: [] });
  const [stats, setStats] = useState<any>(null);
  const [modeFilter, setModeFilter] = useState<'ALL' | 'BASIC' | 'SERIOUS'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [ledgerRes, progRes, statsRes] = await Promise.all([
          api.getPointsLedger(undefined, 100),
          api.getProgression(),
          api.getStats(),
        ]);
        setLedger(ledgerRes.history);
        setProgression(progRes);
        setStats(statsRes);
      } catch (err) {
        console.error('Error loading points analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Sign In for Points Analytics</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Log in or play as a guest to inspect your points progression curves and full points ledger.
        </p>
      </div>
    );
  }

  // Combine progression data for the dual-mode chart
  // Basic Mode and Serious Mode points are tracked on separate lines to highlight their complete independence
  const chartData: any[] = [];
  const maxLen = Math.max(progression.basicProgression.length, progression.seriousProgression.length);

  for (let i = 0; i < maxLen; i++) {
    const basicItem = progression.basicProgression[i];
    const seriousItem = progression.seriousProgression[i];

    chartData.push({
      step: `Event ${i + 1}`,
      date: (basicItem || seriousItem)?.created_at
        ? new Date((basicItem || seriousItem).created_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          })
        : '',
      basicPoints: basicItem ? basicItem.balance_after : undefined,
      seriousPoints: seriousItem ? seriousItem.balance_after : undefined,
    });
  }

  const filteredLedger = ledger.filter((entry) => {
    if (modeFilter === 'ALL') return true;
    return entry.mode === modeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Stat Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Mode Stat Card */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Shield className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Basic Mode Summary</h3>
                <p className="text-[11px] text-emerald-400">Risk-Free Market Predictions</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {user?.basic_points ?? 100}
              </span>
              <span className="text-xs text-slate-400 block">Current Balance</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
            <div className="p-2 rounded-xl bg-slate-950/50">
              <span className="text-xs text-slate-400 block">Streak</span>
              <span className="text-sm font-bold text-emerald-300">
                {user?.basic_streak ?? 0} 🔥
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/50">
              <span className="text-xs text-slate-400 block">Best Streak</span>
              <span className="text-sm font-bold text-slate-200">
                {user?.basic_best_streak ?? 0}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/50">
              <span className="text-xs text-slate-400 block">Win Rate</span>
              <span className="text-sm font-bold text-slate-200">
                {stats?.basic?.winRate ?? 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Serious Mode Stat Card */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-red-950/30 border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Flame className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Serious Mode Summary</h3>
                <p className="text-[11px] text-amber-400">Set-Based Multi (-10 pts penalty)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {user?.serious_points ?? 100}
              </span>
              <span className="text-xs text-slate-400 block">Current Balance</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
            <div className="p-2 rounded-xl bg-slate-950/50">
              <span className="text-xs text-slate-400 block">Streak</span>
              <span className="text-sm font-bold text-amber-300">
                {user?.serious_streak ?? 0} ⚡
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/50">
              <span className="text-xs text-slate-400 block">Sets Won</span>
              <span className="text-sm font-bold text-emerald-400">
                {stats?.serious?.wonSets ?? 0}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/50">
              <span className="text-xs text-slate-400 block">Sets Lost (-10)</span>
              <span className="text-sm font-bold text-red-400">
                {stats?.serious?.lostSets ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Points Over Time Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Points Progression Over Time</span>
            </h3>
            <p className="text-xs text-slate-400">
              Separate trajectories for Basic Mode (green) vs Serious Mode (amber). Points never transfer.
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="step" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['dataMin - 10', 'dataMax + 20']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="basicPoints"
                  name="Basic Mode Points"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="seriousPoints"
                  name="Serious Mode Points"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f59e0b' }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              No points progression data available yet. Start making predictions!
            </div>
          )}
        </div>
      </div>

      {/* Points History Ledger Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Points Transaction Ledger</span>
            </h3>
            <p className="text-xs text-slate-400">
              Complete historical record of every point earned, deducted, or awarded.
            </p>
          </div>

          {/* Mode Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'BASIC', 'SERIOUS'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  modeFilter === m
                    ? m === 'BASIC'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : m === 'SERIOUS'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'ALL' ? 'All Modes' : m === 'BASIC' ? 'Basic Only' : 'Serious Only'}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
          {filteredLedger.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No points history records found.
            </div>
          ) : (
            filteredLedger.map((entry) => {
              const isPositive = entry.delta > 0;
              const isNegative = entry.delta < 0;
              return (
                <div
                  key={entry.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isPositive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isNegative
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : isNegative ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </span>

                    <div>
                      <div className="font-semibold text-slate-200">{entry.reason}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            entry.mode === 'BASIC'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {entry.mode}
                        </span>
                        <span>•</span>
                        <span>{new Date(entry.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                    <div className="text-right">
                      <span
                        className={`font-mono font-black text-sm ${
                          isPositive
                            ? 'text-emerald-400'
                            : isNegative
                            ? 'text-red-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isPositive ? `+${entry.delta}` : entry.delta} pts
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Balance: {entry.balance_after} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
