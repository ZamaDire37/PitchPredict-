import React, { useState } from 'react';
import { Match, StagedPrediction } from '../types';
import {
  CATEGORIES,
  CLIENT_MARKETS,
  MarketCategory,
  ClientMarketDefinition,
  MarketOption,
} from '../services/marketRegistry';
import { useGameMode } from '../context/GameModeContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../context/TimezoneContext';
import { api } from '../services/api';
import { TeamBadge } from './TeamBadge';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Target,
  Flame,
  Flag,
  Sparkles,
  Shield,
  Clock,
  Lock,
  CheckCircle2,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  PlusCircle,
  BarChart3,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

interface MarketsSectionProps {
  matches: Match[];
  onOpenAuth: () => void;
  onRefreshData: () => void;
  onOpenRules?: (tab?: 'RULES' | 'ODDS') => void;
}

export const MarketsSection: React.FC<MarketsSectionProps> = ({
  matches,
  onOpenAuth,
  onRefreshData,
  onOpenRules,
}) => {
  const {
    mode,
    addStagedPrediction,
    toggleStagedPrediction,
    stagedPredictions,
    isStaged,
  } = useGameMode();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const { formatKickoffParts } = useTimezone();

  // 1. Fixture Selection (strictly actual real matches that are going to be played in the future)
  const [internalUpcoming, setInternalUpcoming] = useState<Match[]>([]);

  React.useEffect(() => {
    const valid = matches.filter(
      (m) =>
        (m.status === 'TIMED' || m.status === 'SCHEDULED') &&
        new Date(m.utc_date).getTime() > Date.now()
    );
    if (valid.length === 0) {
      api.getMatches('upcoming', 'ALL').then((res) => {
        if (res?.matches) {
          setInternalUpcoming(res.matches);
        }
      });
    }
  }, [matches]);

  const candidateMatches = matches.some(
    (m) =>
      (m.status === 'TIMED' || m.status === 'SCHEDULED') &&
      new Date(m.utc_date).getTime() > Date.now()
  )
    ? matches
    : internalUpcoming;

  const scheduledMatches = candidateMatches.filter(
    (m) =>
      (m.status === 'TIMED' || m.status === 'SCHEDULED') &&
      new Date(m.utc_date).getTime() > Date.now()
  );

  const [selectedMatchId, setSelectedMatchId] = useState<number>(
    scheduledMatches[0]?.id || 0
  );

  React.useEffect(() => {
    if (
      scheduledMatches.length > 0 &&
      (!selectedMatchId || !scheduledMatches.find((m) => m.id === selectedMatchId))
    ) {
      setSelectedMatchId(scheduledMatches[0].id);
    }
  }, [scheduledMatches, selectedMatchId]);

  const activeMatch = scheduledMatches.find((m) => m.id === selectedMatchId) || scheduledMatches[0];

  // 2. Category selection: Match Result, Goals, BTTS, Corners, Other Markets
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('MATCH_RESULT');

  // 3. User selects the market first
  const marketsForCategory = CLIENT_MARKETS.filter((m) => m.category === activeCategory);
  const [selectedMarketId, setSelectedMarketId] = useState<string>(
    marketsForCategory[0]?.id || 'MATCH_WINNER'
  );

  // 4. Then their prediction selection
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOdds, setSelectedOdds] = useState<number>(0);

  // Custom score input state (for exact score)
  const [customHome, setCustomHome] = useState<string>('2');
  const [customAway, setCustomAway] = useState<string>('1');

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showOddsGuide, setShowOddsGuide] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!activeMatch) {
    return (
      <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-white">No Active Fixtures Available</h3>
        <p className="text-xs text-slate-400 mt-1">Please sync matches to load real fixtures.</p>
      </div>
    );
  }

  const kickoff = new Date(activeMatch.utc_date);
  const isStarted = kickoff.getTime() <= Date.now();

  // Category Icon helper
  const getCategoryIcon = (catId: MarketCategory) => {
    switch (catId) {
      case 'MATCH_RESULT':
        return <Trophy className="w-4 h-4" />;
      case 'GOALS':
        return <Target className="w-4 h-4" />;
      case 'BTTS':
        return <Flame className="w-4 h-4" />;
      case 'CORNERS':
        return <Flag className="w-4 h-4" />;
      case 'OTHER':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  // Switch category and reset market/option
  const handleCategoryChange = (catId: MarketCategory) => {
    setActiveCategory(catId);
    const firstMarket = CLIENT_MARKETS.find((m) => m.category === catId);
    if (firstMarket) {
      setSelectedMarketId(firstMarket.id);
    }
    setSelectedOptionId(null);
    setSelectedOdds(0);
    setFeedback(null);
  };

  // Select Market first
  const handleMarketSelect = (marketId: string) => {
    setSelectedMarketId(marketId);
    setSelectedOptionId(null);
    setSelectedOdds(0);
    setFeedback(null);
  };

  // Toggle option selection:
  // In Serious Mode: Clicking directly adds or removes the selection from the Serious Set.
  // Users can make as many selections as they want!
  // In Basic Mode: Intuitive click to select, click again to deselect.
  const handleOptionToggle = (optionId: string, odds: number) => {
    setFeedback(null);
    if (mode === 'SERIOUS') {
      toggleStagedPrediction({
        match: activeMatch,
        marketType: activeMarketDef.id,
        selection: optionId,
        oddsPoints: odds,
      });
      if (selectedOptionId === optionId) {
        setSelectedOptionId(null);
        setSelectedOdds(0);
      } else {
        setSelectedOptionId(optionId);
        setSelectedOdds(odds);
      }
    } else {
      if (selectedOptionId === optionId) {
        // Click again to DESELECT!
        setSelectedOptionId(null);
        setSelectedOdds(0);
      } else {
        // Click to SELECT!
        setSelectedOptionId(optionId);
        setSelectedOdds(odds);
      }
    }
  };

  const activeMarketDef = CLIENT_MARKETS.find((m) => m.id === selectedMarketId) || marketsForCategory[0];
  const marketOptions = activeMarketDef
    ? activeMarketDef.getOptions(
        activeMatch.home_team_short || activeMatch.home_team_name,
        activeMatch.away_team_short || activeMatch.away_team_name
      )
    : [];

  const handleSubmit = async () => {
    if (!selectedOptionId || !activeMarketDef) {
      setFeedback({ type: 'error', text: 'Please select a prediction option first.' });
      return;
    }

    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (isStarted) {
      setFeedback({
        type: 'error',
        text: 'This match has already kicked off. Predictions are locked.',
      });
      return;
    }

    if (mode === 'BASIC') {
      const basicCount = user?.basic_pending_count ?? 0;
      if (basicCount >= 10) {
        setFeedback({
          type: 'error',
          text: 'In Basic Mode, there is a limit of 10 selections that users can make. You currently have 10 active selections. Cancel an active prediction in Past Predictions or wait for matches to finish.',
        });
        return;
      }
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      if (mode === 'BASIC') {
        await api.submitBasicPredictions([
          {
            matchId: activeMatch.id,
            marketType: activeMarketDef.id,
            selection: selectedOptionId,
          },
        ]);
        await refreshUser();
        onRefreshData();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setFeedback({
          type: 'success',
          text: `Basic Mode prediction submitted: ${activeMarketDef.name} (${selectedOptionId}) for +${selectedOdds} potential pts!`,
        });
      } else {
        // Serious Mode
        addStagedPrediction({
          match: activeMatch,
          marketType: activeMarketDef.id,
          selection: selectedOptionId,
          oddsPoints: selectedOdds,
        });
        setFeedback({
          type: 'success',
          text: `Added to Serious Set! Open the Serious Set Builder at the bottom right to review or submit your multi-set.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to place prediction' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Introduction */}
      <div
        className={`p-5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300 ${
          mode === 'SERIOUS'
            ? 'bg-gradient-to-r from-red-950/80 via-[#180707] to-amber-950/70 border-red-500/40 shadow-red-950/40'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`p-2 rounded-xl font-bold ${
                  mode === 'SERIOUS'
                    ? 'bg-gradient-to-br from-amber-500 to-red-600 text-white shadow-md shadow-red-500/30 ring-1 ring-red-500/50'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {mode === 'SERIOUS' ? <Flame className="w-5 h-5 animate-pulse" /> : <Layers className="w-5 h-5" />}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">
                    {mode === 'SERIOUS' ? 'Serious Set Market Center' : 'Prediction Market Center'}
                  </h2>
                  {mode === 'SERIOUS' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                      🔥 -10 PT PENALTY ACTIVE
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        🛡️ ZERO RISK
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          (user?.basic_pending_count || 0) >= 10
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        LIMIT: {user?.basic_pending_count || 0}/10 SELECTIONS
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mode === 'SERIOUS'
                    ? 'Build your high-stakes multi-set. Win all picks to profit. Any wrong pick triggers -10 pt penalty!'
                    : 'Select your market category first, choose your line, and lock in your prediction.'}
                </p>
              </div>
            </div>
          </div>

          {/* Real Fixture Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Select Fixture:</span>
            <select
              value={selectedMatchId}
              onChange={(e) => {
                setSelectedMatchId(parseInt(e.target.value, 10));
                setSelectedOptionId(null);
                setFeedback(null);
              }}
              className={`w-full sm:w-80 bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none shadow-inner transition-colors ${
                mode === 'SERIOUS'
                  ? 'border-red-900/60 focus:border-red-500'
                  : 'border-slate-700 focus:border-emerald-500'
              }`}
            >
              {scheduledMatches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.competition_name}: {m.home_team_name} vs {m.away_team_name} (
                  {new Date(m.utc_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                  at {new Date(m.utc_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Match Banner Bar */}
        <div
          className={`mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
            mode === 'SERIOUS'
              ? 'bg-black/60 border-red-950/80'
              : 'bg-slate-950/60 border-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <TeamBadge
              name={activeMatch.home_team_name}
              shortName={activeMatch.home_team_short}
              crest={activeMatch.home_team_crest}
              size="sm"
            />
            <span className="text-sm font-bold text-white">
              {activeMatch.home_team_short || activeMatch.home_team_name}
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                mode === 'SERIOUS' ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              vs
            </span>
            <span className="text-sm font-bold text-white">
              {activeMatch.away_team_short || activeMatch.away_team_name}
            </span>
            <TeamBadge
              name={activeMatch.away_team_name}
              shortName={activeMatch.away_team_short}
              crest={activeMatch.away_team_crest}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">{activeMatch.competition_name}</span>
            <span className="text-slate-600">•</span>
            {isStarted ? (
              <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Lock className="w-3 h-3" /> Kickoff Passed (Locked)
              </span>
            ) : (
              <span
                className={`flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded border text-xs ${
                  mode === 'SERIOUS'
                    ? 'text-amber-300 bg-amber-950/30 border-amber-500/30'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{formatKickoffParts(activeMatch.utc_date).datePrefix} {formatKickoffParts(activeMatch.utc_date).timeDisplay}</span>
                {formatKickoffParts(activeMatch.utc_date).tzAbbr && (
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {formatKickoffParts(activeMatch.utc_date).tzAbbr}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Viewing Prediction Markets as Guest</p>
              <p className="text-[11px] text-slate-400">
                You can freely browse all fixture odds and prediction categories. Sign in or create a free account to lock in your predictions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md active:scale-95"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* HOW MARKET ODDS POINTS ARE DETERMINED GUIDE BANNER */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 p-3.5 sm:p-4 shadow-lg transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-xs sm:text-sm">How Market Odds & Points Are Determined</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Scoring Guide
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Points are determined by real football event probability: high probability (+5 to +8 pts), balanced markets (+10 to +12 pts), and exact scorelines (up to +50 pts!).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowOddsGuide(!showOddsGuide)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <span>{showOddsGuide ? 'Hide Matrix' : 'Quick Matrix'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOddsGuide ? 'rotate-180' : ''}`} />
            </button>
            {onOpenRules && (
              <button
                type="button"
                onClick={() => onOpenRules('ODDS')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 flex items-center gap-1.5 transition-colors"
              >
                <span>Full Rulebook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Quick Matrix */}
        {showOddsGuide && (
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30">
              <div className="flex items-center justify-between font-bold text-emerald-400 mb-1">
                <span>Tier 1: Safe Coverage</span>
                <span className="font-mono">+5 – +8 pts</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                Double Chance (6 pts), Over 0.5 (5 pts), Under 5.5 (6 pts), Draw No Bet (8 pts), Over 1.5 (8 pts).
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30">
              <div className="flex items-center justify-between font-bold text-cyan-400 mb-1">
                <span>Tier 2: Core 50/50</span>
                <span className="font-mono">+10 – +12 pts</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                Match Winner 1X2 (10 pts), BTTS (10 pts), Over/Under 2.5 (10 pts), Corners 9.5 (12 pts), Odd/Even (10 pts).
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/30">
              <div className="flex items-center justify-between font-bold text-amber-400 mb-1">
                <span>Tier 3: Combos & Margins</span>
                <span className="font-mono">+14 – +25 pts</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                Draw Result (15 pts), Handicap -1 (14-18 pts), BTTS & Win (20 pts), Result + O2.5 (18 pts), Margin by 1 (14 pts).
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-red-500/30">
              <div className="flex items-center justify-between font-bold text-red-400 mb-1">
                <span>Tier 4: Exact Scores</span>
                <span className="font-mono">+30 – +50 pts</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                Common scores (30 pts), 0-0 Bore Draw (35 pts), 3-2 thrillers (35 pts), 3-3 draw (45 pts), 4-2 shootouts (50 pts!).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* STEP 1: CATEGORY SELECTION TABS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span>Step 1: Select Market Category</span>
          </span>
          <span className="text-xs text-slate-500">5 Distinct Football Market Categories</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isActive
                    ? mode === 'SERIOUS'
                      ? 'bg-gradient-to-br from-red-950/90 to-amber-950/90 border-amber-500 shadow-xl shadow-red-950/40 text-white ring-2 ring-amber-500/50'
                      : 'bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-500/10 text-white ring-2 ring-emerald-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isActive
                        ? mode === 'SERIOUS'
                          ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold shadow-md'
                          : 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-950 text-slate-400 group-hover:text-emerald-400'
                    }`}
                  >
                    {getCategoryIcon(cat.id)}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isActive
                        ? mode === 'SERIOUS'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-950 text-slate-500'
                    }`}
                  >
                    {cat.badge}
                  </span>
                </div>
                <div className="font-bold text-xs text-white">{cat.label}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{cat.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: SELECT SPECIFIC MARKET WITHIN CATEGORY */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span>Step 2: Choose Market</span>
          </span>
          <span className="text-xs text-slate-500">
            {marketsForCategory.length} market(s) in {CATEGORIES.find((c) => c.id === activeCategory)?.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {marketsForCategory.map((m) => {
            const isSelected = selectedMarketId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleMarketSelect(m.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isSelected
                    ? mode === 'SERIOUS'
                      ? 'bg-red-950/70 border-amber-500 text-amber-300 ring-2 ring-amber-500/40 shadow-md shadow-red-950/20'
                      : 'bg-slate-800 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{m.name}</span>
                {m.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {m.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 3: PREDICTION OPTIONS WITH CLICK TO SELECT & CLICK AGAIN TO DESELECT */}
      {activeMarketDef && (
        <div
          className={`rounded-2xl p-5 shadow-lg space-y-4 border transition-colors ${
            mode === 'SERIOUS'
              ? 'bg-[#150707]/95 border-red-900/60 shadow-red-950/30'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          {/* Breadcrumb Flow: Match → Market → Prediction */}
          <div
            className={`flex flex-wrap items-center gap-2 p-3 rounded-xl text-xs border transition-colors ${
              mode === 'SERIOUS'
                ? 'bg-black/70 border-red-900/50'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selection Flow:</span>

            <div
              className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg border ${
                mode === 'SERIOUS'
                  ? 'text-slate-100 bg-red-950/40 border-red-500/40'
                  : 'text-slate-200 bg-slate-900 border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mode === 'SERIOUS' ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`}></span>
              <span>{activeMatch.home_team_short || activeMatch.home_team_name} vs {activeMatch.away_team_short || activeMatch.away_team_name}</span>
            </div>

            <span className={`font-bold ${mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'}`}>→</span>

            <div
              className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg border ${
                mode === 'SERIOUS'
                  ? 'text-amber-300 bg-amber-950/50 border-amber-500/40'
                  : 'text-cyan-300 bg-cyan-950/50 border-cyan-500/30'
              }`}
            >
              <span>{activeMarketDef.name}</span>
            </div>

            <span className={`font-bold ${mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'}`}>→</span>

            <div
              className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg border transition-all ${
                selectedOptionId || (mode === 'SERIOUS' && stagedPredictions.length > 0)
                  ? mode === 'SERIOUS'
                    ? 'text-amber-200 bg-gradient-to-r from-amber-500/20 via-red-500/20 to-red-600/20 border-amber-500/50 ring-1 ring-amber-500/40 shadow-sm'
                    : 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40 ring-1 ring-emerald-500/30'
                  : 'text-slate-500 bg-slate-900/60 border-slate-800 italic'
              }`}
            >
              <span>
                {mode === 'SERIOUS' && stagedPredictions.length > 0
                  ? `${stagedPredictions.length} ${stagedPredictions.length === 1 ? 'Selection' : 'Selections'} in Set (Unlimited Picks)`
                  : selectedOptionId
                  ? `${selectedOptionId} (+${selectedOdds} pts${mode === 'SERIOUS' ? ' / -10 Risk' : ''})`
                  : 'Choose Prediction Option'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{activeMarketDef.name}</h3>
                {activeMarketDef.badge && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {activeMarketDef.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeMarketDef.shortDesc}</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                <strong>Click to select</strong>. <strong>Click again to deselect</strong>.
                {mode === 'SERIOUS' && (
                  <span className="ml-1 text-amber-400 font-bold">
                    (Make as many selections as you want!)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Market Options Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {marketOptions.map((opt) => {
              const isSelected =
                selectedOptionId === opt.id ||
                (mode === 'SERIOUS' && isStaged(activeMatch.id, activeMarketDef.id, opt.id));
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleOptionToggle(opt.id, opt.oddsPoints)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[78px] ${
                    isSelected
                      ? mode === 'SERIOUS'
                        ? 'bg-gradient-to-br from-amber-500/25 via-red-500/25 to-red-600/30 border-amber-500 text-amber-100 ring-2 ring-amber-500/60 shadow-xl shadow-red-500/30'
                        : 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-xs line-clamp-1">{opt.label}</span>
                    {isSelected && (
                      <span
                        className={`flex items-center justify-center w-4 h-4 rounded-full font-bold shrink-0 text-[10px] ${
                          mode === 'SERIOUS'
                            ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-sm'
                            : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {mode === 'SERIOUS' ? '🔥' : '✓'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs mt-auto pt-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-black font-mono ${
                          mode === 'SERIOUS'
                            ? isSelected
                              ? 'text-amber-300'
                              : 'text-amber-500'
                            : isSelected
                            ? 'text-emerald-400'
                            : 'text-emerald-500'
                        }`}
                      >
                        +{opt.oddsPoints} pts
                      </span>
                      {mode === 'SERIOUS' && isSelected && (
                        <span className="text-[9px] font-bold text-red-300 bg-red-950/80 px-1 py-0.2 rounded border border-red-500/30">
                          -10 risk
                        </span>
                      )}
                    </div>

                    {opt.badge && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-1 rounded">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Special Custom Score Inputs for Exact Score Market */}
          {activeMarketDef.id === 'EXACT_SCORE' && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Or Custom Score:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={customHome}
                  onChange={(e) => setCustomHome(e.target.value)}
                  className="w-14 sm:w-12 text-center bg-slate-900 border border-slate-700 rounded-lg py-2 sm:py-1 px-1 text-sm sm:text-xs text-white font-mono font-bold min-h-[38px] sm:min-h-0"
                />
                <span className="text-slate-500 font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={customAway}
                  onChange={(e) => setCustomAway(e.target.value)}
                  className="w-14 sm:w-12 text-center bg-slate-900 border border-slate-700 rounded-lg py-2 sm:py-1 px-1 text-sm sm:text-xs text-white font-mono font-bold min-h-[38px] sm:min-h-0"
                />
                <button
                  type="button"
                  onClick={() => handleOptionToggle(`${customHome}-${customAway}`, 30)}
                  className="px-3.5 py-2 sm:py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors min-h-[38px] sm:min-h-0"
                >
                  Select {customHome}-{customAway}
                </button>
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/60 border-red-500/40 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Action Submission Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              {mode === 'SERIOUS' ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Serious Set:</span>
                  <span className="px-2.5 py-1 rounded-lg font-bold font-mono border bg-red-950/60 text-amber-300 border-red-500/40 shadow-sm flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{stagedPredictions.length} {stagedPredictions.length === 1 ? 'pick' : 'picks'} selected</span>
                  </span>
                  <span className="text-[11px] text-amber-400 font-semibold">
                    (No limit: add as many selections as you want!)
                  </span>
                </div>
              ) : selectedOptionId ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Your Selection:</span>
                  <span className="px-2.5 py-1 rounded-lg font-bold font-mono border bg-slate-800 text-emerald-400 border-slate-700">
                    {activeMarketDef.name}: {selectedOptionId}
                  </span>
                  <span className="font-black text-emerald-400">
                    +{selectedOdds} pts
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">
                  Tap an option above to select it. Tap again to deselect.
                </span>
              )}
            </div>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Place Prediction</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={
                  (!selectedOptionId && stagedPredictions.length === 0) ||
                  submitting ||
                  isStarted ||
                  (mode === 'BASIC' && ((user?.basic_daily_count ?? user?.basic_pending_count ?? 0) >= 10))
                }
                className={`w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px] active:scale-95 ${
                  (!selectedOptionId && stagedPredictions.length === 0) ||
                  isStarted ||
                  (mode === 'BASIC' && ((user?.basic_daily_count ?? user?.basic_pending_count ?? 0) >= 10))
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : mode === 'BASIC'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white shadow-xl shadow-red-500/40 font-black'
                }`}
              >
                {submitting ? (
                  <span>Submitting Prediction...</span>
                ) : mode === 'BASIC' ? (
                  ((user?.basic_daily_count ?? user?.basic_pending_count ?? 0) >= 10) ? (
                    <>
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Daily Limit Reached (10/10 Today)</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Submit Basic Prediction (+{selectedOdds} pts)</span>
                    </>
                  )
                ) : (
                  <>
                    <Flame className="w-4 h-4 text-amber-200 animate-pulse" />
                    <span>
                      {stagedPredictions.length > 0
                        ? `Serious Set Ready (${stagedPredictions.length} ${stagedPredictions.length === 1 ? 'pick' : 'picks'} staged)`
                        : '+ Add to Serious Set'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
