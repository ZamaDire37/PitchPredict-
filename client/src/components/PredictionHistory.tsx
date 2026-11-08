import React, { useState, useEffect } from 'react';
import { Prediction, SeriousSet, CommunityPrediction } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGameMode } from '../context/GameModeContext';
import { useTimezone } from '../context/TimezoneContext';
import { UserProfileModal } from './UserProfileModal';
import { TeamBadge } from './TeamBadge';
import {
  History,
  Shield,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Lock,
  Globe,
  User as UserIcon,
  RefreshCw,
  Trophy,
  Filter,
  Eye,
  ExternalLink,
  Sparkles,
  ChevronRight,
  LogIn,
} from 'lucide-react';

interface PredictionHistoryProps {
  onOpenAuth?: () => void;
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({ onOpenAuth }) => {
  const { isAuthenticated, user } = useAuth();
  const { mode } = useGameMode();
  const { formatFullDateTime } = useTimezone();

  // Top level view switcher: My Predictions vs Community Predictions
  const [mainTab, setMainTab] = useState<'MY' | 'COMMUNITY'>(isAuthenticated ? 'MY' : 'COMMUNITY');

  // Sub-tab for My Predictions: BASIC vs SERIOUS
  const [mySubTab, setMySubTab] = useState<'BASIC' | 'SERIOUS'>(mode);
  const [myStatusFilter, setMyStatusFilter] = useState<string>('ALL');

  // Filters for Community Predictions
  const [communityModeFilter, setCommunityModeFilter] = useState<'ALL' | 'BASIC' | 'SERIOUS'>('ALL');
  const [communityStatusFilter, setCommunityStatusFilter] = useState<string>('ALL');

  // Data states
  const [allBasicPredictions, setAllBasicPredictions] = useState<Prediction[]>([]);
  const [seriousSets, setSeriousSets] = useState<SeriousSet[]>([]);
  const [communityPredictions, setCommunityPredictions] = useState<CommunityPrediction[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // User Profile inspection modal
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch My Predictions
  const fetchMyHistory = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (mySubTab === 'BASIC') {
        const res = await api.getMyPredictions('BASIC');
        setAllBasicPredictions(res.predictions || []);
      } else {
        const res = await api.getMySeriousSets();
        setSeriousSets(res.sets || []);
      }
    } catch (err) {
      console.error('Error fetching personal prediction history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Community Predictions
  const fetchCommunityHistory = async () => {
    setLoading(true);
    try {
      const modeParam = communityModeFilter === 'ALL' ? undefined : communityModeFilter;
      const res = await api.getCommunityPredictions(modeParam, communityStatusFilter);
      setCommunityPredictions(res.predictions);
    } catch (err) {
      console.error('Error fetching community predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'MY') {
      fetchMyHistory();
    } else {
      fetchCommunityHistory();
    }
  }, [mainTab, mySubTab, myStatusFilter, communityModeFilter, communityStatusFilter, isAuthenticated]);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this prediction before kickoff?')) return;
    try {
      setCancellingId(id);
      await api.cancelPrediction(id);
      await fetchMyHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel prediction');
    } finally {
      setCancellingId(null);
    }
  };

  const basicPredictions = allBasicPredictions.filter((p) => {
    if (myStatusFilter === 'DONE') return p.status === 'CORRECT' || p.status === 'INCORRECT';
    if (myStatusFilter === 'CORRECT') return p.status === 'CORRECT';
    if (myStatusFilter === 'INCORRECT') return p.status === 'INCORRECT';
    if (myStatusFilter === 'PENDING') return p.status === 'PENDING';
    return true; // ALL
  });

  const displayedSets = seriousSets.filter((set) => {
    if (myStatusFilter === 'DONE') return set.status === 'WON' || set.status === 'LOST';
    if (myStatusFilter === 'CORRECT') return set.status === 'WON';
    if (myStatusFilter === 'INCORRECT') return set.status === 'LOST';
    if (myStatusFilter === 'PENDING') return set.status === 'PENDING';
    return true; // ALL
  });

  const basicCounts = {
    all: allBasicPredictions.length,
    pending: allBasicPredictions.filter((p) => p.status === 'PENDING').length,
    done: allBasicPredictions.filter((p) => p.status === 'CORRECT' || p.status === 'INCORRECT').length,
    won: allBasicPredictions.filter((p) => p.status === 'CORRECT').length,
    lost: allBasicPredictions.filter((p) => p.status === 'INCORRECT').length,
  };

  const seriousCounts = {
    all: seriousSets.length,
    pending: seriousSets.filter((s) => s.status === 'PENDING').length,
    done: seriousSets.filter((s) => s.status === 'WON' || s.status === 'LOST').length,
    won: seriousSets.filter((s) => s.status === 'WON').length,
    lost: seriousSets.filter((s) => s.status === 'LOST').length,
  };

  const activeCounts = mySubTab === 'BASIC' ? basicCounts : seriousCounts;

  return (
    <div className="space-y-6">
      {/* Top Main Tab Navigation */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Prediction History & Community Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect your own past picks or audit other players' predictions, win rates, and strategies.
          </p>
        </div>

        {/* Main Tab Switcher: My Predictions vs Community */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setMainTab('MY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mainTab === 'MY'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>My Predictions</span>
          </button>

          <button
            onClick={() => setMainTab('COMMUNITY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mainTab === 'COMMUNITY'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Community Feed</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950/40 text-slate-900 font-extrabold border border-emerald-900/30">
              Live
            </span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: COMMUNITY PAST PREDICTIONS FEED                           */}
      {/* ================================================================= */}
      {mainTab === 'COMMUNITY' && (
        <div className="space-y-4">
          {/* Community Info & Filter Header */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Community Past Predictions Stream</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {communityPredictions.length} finished
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Showing completed predictions from finished matches. Pending predictions are excluded until matches conclude.
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Mode filter */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setCommunityModeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    communityModeFilter === 'ALL'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Modes
                </button>
                <button
                  onClick={() => setCommunityModeFilter('BASIC')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    communityModeFilter === 'BASIC'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Basic</span>
                </button>
                <button
                  onClick={() => setCommunityModeFilter('SERIOUS')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    communityModeFilter === 'SERIOUS'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Serious</span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'ALL', label: 'All Done' },
                  { id: 'CORRECT', label: 'Won' },
                  { id: 'INCORRECT', label: 'Lost' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setCommunityStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      communityStatusFilter === st.id
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchCommunityHistory}
                disabled={loading}
                className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Refresh community feed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Predictions Feed */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="h-28 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : communityPredictions.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-900/30 border border-slate-800 rounded-3xl">
              <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">No Community Predictions Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No past predictions match the current mode and status filters. Try changing filters above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {communityPredictions.map((pred) => {
                const kickoffDate = new Date(pred.match_date);
                const isFinished = pred.match_status === 'FINISHED';

                return (
                  <div
                    key={pred.id}
                    className="bg-slate-900/90 hover:bg-slate-900 rounded-2xl border border-slate-800/90 hover:border-slate-700 p-4 shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* User Identity & Mode */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        onClick={() => setSelectedUserId(pred.user_id)}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-inner cursor-pointer shrink-0 transition-transform group-hover:scale-105 ${
                          pred.mode === 'SERIOUS'
                            ? 'bg-gradient-to-br from-amber-500 to-red-600 text-white'
                            : 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-slate-950'
                        }`}
                        title={`View ${pred.username}'s complete profile`}
                      >
                        {pred.username.slice(0, 1).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUserId(pred.user_id)}
                            className="font-black text-sm text-white hover:text-amber-300 transition-colors text-left flex items-center gap-1.5"
                          >
                            <span>{pred.username}</span>
                            <Eye className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>

                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                              pred.mode === 'SERIOUS'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {pred.mode === 'SERIOUS' ? 'Serious Set' : 'Basic Play'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>
                            {pred.mode === 'SERIOUS' ? (
                              <span>
                                Bankroll: <strong className="text-amber-400">{pred.serious_points} pts</strong> (🔥 {pred.serious_streak})
                              </span>
                            ) : (
                              <span>
                                Bankroll: <strong className="text-emerald-400">{pred.basic_points} pts</strong> (🔥 {pred.basic_streak})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match & Prediction Info */}
                    <div className="flex-1 max-w-xl space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">{pred.competition_name}</span>
                        <span>•</span>
                        <span>{formatFullDateTime(pred.match_date)}</span>
                      </div>

                      <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                        <TeamBadge
                          name={pred.home_team_name}
                          shortName={pred.home_team_short}
                          crest={pred.home_team_crest}
                          size="xs"
                        />
                        <span>{pred.home_team_short || pred.home_team_name}</span>

                        {isFinished ? (
                          <span className="px-2 py-0.5 bg-slate-950 rounded text-xs font-mono text-emerald-400 font-bold border border-slate-800">
                            {pred.home_score} - {pred.away_score}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">vs</span>
                        )}

                        <span>{pred.away_team_short || pred.away_team_name}</span>
                        <TeamBadge
                          name={pred.away_team_name}
                          shortName={pred.away_team_short}
                          crest={pred.away_team_crest}
                          size="xs"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                        <span className="text-slate-400">Predicted:</span>
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-200 font-semibold font-mono text-[11px] border border-slate-800">
                          {pred.market_type}:{' '}
                          <strong className={pred.mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'}>
                            {pred.selection}
                          </strong>
                        </span>

                        {pred.actual_result && (
                          <span className="text-[11px] text-slate-400">
                            (Actual Result: <strong className="text-slate-200">{pred.actual_result}</strong>)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Outcome Badge & View Profile Button */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                      <div>
                        {pred.status === 'CORRECT' ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ✓ RIGHT • WON (+{pred.points_awarded} pts)
                            </span>
                          </div>
                        ) : pred.status === 'INCORRECT' ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-red-500/20 text-red-400 border border-red-500/30">
                              <XCircle className="w-3.5 h-3.5" />
                              ✗ WRONG • {pred.mode === 'SERIOUS' ? 'MISSED (-10 set risk)' : 'LOST (0 pts)'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              <Clock className="w-3.5 h-3.5" />
                              PENDING (+{pred.odds_points} pts)
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedUserId(pred.user_id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors flex items-center gap-1.5 shrink-0"
                        title={`Inspect ${pred.username}'s prediction record`}
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Track Record</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: MY PERSONAL PREDICTIONS                                   */}
      {/* ================================================================= */}
      {mainTab === 'MY' && (
        <div className="space-y-6">
          {!isAuthenticated ? (
            <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-1" />
              <h3 className="text-base font-bold text-white">Sign In to Track Personal Predictions</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Sign in or create a free guest player account to place picks, earn points, build streaks, and climb the podium.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                {onOpenAuth && (
                  <button
                    onClick={onOpenAuth}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In / Play Now</span>
                  </button>
                )}
                <button
                  onClick={() => setMainTab('COMMUNITY')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Browse Community Past Predictions</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Switcher & Filters Header */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Basic Mode vs Serious Mode tab */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setMySubTab('BASIC')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mySubTab === 'BASIC'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Basic Predictions</span>
                  </button>

                  <button
                    onClick={() => setMySubTab('SERIOUS')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mySubTab === 'SERIOUS'
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
                  {[
                    { id: 'ALL', label: 'All Picks', count: activeCounts.all },
                    { id: 'PENDING', label: 'Active / Pending', count: activeCounts.pending, badge: activeCounts.pending > 0 },
                    { id: 'DONE', label: 'Done (Completed)', count: activeCounts.done },
                    { id: 'CORRECT', label: 'Won', count: activeCounts.won },
                    { id: 'INCORRECT', label: 'Lost', count: activeCounts.lost },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setMyStatusFilter(st.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        myStatusFilter === st.id
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <span>{st.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          st.badge && myStatusFilter !== st.id
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : myStatusFilter === st.id
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-950 text-slate-500'
                        }`}
                      >
                        {st.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Mode Predictions List */}
              {mySubTab === 'BASIC' && (
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
                    <div className="text-center py-12 px-4 bg-slate-900/30 border border-slate-800 rounded-3xl">
                      <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-white mb-1">No Basic Predictions Found</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
                        {myStatusFilter === 'DONE' && activeCounts.pending > 0
                          ? `You have ${activeCounts.pending} active prediction waiting for its match to conclude!`
                          : "You haven't placed any Basic Mode predictions matching this filter yet."}
                      </p>
                      {activeCounts.pending > 0 && myStatusFilter !== 'PENDING' && (
                        <button
                          onClick={() => setMyStatusFilter('PENDING')}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>View Active / Pending Picks ({activeCounts.pending})</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    basicPredictions.map((pred) => {
                      const kickoffDate = new Date(pred.match_date);
                      const isStarted = kickoffDate.getTime() <= Date.now();
                      return (
                        <div
                          key={pred.id}
                          className={`bg-slate-900/90 rounded-2xl border p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            pred.status === 'CORRECT'
                              ? 'border-emerald-500/40 bg-emerald-950/10'
                              : pred.status === 'INCORRECT'
                              ? 'border-red-500/40 bg-red-950/10'
                              : 'border-slate-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-300">{pred.competition_name}</span>
                              <span>•</span>
                              <span>
                                {kickoffDate.toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {pred.match_status === 'FINISHED' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                  FT (Finished)
                                </span>
                              ) : (
                                isStarted && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    <Lock className="w-2.5 h-2.5" /> Locked
                                  </span>
                                )
                              )}
                            </div>

                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{pred.home_team_short || pred.home_team_name}</span>
                              {pred.match_status === 'FINISHED' && pred.home_score !== null && pred.away_score !== null ? (
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
                                <span className="text-[11px] text-slate-300 font-medium">
                                  (Actual: <strong className="text-white">{pred.actual_result}</strong>)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status & Points outcome */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                            <div>
                              {pred.status === 'CORRECT' ? (
                                <div className="text-right">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                    <CheckCircle2 className="w-4 h-4" />
                                    ✓ RIGHT • WON (+{pred.points_awarded} pts)
                                  </span>
                                </div>
                              ) : pred.status === 'INCORRECT' ? (
                                <div className="text-right">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
                                    <XCircle className="w-4 h-4" />
                                    ✗ WRONG • LOST (0 pts)
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
              {mySubTab === 'SERIOUS' && (
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
                  ) : displayedSets.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-slate-900/30 border border-slate-800 rounded-3xl">
                      <Flame className="w-10 h-10 text-amber-500/50 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-white mb-1">No Sets Found</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
                        {myStatusFilter === 'DONE' && activeCounts.pending > 0
                          ? `You have ${activeCounts.pending} active Serious Set(s) waiting for all matches in the set to conclude!`
                          : myStatusFilter === 'DONE'
                          ? 'No completed Serious Mode sets yet. Sets appear here once all matches in the set conclude.'
                          : 'No Serious Mode sets match this filter.'}
                      </p>
                      {activeCounts.pending > 0 && myStatusFilter !== 'PENDING' && (
                        <button
                          onClick={() => setMyStatusFilter('PENDING')}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>View Active / Pending Sets ({activeCounts.pending})</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    displayedSets.map((set) => {
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
                                  ✓ RIGHT • SET WON! (+{set.points_delta} pts)
                                </span>
                              ) : isLost ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
                                  <XCircle className="w-4 h-4" />
                                  ✗ WRONG • SET LOST (-10 pts penalty)
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
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border text-xs ${
                                  p.status === 'CORRECT'
                                    ? 'bg-emerald-950/20 border-emerald-500/30'
                                    : p.status === 'INCORRECT'
                                    ? 'bg-red-950/20 border-red-500/30'
                                    : 'bg-slate-950/60 border-slate-800/70'
                                }`}
                              >
                                <div className="flex flex-wrap items-center gap-1.5 mr-2">
                                  <span className="font-bold text-slate-200">
                                    {p.home_team_short || p.home_team_name}
                                  </span>
                                  {p.home_score !== null && p.home_score !== undefined && p.away_score !== null && p.away_score !== undefined ? (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono font-bold text-emerald-400 text-[11px]">
                                      {p.home_score} - {p.away_score}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">vs</span>
                                  )}
                                  <span className="font-bold text-slate-200">
                                    {p.away_team_short || p.away_team_name}
                                  </span>
                                  <span className="text-slate-500 mx-1">•</span>
                                  <span className="text-slate-400">
                                    {p.market_type}: <strong className="text-amber-400 font-mono">{p.selection}</strong>
                                  </span>
                                  {p.actual_result && (
                                    <span className="text-[11px] text-slate-400">
                                      (Actual: <strong className="text-slate-200">{p.actual_result}</strong>)
                                    </span>
                                  )}
                                </div>

                                <div className="shrink-0">
                                  {p.status === 'CORRECT' ? (
                                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black inline-flex items-center gap-1 text-[11px]">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> ✓ RIGHT (+{p.odds_points} pts)
                                    </span>
                                  ) : p.status === 'INCORRECT' ? (
                                    <span className="px-2.5 py-0.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-black inline-flex items-center gap-1 text-[11px]">
                                      <XCircle className="w-3.5 h-3.5" /> ✗ WRONG (Missed)
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
            </>
          )}
        </div>
      )}

      {/* User Profile Inspection Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};