import React, { useState } from 'react';
import { Match, StagedPrediction } from '../types';
import { useGameMode } from '../context/GameModeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Shield,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ShieldCheck,
  Target,
  Flag,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  CLIENT_MARKETS,
  CATEGORIES,
  MarketCategory,
} from '../services/marketRegistry';

interface PredictionModalProps {
  match: Match | null;
  onClose: () => void;
  onSuccess: () => void;
  onOpenAuth: () => void;
  onOpenRules?: (tab?: 'RULES' | 'ODDS') => void;
}

export const PredictionModal: React.FC<PredictionModalProps> = ({
  match,
  onClose,
  onSuccess,
  onOpenAuth,
  onOpenRules,
}) => {
  const { mode, addStagedPrediction, stagedPredictions } = useGameMode();
  const { isAuthenticated, refreshUser, user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<MarketCategory>('GOALS');
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [selectedSelection, setSelectedSelection] = useState<string | null>(null);
  const [selectedOdds, setSelectedOdds] = useState<number>(10);
  const [customHomeScore, setCustomHomeScore] = useState<string>('2');
  const [customAwayScore, setCustomAwayScore] = useState<string>('1');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!match) return null;

  const kickoffDate = new Date(match.utc_date);
  const isStarted = kickoffDate.getTime() <= Date.now();

  const homeName = match.home_team_short || match.home_team_name;
  const awayName = match.away_team_short || match.away_team_name;

  // Filter markets by active tab
  const activeMarkets = CLIENT_MARKETS.filter((m) => m.category === activeCategory);

  // Helper for toggle behavior:
  // "The prediction-type buttons must be selectable and clicking the same selected option again must deselect it."
  const handleToggleOption = (marketType: string, selection: string, odds: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (selectedMarket === marketType && selectedSelection === selection) {
      // Clicking same option deselects it
      setSelectedMarket(null);
      setSelectedSelection(null);
      setSelectedOdds(0);
    } else {
      setSelectedMarket(marketType);
      setSelectedSelection(selection);
      setSelectedOdds(odds);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMarket || !selectedSelection) {
      setErrorMsg('Please select a prediction option first.');
      return;
    }

    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (isStarted) {
      setErrorMsg('Match has already started. Predictions are locked.');
      return;
    }

    if (mode === 'BASIC') {
      const basicCount = user?.basic_daily_count ?? user?.basic_pending_count ?? 0;
      if (basicCount >= 10) {
        setErrorMsg('Daily limit reached in Basic Mode (10 selections per day).');
        return;
      }

      try {
        setSubmitting(true);
        setErrorMsg(null);
        await api.submitBasicPredictions([
          {
            matchId: match.id,
            marketType: selectedMarket,
            selection: selectedSelection,
          },
        ]);
        await refreshUser();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setSuccessMsg('Prediction saved successfully in Basic Mode!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to place prediction');
      } finally {
        setSubmitting(false);
      }
    } else {
      // SERIOUS MODE: stage into Serious Set Builder
      addStagedPrediction({
        match,
        marketType: selectedMarket,
        selection: selectedSelection,
        oddsPoints: selectedOdds,
      });
      setSuccessMsg(`Added to Serious Set! Open the Serious Set Builder below to complete your set.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    }
  };

  const getCategoryIcon = (catId: MarketCategory) => {
    switch (catId) {
      case 'GOALS':
        return <Target className="w-3.5 h-3.5" />;
      case 'CORNERS':
        return <Flag className="w-3.5 h-3.5" />;
      case 'FIRST_HALF':
        return <Clock className="w-3.5 h-3.5" />;
      case 'BOOKINGS':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'MATCH_RESULT':
        return <Trophy className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col pb-safe">
        {/* Mobile Drag Handle Indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-xl font-bold ${
                mode === 'BASIC'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
              }`}
            >
              {mode === 'BASIC' ? <Shield className="w-4 h-4" /> : <Flame className="w-4 h-4 text-rose-400" />}
            </span>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-white">
                Place Prediction ({mode === 'BASIC' ? 'Basic Mode' : 'Serious Mode'})
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">{match.competition_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Overview Bar */}
        <div className="shrink-0 p-3 sm:p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
            {match.home_team_crest && (
              <img src={match.home_team_crest} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            )}
            <span className="truncate max-w-[120px] sm:max-w-none">{homeName}</span>
          </div>

          <div className="text-center">
            <span className="text-xs font-black text-slate-500">VS</span>
            <div className="text-[10px] sm:text-[11px] text-slate-400">
              {kickoffDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
            <span className="truncate max-w-[120px] sm:max-w-none">{awayName}</span>
            {match.away_team_crest && (
              <img src={match.away_team_crest} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            )}
          </div>
        </div>

        {/* ================= PREDICTION CATEGORY TABS ================= */}
        <div className="shrink-0 px-3 sm:px-6 pt-2.5 pb-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? mode === 'SERIOUS'
                      ? 'bg-rose-950/60 text-rose-200 border-rose-700/70 shadow-sm'
                      : 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {/* Guest User Callout */}
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">Viewing Markets as Guest</span>
                  <p className="text-[11px] text-slate-400">Create an account or sign in to submit predictions.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all whitespace-nowrap"
              >
                Sign In / Register
              </button>
            </div>
          )}

          {/* Instruction Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Tap an option to select it. <strong>Tap the same option again to deselect it.</strong>{' '}
              {mode === 'BASIC'
                ? 'Predictions are risk-free (0 points deducted for misses, limit 10/day).'
                : 'Picks will be added to your Serious Multi-Set (-10 pts penalty if any 1 fails).'}
            </span>
          </div>

          {/* DYNAMIC MARKETS FOR ACTIVE TAB */}
          <div className="space-y-6">
            {activeMarkets.map((market) => {
              const options = market.getOptions(homeName, awayName);
              return (
                <div key={market.id} className="space-y-2 p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span>{market.name}</span>
                      {market.badge && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-semibold">
                          {market.badge}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500">{market.shortDesc}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {options.map((opt) => {
                      const isSelected =
                        selectedMarket === market.id && selectedSelection === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleToggleOption(market.id, opt.id, opt.oddsPoints)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? mode === 'SERIOUS'
                                ? 'bg-rose-950/60 border-rose-600 text-rose-200 ring-2 ring-rose-500/40 font-bold'
                                : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="text-xs truncate font-semibold">{opt.label}</div>
                          <div
                            className={`text-[11px] font-bold mt-1 ${
                              mode === 'SERIOUS' ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            +{opt.oddsPoints} pts
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* If exact score, offer custom score builder */}
                  {market.id === 'EXACT_SCORE' && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 mt-2">
                      <span className="text-xs text-slate-400">Custom Score:</span>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={customHomeScore}
                        onChange={(e) => setCustomHomeScore(e.target.value)}
                        className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs text-white font-mono"
                      />
                      <span className="text-slate-500 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={customAwayScore}
                        onChange={(e) => setCustomAwayScore(e.target.value)}
                        className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleOption('EXACT_SCORE', `${customHomeScore}-${customAwayScore}`, 30)
                        }
                        className="ml-auto px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Set {customHomeScore}-{customAwayScore} (+30 pts)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/40 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 p-3 sm:p-5 border-t border-slate-800 bg-slate-950/95 sticky bottom-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-300 w-full sm:w-auto text-center sm:text-left">
            {selectedSelection ? (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-slate-400">Selected:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold font-mono">
                  {selectedMarket} ({selectedSelection})
                </span>
                <span className={`font-bold ${mode === 'SERIOUS' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  +{selectedOdds} pts
                </span>
              </div>
            ) : (
              <span className="text-slate-500 text-[11px] sm:text-xs">Tap an option to select. Tap again to deselect.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors min-h-[44px] sm:min-h-[38px] active:scale-95"
            >
              Cancel
            </button>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex-1 sm:flex-none px-6 py-2.5 sm:py-2 rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95 min-h-[44px] sm:min-h-[38px]"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sign In to Place Prediction</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!selectedSelection || submitting || isStarted}
                className={`flex-1 sm:flex-none px-6 py-2.5 sm:py-2 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[38px] active:scale-95 ${
                  !selectedSelection || isStarted
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : mode === 'BASIC'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-rose-700 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                }`}
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : mode === 'BASIC' ? (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Submit Basic Prediction</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5 text-rose-300" />
                    <span>Add to Serious Set</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
