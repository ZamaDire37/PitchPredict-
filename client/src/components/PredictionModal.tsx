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
} from 'lucide-react';

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
  const { isAuthenticated, refreshUser } = useAuth();

  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [selectedSelection, setSelectedSelection] = useState<string | null>(null);
  const [customHomeScore, setCustomHomeScore] = useState<string>('2');
  const [customAwayScore, setCustomAwayScore] = useState<string>('1');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!match) return null;

  const kickoffDate = new Date(match.utc_date);
  const isStarted = kickoffDate.getTime() <= Date.now();

  // Helper for option toggle behavior:
  // "The prediction-type buttons must be selectable and clicking the same selected option again must deselect it."
  const handleToggleOption = (marketType: string, selection: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (selectedMarket === marketType && selectedSelection === selection) {
      // Clicking the same selected option again DESELECTS IT
      setSelectedMarket(null);
      setSelectedSelection(null);
    } else {
      setSelectedMarket(marketType);
      setSelectedSelection(selection);
    }
  };

  const getPointsForSelection = (marketType: string, selection: string): number => {
    switch (marketType) {
      case 'EXACT_SCORE':
        return 30;
      case 'CORNERS_OVER_UNDER':
        return 12;
      case 'BTTS':
        return 10;
      case 'GOALS_OVER_UNDER':
        if (selection.includes('1.5')) return 8;
        if (selection.includes('2.5')) return 10;
        if (selection.includes('3.5')) return 12;
        return 10;
      case 'DOUBLE_CHANCE':
        return 6;
      case 'MATCH_WINNER':
        return selection === 'DRAW' ? 15 : 10;
      default:
        return 10;
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

    const oddsPoints = getPointsForSelection(selectedMarket, selectedSelection);

    if (mode === 'BASIC') {
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
      // SERIOUS MODE: stage the prediction into the Serious Set Builder
      addStagedPrediction({
        match,
        marketType: selectedMarket,
        selection: selectedSelection,
        oddsPoints,
      });
      setSuccessMsg(`Added to Serious Set! Open the Serious Set Builder below to complete your set.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    }
  };

  const commonExactScores = [
    '1-0', '2-0', '2-1', '3-0', '3-1', '3-2',
    '0-0', '1-1', '2-2', '3-3',
    '0-1', '0-2', '1-2', '0-3', '1-3', '2-3',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-xl ${
                mode === 'BASIC'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {mode === 'BASIC' ? <Shield className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Place Prediction ({mode === 'BASIC' ? 'Basic Mode' : 'Serious Mode'})
              </h2>
              <p className="text-xs text-slate-400">{match.competition_name}</p>
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
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            {match.home_team_crest && (
              <img src={match.home_team_crest} alt="" className="w-6 h-6 object-contain" />
            )}
            <span>{match.home_team_short || match.home_team_name}</span>
          </div>

          <div className="text-center">
            <span className="text-xs font-black text-slate-500">VS</span>
            <div className="text-[11px] text-slate-400">
              {kickoffDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span>{match.away_team_short || match.away_team_name}</span>
            {match.away_team_crest && (
              <img src={match.away_team_crest} alt="" className="w-6 h-6 object-contain" />
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Guest User Callout */}
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">Viewing Match Markets as Guest</span>
                  <p className="text-[11px] text-slate-400">Fixtures, odds and head-to-head stats are open. Create an account or sign in to submit predictions.</p>
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
                ? 'Predictions are risk-free (0 points deducted for misses).'
                : 'Picks will be added to your Serious Multi-Set (-10 pts penalty if any 1 fails).'}
            </span>
          </div>

          {/* MARKET 1: Match Winner (1X2) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Match Winner (1X2)</span>
              <span className="text-[11px] text-slate-500">Regular 90 mins</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: match.home_team_short || 'Home', sel: 'HOME', pts: 10 },
                { label: 'Draw (X)', sel: 'DRAW', pts: 15 },
                { label: match.away_team_short || 'Away', sel: 'AWAY', pts: 10 },
              ].map((opt) => {
                const isSelected =
                  selectedMarket === 'MATCH_WINNER' && selectedSelection === opt.sel;
                return (
                  <button
                    key={opt.sel}
                    type="button"
                    onClick={() => handleToggleOption('MATCH_WINNER', opt.sel)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs truncate font-semibold">{opt.label}</div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-1">+{opt.pts} pts</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MARKET 2: Double Chance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Double Chance</span>
              <span className="text-[11px] text-slate-500">Two potential outcomes</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '1X (Home or Draw)', sel: '1X', pts: 6 },
                { label: '12 (Home or Away)', sel: '12', pts: 6 },
                { label: 'X2 (Draw or Away)', sel: 'X2', pts: 6 },
              ].map((opt) => {
                const isSelected =
                  selectedMarket === 'DOUBLE_CHANCE' && selectedSelection === opt.sel;
                return (
                  <button
                    key={opt.sel}
                    type="button"
                    onClick={() => handleToggleOption('DOUBLE_CHANCE', opt.sel)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs truncate font-semibold">{opt.label}</div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-1">+{opt.pts} pts</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MARKET 3: Goals Over / Under */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Total Match Goals (Over / Under)</span>
              <span className="text-[11px] text-slate-500">Both teams combined</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Over 1.5 Goals', sel: 'OVER_1.5', pts: 8 },
                { label: 'Under 1.5 Goals', sel: 'UNDER_1.5', pts: 8 },
                { label: 'Over 2.5 Goals', sel: 'OVER_2.5', pts: 10 },
                { label: 'Under 2.5 Goals', sel: 'UNDER_2.5', pts: 10 },
                { label: 'Over 3.5 Goals', sel: 'OVER_3.5', pts: 12 },
                { label: 'Under 3.5 Goals', sel: 'UNDER_3.5', pts: 12 },
              ].map((opt) => {
                const isSelected =
                  selectedMarket === 'GOALS_OVER_UNDER' && selectedSelection === opt.sel;
                return (
                  <button
                    key={opt.sel}
                    type="button"
                    onClick={() => handleToggleOption('GOALS_OVER_UNDER', opt.sel)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-0.5">+{opt.pts} pts</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MARKET 4: Corners Over / Under */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Corners (Over / Under)</span>
              <span className="text-[11px] text-slate-500">Total match corners</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Over 8.5 Corners', sel: 'OVER_8.5', pts: 12 },
                { label: 'Under 8.5 Corners', sel: 'UNDER_8.5', pts: 12 },
                { label: 'Over 9.5 Corners', sel: 'OVER_9.5', pts: 12 },
                { label: 'Under 9.5 Corners', sel: 'UNDER_9.5', pts: 12 },
                { label: 'Over 10.5 Corners', sel: 'OVER_10.5', pts: 12 },
                { label: 'Under 10.5 Corners', sel: 'UNDER_10.5', pts: 12 },
              ].map((opt) => {
                const isSelected =
                  selectedMarket === 'CORNERS_OVER_UNDER' && selectedSelection === opt.sel;
                return (
                  <button
                    key={opt.sel}
                    type="button"
                    onClick={() => handleToggleOption('CORNERS_OVER_UNDER', opt.sel)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-0.5">+{opt.pts} pts</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MARKET 5: Both Teams To Score (BTTS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Both Teams to Score (BTTS)</span>
              <span className="text-[11px] text-slate-500">Yes or No</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Yes (Both Score)', sel: 'YES', pts: 10 },
                { label: 'No (At least one clean sheet)', sel: 'NO', pts: 10 },
              ].map((opt) => {
                const isSelected =
                  selectedMarket === 'BTTS' && selectedSelection === opt.sel;
                return (
                  <button
                    key={opt.sel}
                    type="button"
                    onClick={() => handleToggleOption('BTTS', opt.sel)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-1">+{opt.pts} pts</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MARKET 6: Exact Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>Exact Score</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  HIGH REWARD
                </span>
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">+30 pts</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {commonExactScores.map((score) => {
                const isSelected =
                  selectedMarket === 'EXACT_SCORE' && selectedSelection === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleToggleOption('EXACT_SCORE', score)}
                    className={`py-2 px-1 rounded-xl border text-center text-xs font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>

            {/* Custom Score input */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 mt-2">
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
                  handleToggleOption('EXACT_SCORE', `${customHomeScore}-${customAwayScore}`)
                }
                className="ml-auto px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Set {customHomeScore}-{customAwayScore}
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
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
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            {selectedSelection ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Selected:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold font-mono">
                  {selectedMarket} ({selectedSelection})
                </span>
                <span className="text-emerald-400 font-bold">
                  +{getPointsForSelection(selectedMarket!, selectedSelection)} pts
                </span>
              </div>
            ) : (
              <span className="text-slate-500">Tap any option above to select. Tap again to deselect.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sign In to Place Prediction</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!selectedSelection || submitting || isStarted}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                  !selectedSelection || isStarted
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : mode === 'BASIC'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white shadow-amber-500/20'
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
                    <Flame className="w-3.5 h-3.5" />
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
