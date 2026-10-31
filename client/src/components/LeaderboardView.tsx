import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Shield,
  Flame,
  Medal,
  Award,
  Target,
  Zap,
  Sparkles,
  Star,
  Eye,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  FlameKindling,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';

export type LeaderboardSection = 'points' | 'streak' | 'accuracy' | 'wins';

interface LeaderboardViewProps {
  onOpenAuth?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onOpenAuth }) => {
  const { isAuthenticated } = useAuth();
  const [activeMode, setActiveMode] = useState<'BASIC' | 'SERIOUS'>('BASIC');
  const [activeSection, setActiveSection] = useState<LeaderboardSection>('points');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [spotlights, setSpotlights] = useState<{
    topPoints?: any;
    hottestStreak?: any;
    bestStreakRecord?: any;
    highestAccuracy?: any;
    mostWins?: any;
  }>({});
  const [hotStreakers, setHotStreakers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.getLeaderboard(activeMode, activeSection);
        setLeaderboard(res.leaderboard || []);
        setSpotlights(res.spotlights || {});
        setHotStreakers(res.hotStreakers || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeMode, activeSection]);

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaders = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      {/* ================= HEADER & MODE SWITCHER ================= */}
      <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Community Leaderboards & Streaks
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse overall point leaders, hottest active win streaks, sniper accuracy, and top grinders.
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveMode('BASIC')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'BASIC'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Basic Mode</span>
          </button>

          <button
            onClick={() => setActiveMode('SERIOUS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'SERIOUS'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white shadow-md shadow-red-500/30 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Serious Mode</span>
          </button>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Viewing Leaderboard as Guest</p>
              <p className="text-[11px] text-slate-400">
                You can browse top rankings, win streaks, and sniper accuracy across the community. Sign in or register to join the leaderboard and track your personal rank!
              </p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md active:scale-95"
            >
              Sign In / Register
            </button>
          )}
        </div>
      )}

      {/* ================= HALL OF FAME SPOTLIGHT CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Spotlight 1: Points Titan */}
        <div
          onClick={() => spotlights.topPoints && setSelectedUserId(spotlights.topPoints.id)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all shadow-md group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Points Titan</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
              #1 Bankroll
            </span>
          </div>
          <div className="text-sm font-black text-white truncate group-hover:text-amber-300 transition-colors">
            {spotlights.topPoints ? spotlights.topPoints.username : '---'}
          </div>
          <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
            {spotlights.topPoints ? spotlights.topPoints.points : 0}{' '}
            <span className="text-[10px] font-sans text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Streak: {spotlights.topPoints?.streak || 0} 🔥</span>
            <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
              <span>View</span>
              <Eye className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Spotlight 2: Hottest Streak on Fire */}
        <div
          onClick={() => spotlights.hottestStreak && setSelectedUserId(spotlights.hottestStreak.id)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border border-red-500/40 hover:border-red-400 cursor-pointer transition-all shadow-md group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-red-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Hottest Streak</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold animate-pulse">
              On Fire 🔥
            </span>
          </div>
          <div className="text-sm font-black text-white truncate group-hover:text-red-300 transition-colors">
            {spotlights.hottestStreak ? spotlights.hottestStreak.username : '---'}
          </div>
          <div className="text-xl font-black text-red-400 font-mono mt-0.5 flex items-center gap-1.5">
            <span>{spotlights.hottestStreak ? spotlights.hottestStreak.streak : 0} Wins</span>
            <span className="text-xs">🔥</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Best: {spotlights.hottestStreak?.best_streak || 0}</span>
            <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
              <span>View</span>
              <Eye className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Spotlight 3: All-Time Streak Record */}
        <div
          onClick={() => spotlights.bestStreakRecord && setSelectedUserId(spotlights.bestStreakRecord.id)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 hover:border-purple-400 cursor-pointer transition-all shadow-md group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-purple-400" />
              <span>Record Streak</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
              All-Time Peak
            </span>
          </div>
          <div className="text-sm font-black text-white truncate group-hover:text-purple-300 transition-colors">
            {spotlights.bestStreakRecord ? spotlights.bestStreakRecord.username : '---'}
          </div>
          <div className="text-xl font-black text-purple-400 font-mono mt-0.5 flex items-center gap-1.5">
            <span>{spotlights.bestStreakRecord ? spotlights.bestStreakRecord.best_streak : 0} Run</span>
            <span className="text-xs">🌟</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Points: {spotlights.bestStreakRecord?.points || 0} pts</span>
            <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
              <span>View</span>
              <Eye className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Spotlight 4: Accuracy Sniper */}
        <div
          onClick={() => spotlights.highestAccuracy && setSelectedUserId(spotlights.highestAccuracy.id)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 hover:border-emerald-400 cursor-pointer transition-all shadow-md group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Accuracy</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              Precision
            </span>
          </div>
          <div className="text-sm font-black text-white truncate group-hover:text-emerald-300 transition-colors">
            {spotlights.highestAccuracy ? spotlights.highestAccuracy.username : '---'}
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
            {spotlights.highestAccuracy ? spotlights.highestAccuracy.accuracy : 0}%{' '}
            <span className="text-[10px] font-sans text-slate-400 font-normal">win rate</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>
              {activeMode === 'BASIC'
                ? `${spotlights.highestAccuracy?.correct_count || 0} wins`
                : `${spotlights.highestAccuracy?.won_sets || 0} sets won`}
            </span>
            <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
              <span>View</span>
              <Eye className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ================= DEDICATED HOTTEST STREAKS SHOWCASE SECTION ================= */}
      {hotStreakers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/40 border border-red-500/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40">
                <Flame className="w-4 h-4 text-red-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Hottest Streaks on PitchPredict</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-black uppercase bg-red-500 text-slate-950">
                    Live Form 🔥
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Predictors currently riding consecutive win streaks in {activeMode === 'BASIC' ? 'Basic' : 'Serious'} Mode
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSection('streak')}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all self-start sm:self-auto flex items-center gap-1.5 ${
                activeSection === 'streak'
                  ? 'bg-red-500 text-slate-950 border-red-400 font-black'
                  : 'bg-slate-950 text-red-300 border-red-500/30 hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>View Streak Rankings</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {hotStreakers.map((user, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-center cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden ${
                    isFirst
                      ? 'bg-gradient-to-b from-red-950/70 to-slate-950 border-red-500 shadow-lg shadow-red-950/40 ring-1 ring-red-500/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-red-500/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-xs font-black text-red-400">#{idx + 1}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold">
                      {user.streak_tier}
                    </span>
                  </div>

                  <h5 className="font-black text-white text-xs truncate group-hover:text-red-300 transition-colors">
                    {user.username}
                  </h5>

                  <div className="text-sm sm:text-base font-black text-amber-400 font-mono mt-1 flex items-center justify-center gap-1">
                    <span>{user.streak} run</span>
                    <span>🔥</span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                    <span>Pk: {user.best_streak}</span>
                    <span className="text-emerald-400 font-bold">{user.points} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= LEADERBOARD SECTIONS TABS ================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Rankings Section:
            </span>
            <span className="text-xs text-white font-bold">
              {activeSection === 'points' && '🏆 Overall Points Bankroll'}
              {activeSection === 'streak' && '🔥 Hottest Winning Streaks'}
              {activeSection === 'accuracy' && '🎯 Highest Prediction Accuracy'}
              {activeSection === 'wins' && '⚡ Most Total Wins'}
            </span>
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSection('points')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSection === 'points'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Most Points</span>
            </button>

            <button
              onClick={() => setActiveSection('streak')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSection === 'streak'
                  ? 'bg-red-500 text-slate-950 shadow-md shadow-red-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hottest Streak</span>
            </button>

            <button
              onClick={() => setActiveSection('accuracy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSection === 'accuracy'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Highest Accuracy</span>
            </button>

            <button
              onClick={() => setActiveSection('wins')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSection === 'wins'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Most Wins</span>
            </button>
          </div>
        </div>

        {/* ================= TOP 3 PODIUM (SECTION-AWARE) ================= */}
        {loading ? (
          <div className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
        ) : (
          <>
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div
                    onClick={() => setSelectedUserId(topThree[1].id)}
                    className="order-2 sm:order-1 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 hover:border-slate-400 rounded-2xl p-5 text-center flex flex-col items-center justify-end relative shadow-lg cursor-pointer hover:-translate-y-1 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-bold text-slate-300 text-lg mb-2 shadow-inner group-hover:scale-110 transition-transform">
                      🥈
                    </div>
                    <span className="text-xs font-bold text-slate-400">#2 Rank</span>
                    <h4 className="text-sm font-black text-white mt-1 group-hover:text-slate-200 transition-colors">
                      {topThree[1].username}
                    </h4>

                    {/* Section primary metric */}
                    {activeSection === 'streak' ? (
                      <div className="text-2xl font-black text-red-400 font-mono mt-1">
                        {topThree[1].streak} 🔥{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">wins run</span>
                      </div>
                    ) : activeSection === 'accuracy' ? (
                      <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                        {topThree[1].accuracy}%{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">win rate</span>
                      </div>
                    ) : activeSection === 'wins' ? (
                      <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                        {activeMode === 'BASIC' ? topThree[1].correct_count : topThree[1].won_sets}{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">wins</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-slate-200 font-mono mt-1">
                        {topThree[1].points}{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">pts</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 mt-2">
                      Streak: <strong className="text-slate-200">{topThree[1].streak} 🔥</strong> • Peak:{' '}
                      <strong className="text-slate-200">{topThree[1].best_streak}</strong>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserId(topThree[1].id);
                      }}
                      className="mt-3 px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <span>View Predictions</span>
                    </button>
                  </div>
                )}

                {/* 1st Place Champion */}
                {topThree[0] && (
                  <div
                    onClick={() => setSelectedUserId(topThree[0].id)}
                    className="order-1 sm:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/60 hover:border-amber-400 rounded-2xl p-6 text-center flex flex-col items-center justify-end relative shadow-xl shadow-amber-950/20 sm:-translate-y-2 cursor-pointer hover:shadow-2xl hover:shadow-amber-500/20 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-300 flex items-center justify-center font-bold text-slate-950 text-2xl mb-2 shadow-lg shadow-amber-500/40 group-hover:scale-110 transition-transform">
                      👑
                    </div>
                    <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                      #1 {activeSection === 'streak' ? 'Streak Leader' : activeSection === 'accuracy' ? 'Precision Leader' : activeSection === 'wins' ? 'Wins Leader' : 'Champion'}
                    </span>
                    <h4 className="text-base font-black text-white mt-1 group-hover:text-amber-300 transition-colors">
                      {topThree[0].username}
                    </h4>

                    {/* Section primary metric */}
                    {activeSection === 'streak' ? (
                      <div className="text-3xl font-black text-red-400 font-mono mt-1">
                        {topThree[0].streak} 🔥{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">wins in a row</span>
                      </div>
                    ) : activeSection === 'accuracy' ? (
                      <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                        {topThree[0].accuracy}%{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">accuracy</span>
                      </div>
                    ) : activeSection === 'wins' ? (
                      <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
                        {activeMode === 'BASIC' ? topThree[0].correct_count : topThree[0].won_sets}{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">wins</span>
                      </div>
                    ) : (
                      <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                        {topThree[0].points}{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">pts</span>
                      </div>
                    )}

                    <div className="text-xs text-slate-300 mt-2 flex items-center gap-1.5 font-semibold">
                      <span>🔥 Active Run:</span>
                      <strong className="text-amber-400 font-mono">{topThree[0].streak} 🔥</strong>
                      <span className="text-slate-500">•</span>
                      <span>Best: {topThree[0].best_streak}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserId(topThree[0].id);
                      }}
                      className="mt-3 px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-md shadow-amber-500/30 transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Predictions</span>
                    </button>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div
                    onClick={() => setSelectedUserId(topThree[2].id)}
                    className="order-3 bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-900/60 hover:border-amber-600 rounded-2xl p-5 text-center flex flex-col items-center justify-end relative shadow-lg cursor-pointer hover:-translate-y-1 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-amber-600 text-lg mb-2 shadow-inner group-hover:scale-110 transition-transform">
                      🥉
                    </div>
                    <span className="text-xs font-bold text-slate-400">#3 Rank</span>
                    <h4 className="text-sm font-black text-white mt-1 group-hover:text-amber-400 transition-colors">
                      {topThree[2].username}
                    </h4>

                    {/* Section primary metric */}
                    {activeSection === 'streak' ? (
                      <div className="text-2xl font-black text-red-400 font-mono mt-1">
                        {topThree[2].streak} 🔥{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">wins run</span>
                      </div>
                    ) : activeSection === 'accuracy' ? (
                      <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                        {topThree[2].accuracy}%{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">win rate</span>
                      </div>
                    ) : activeSection === 'wins' ? (
                      <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                        {activeMode === 'BASIC' ? topThree[2].correct_count : topThree[2].won_sets}{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">wins</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-slate-200 font-mono mt-1">
                        {topThree[2].points}{' '}
                        <span className="text-xs text-slate-400 font-sans font-medium">pts</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 mt-2">
                      Streak: <strong className="text-slate-200">{topThree[2].streak} 🔥</strong> • Peak:{' '}
                      <strong className="text-slate-200">{topThree[2].best_streak}</strong>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserId(topThree[2].id);
                      }}
                      className="mt-3 px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <span>View Predictions</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= COMPREHENSIVE RANKINGS TABLE ================= */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-6">
                  <span className="w-8 text-center">Rank</span>
                  <span>User</span>
                </div>
                <div className="flex items-center gap-6 sm:gap-10">
                  {/* Streak Column Header */}
                  <span
                    className={`flex items-center gap-1 ${
                      activeSection === 'streak' ? 'text-red-400 font-black' : ''
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Streak</span>
                  </span>

                  {/* Accuracy Column Header */}
                  <span
                    className={`hidden sm:flex items-center gap-1 ${
                      activeSection === 'accuracy' ? 'text-emerald-400 font-black' : ''
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Accuracy</span>
                  </span>

                  {/* Wins Column Header */}
                  <span
                    className={`hidden md:flex items-center gap-1 ${
                      activeSection === 'wins' ? 'text-cyan-400 font-black' : ''
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{activeMode === 'BASIC' ? 'Correct' : 'Sets'}</span>
                  </span>

                  {/* Points Column Header */}
                  <span
                    className={`w-20 text-right ${
                      activeSection === 'points' ? 'text-amber-400 font-black' : ''
                    }`}
                  >
                    Points
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-800/60">
                {leaderboard.map((user) => {
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-slate-800/60 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-4 sm:gap-6">
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
                          <div className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors flex items-center gap-2">
                            <span>{user.username}</span>
                            {user.is_on_fire && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-0.5">
                                <Flame className="w-3 h-3 text-red-400 animate-pulse" />
                                <span>{user.streak_tier}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 sm:hidden">
                            Streak: {user.streak} 🔥 • Accuracy: {user.accuracy}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-10">
                        {/* Streak Badge */}
                        <div
                          className={`flex items-center gap-1.5 font-mono ${
                            user.streak > 0
                              ? 'text-red-400 font-bold bg-red-950/40 px-2 py-0.5 rounded-lg border border-red-500/30'
                              : 'text-slate-400'
                          }`}
                        >
                          <span>{user.streak} 🔥</span>
                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            (Pk: {user.best_streak})
                          </span>
                        </div>

                        {/* Accuracy Percentage */}
                        <div className="hidden sm:flex items-center gap-2 text-slate-300">
                          <span
                            className={`font-mono font-bold ${
                              user.accuracy >= 75
                                ? 'text-emerald-400'
                                : user.accuracy >= 50
                                ? 'text-cyan-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {user.accuracy}%
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({activeMode === 'BASIC' ? `${user.correct_count}/${user.total_graded}` : `${user.won_sets}/${user.total_sets}`})
                          </span>
                        </div>

                        {/* Correct Picks / Sets */}
                        <div className="hidden md:block text-slate-300 font-medium">
                          {activeMode === 'BASIC' ? (
                            <span className="text-emerald-400 font-bold">
                              {user.correct_count} wins
                            </span>
                          ) : (
                            <span>
                              <strong className="text-emerald-400">{user.won_sets}W</strong> /{' '}
                              <strong className="text-red-400">{user.lost_sets}L</strong>
                            </span>
                          )}
                        </div>

                        {/* Points & Action Button */}
                        <div className="text-right flex items-center gap-3">
                          <div className="w-16 sm:w-20">
                            <span
                              className={`font-mono font-black text-sm ${
                                activeMode === 'BASIC' ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {user.points}
                            </span>
                            <span className="text-[10px] text-slate-400 block">pts</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserId(user.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-[11px] font-bold flex items-center gap-1 shrink-0"
                            title={`View ${user.username}'s past predictions`}
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="hidden md:inline">Predictions</span>
                          </button>
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

      {/* User Past Predictions Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};
