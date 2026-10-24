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
import { api } from '../services/api';
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
} from 'lucide-react';

interface MarketsSectionProps {
  matches: Match[];
  onOpenAuth: () => void;
  onRefreshData: () => void;
}

export const MarketsSection: React.FC<MarketsSectionProps> = ({
  matches,
  onOpenAuth,
  onRefreshData,
}) => {
  const { mode, addStagedPrediction } = useGameMode();
  const { isAuthenticated, refreshUser } = useAuth();

  // 1. Fixture Selection (tied to real matches only)
  const scheduledMatches = matches.filter(
    (m) => m.status === 'TIMED' || m.status === 'SCHEDULED' || m.status === 'IN_PLAY'
  );
  const [selectedMatchId, setSelectedMatchId] = useState<number>(
    scheduledMatches[0]?.id || matches[0]?.id || 0
  );

  const activeMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

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
  // "intuitive click to select, click again to deselect, and clear highlighting"
  const handleOptionToggle = (optionId: string, odds: number) => {
    setFeedback(null);
    if (selectedOptionId === optionId) {
      // Click again to DESELECT!
      setSelectedOptionId(null);
      setSelectedOdds(0);
    } else {
      // Click to SELECT!
      setSelectedOptionId(optionId);
      setSelectedOdds(odds);
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-white">Prediction Market Center</h2>
                <p className="text-xs text-slate-400">
                  Select your market category first, choose your line, and lock in your prediction.
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
              className="w-full sm:w-72 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-500 shadow-inner"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.competition_name}: {m.home_team_name} vs {m.away_team_name} (
                  {new Date(m.utc_date).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Match Banner Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border">
          <div className="flex items-center gap-3">
            {activeMatch.home_team_crest && (
              <img src={activeMatch.home_team_crest} alt="" className="w-7 h-7 object-contain" />
            )}
            <span className="text-sm font-bold text-white">
              {activeMatch.home_team_short || activeMatch.home_team_name}
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">vs</span>
            <span className="text-sm font-bold text-white">
              {activeMatch.away_team_short || activeMatch.away_team_name}
            </span>
            {activeMatch.away_team_crest && (
              <img src={activeMatch.away_team_crest} alt="" className="w-7 h-7 object-contain" />
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">{activeMatch.competition_name}</span>
            <span className="text-slate-600">•</span>
            {isStarted ? (
              <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Lock className="w-3 h-3" /> Kickoff Passed (Locked)
              </span>
            ) : (
              <span className="flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <Clock className="w-3 h-3" />
                {kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
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
                    ? 'bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-500/10 text-white ring-2 ring-emerald-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-950 text-slate-400 group-hover:text-emerald-400'
                    }`}
                  >
                    {getCategoryIcon(cat.id)}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
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
                    ? 'bg-slate-800 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
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
              </span>
            </div>
          </div>

          {/* Market Options Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {marketOptions.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleOptionToggle(opt.id, opt.oddsPoints)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[75px] ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-xs line-clamp-1">{opt.label}</span>
                    {isSelected && (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold shrink-0 text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs mt-auto pt-1">
                    <span
                      className={`font-black font-mono ${
                        isSelected ? 'text-emerald-400' : 'text-emerald-500'
                      }`}
                    >
                      +{opt.oddsPoints} pts
                    </span>
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
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Or Custom Score:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={customHome}
                  onChange={(e) => setCustomHome(e.target.value)}
                  className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs text-white font-mono font-bold"
                />
                <span className="text-slate-500 font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={customAway}
                  onChange={(e) => setCustomAway(e.target.value)}
                  className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs text-white font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleOptionToggle(`${customHome}-${customAway}`, 30)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
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
              {selectedOptionId ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Your Selection:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 font-bold font-mono border border-slate-700">
                    {activeMarketDef.name}: {selectedOptionId}
                  </span>
                  <span className="text-emerald-400 font-bold">+{selectedOdds} pts</span>
                </div>
              ) : (
                <span className="text-slate-500">
                  Tap an option above to select it. Tap again to deselect.
                </span>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId || submitting || isStarted}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                !selectedOptionId || isStarted
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : mode === 'BASIC'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white shadow-amber-500/20'
              }`}
            >
              {submitting ? (
                <span>Submitting Prediction...</span>
              ) : mode === 'BASIC' ? (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Submit Basic Prediction (+{selectedOdds} pts)</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  <span>Add to Serious Set (+{selectedOdds} pts)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
