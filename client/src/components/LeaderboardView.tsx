import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Trophy, Shield, Flame, Medal, Award, FlameKindling } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'BASIC' | 'SERIOUS'>('BASIC');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.getLeaderboard(activeMode);
        setLeaderboard(res.leaderboard);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeMode]);

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaders = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      {/* Mode Switcher Header */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Community Leaderboards</span>
          </h2>
          <p className="text-xs text-slate-400">
            Completely independent rankings for Basic Mode and Serious Mode.
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveMode('BASIC')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'BASIC'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Basic Mode Podium</span>
          </button>

          <button
            onClick={() => setActiveMode('SERIOUS')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'SERIOUS'
                ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Serious Mode Podium</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="order-2 sm:order-1 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 rounded-2xl p-5 text-center flex flex-col items-center justify-end relative shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-bold text-slate-300 text-lg mb-2 shadow-inner">
                    🥈
                  </div>
                  <span className="text-xs font-bold text-slate-400">#2 Place</span>
                  <h4 className="text-sm font-black text-white mt-1">{topThree[1].username}</h4>
                  <div className="text-xl font-black text-slate-200 font-mono mt-1">
                    {activeMode === 'BASIC' ? topThree[1].basic_points : topThree[1].serious_points}{' '}
                    <span className="text-xs text-slate-400 font-sans font-medium">pts</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    Best Streak:{' '}
                    <strong className="text-slate-200">
                      {activeMode === 'BASIC' ? topThree[1].basic_best_streak : topThree[1].serious_best_streak}
                    </strong>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold Champion) */}
              {topThree[0] && (
                <div className="order-1 sm:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-2xl p-6 text-center flex flex-col items-center justify-end relative shadow-xl shadow-amber-950/20 sm:-translate-y-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-300 flex items-center justify-center font-bold text-slate-950 text-2xl mb-2 shadow-lg shadow-amber-500/40">
                    👑
                  </div>
                  <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                    Champion #1
                  </span>
                  <h4 className="text-base font-black text-white mt-1">{topThree[0].username}</h4>
                  <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                    {activeMode === 'BASIC' ? topThree[0].basic_points : topThree[0].serious_points}{' '}
                    <span className="text-xs text-slate-400 font-sans font-medium">pts</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-2 flex items-center gap-1.5 font-semibold">
                    <span>🔥 Current Streak:</span>
                    <strong className="text-amber-400">
                      {activeMode === 'BASIC' ? topThree[0].basic_streak : topThree[0].serious_streak}
                    </strong>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="order-3 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-900/60 rounded-2xl p-5 text-center flex flex-col items-center justify-end relative shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-amber-600 text-lg mb-2 shadow-inner">
                    🥉
                  </div>
                  <span className="text-xs font-bold text-slate-400">#3 Place</span>
                  <h4 className="text-sm font-black text-white mt-1">{topThree[2].username}</h4>
                  <div className="text-xl font-black text-slate-200 font-mono mt-1">
                    {activeMode === 'BASIC' ? topThree[2].basic_points : topThree[2].serious_points}{' '}
                    <span className="text-xs text-slate-400 font-sans font-medium">pts</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    Best Streak:{' '}
                    <strong className="text-slate-200">
                      {activeMode === 'BASIC' ? topThree[2].basic_best_streak : topThree[2].serious_best_streak}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-6">
                <span className="w-8 text-center">Rank</span>
                <span>User</span>
              </div>
              <div className="flex items-center gap-6 sm:gap-12">
                <span className="hidden sm:inline">Win Streak</span>
                <span className="hidden sm:inline">
                  {activeMode === 'BASIC' ? 'Correct Picks' : 'Sets Won / Lost'}
                </span>
                <span className="w-20 text-right">Points</span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {leaderboard.map((user) => {
                const points = activeMode === 'BASIC' ? user.basic_points : user.serious_points;
                const streak = activeMode === 'BASIC' ? user.basic_streak : user.serious_streak;
                const bestStreak =
                  activeMode === 'BASIC' ? user.basic_best_streak : user.serious_best_streak;

                return (
                  <div
                    key={user.id}
                    className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          user.rank === 1
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black'
                            : user.rank === 2
                            ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40 font-black'
                            : user.rank === 3
                            ? 'bg-amber-800/20 text-amber-600 border border-amber-800/40 font-black'
                            : 'text-slate-400 bg-slate-950'
                        }`}
                      >
                        {user.rank}
                      </span>
                      <div>
                        <div className="font-bold text-white text-sm">{user.username}</div>
                        <div className="text-[10px] text-slate-400 sm:hidden">
                          Streak: {streak} 🔥 • Best: {bestStreak}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:gap-12">
                      <div className="hidden sm:flex items-center gap-2 text-slate-300 font-medium">
                        <span>{streak} 🔥</span>
                        <span className="text-[11px] text-slate-400">(Best: {bestStreak})</span>
                      </div>

                      <div className="hidden sm:block text-slate-400 font-medium">
                        {activeMode === 'BASIC' ? (
                          <span className="text-emerald-400 font-bold">
                            {user.correct_count} correct
                          </span>
                        ) : (
                          <span>
                            <strong className="text-emerald-400">{user.won_sets} won</strong> /{' '}
                            <strong className="text-red-400">{user.lost_sets} lost</strong>
                          </span>
                        )}
                      </div>

                      <div className="w-20 text-right">
                        <span
                          className={`font-mono font-black text-sm ${
                            activeMode === 'BASIC' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {points}
                        </span>
                        <span className="text-[10px] text-slate-400 block">pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
