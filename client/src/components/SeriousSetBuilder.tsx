import React, { useState } from 'react';
import { useGameMode } from '../context/GameModeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Flame,
  Trash2,
  AlertTriangle,
  Send,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface SeriousSetBuilderProps {
  onSuccess: () => void;
  onOpenAuth: () => void;
}

export const SeriousSetBuilder: React.FC<SeriousSetBuilderProps> = ({ onSuccess, onOpenAuth }) => {
  const { mode, stagedPredictions, removeStagedPrediction, clearStagedPredictions } = useGameMode();
  const { isAuthenticated, refreshUser } = useAuth();

  const [customName, setCustomName] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic accumulator title based on pick count
  const defaultTitle =
    stagedPredictions.length === 1
      ? 'Single Serious Pick'
      : stagedPredictions.length === 2
      ? 'Double Power Set'
      : stagedPredictions.length === 3
      ? 'Triple Accumulator'
      : stagedPredictions.length <= 5
      ? `${stagedPredictions.length}-Fold Accumulator`
      : `${stagedPredictions.length}-Fold Mega Multi`;

  const effectiveSetName = customName.trim() || defaultTitle;

  // Only show when in Serious Mode and there are staged items (or user collapsed it)
  if (mode !== 'SERIOUS' || stagedPredictions.length === 0) {
    return null;
  }

  const totalPotentialPoints = stagedPredictions.reduce((acc, p) => acc + p.oddsPoints, 0);

  const handleSubmitSet = async () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (stagedPredictions.length < 1) {
      setErrorMsg('Please select at least 1 prediction for your set.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await api.submitSeriousSet(
        effectiveSetName,
        stagedPredictions.map((p) => ({
          matchId: p.match.id,
          marketType: p.marketType,
          selection: p.selection,
        }))
      );
      await refreshUser();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
      clearStagedPredictions();
      setCustomName('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit Serious Set');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-2 right-2 sm:left-auto sm:right-4 z-40 w-auto sm:w-full max-w-none sm:max-w-md bg-slate-950/95 border border-rose-900/50 rounded-2xl shadow-xl shadow-rose-950/40 overflow-hidden backdrop-blur-xl transition-all duration-300">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-950 cursor-pointer select-none border-b border-rose-900/40"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/40 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-black text-white tracking-wide">
                SERIOUS SET BUILDER
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-700 text-white">
                {stagedPredictions.length} {stagedPredictions.length === 1 ? 'pick' : 'picks'}
              </span>
              <span className="text-[10px] text-rose-300 font-semibold hidden sm:inline">
                (Unlimited Picks)
              </span>
            </div>
            <p className="text-[10px] text-slate-300">
              Potential: <strong className="text-rose-300">+{totalPotentialPoints} pts</strong> • Risk: <strong className="text-rose-400">-10 pts</strong>
            </p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white p-1">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 sm:p-4 space-y-3 max-h-[19rem] sm:max-h-[26rem] overflow-y-auto">
          {/* Rule Alert */}
          <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/40 text-[11px] text-slate-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span>
                <strong>Unlimited Selections:</strong> You can add as many selections as you want to your set!
                All {stagedPredictions.length} {stagedPredictions.length === 1 ? 'prediction' : 'predictions'} must be
                correct to win (+{totalPotentialPoints} pts). If even 1 fails,{' '}
                <strong className="text-rose-400 underline">10 points will be deducted once</strong> for the entire set.
              </span>
            </div>
          </div>

          {/* Staged Items List */}
          <div className="space-y-1.5">
            {stagedPredictions.map((p, idx) => (
              <div
                key={`${p.match.id}-${p.marketType}-${p.selection}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs hover:border-rose-900/50 transition-colors"
              >
                <div className="truncate mr-2">
                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                    <span className="text-[10px] px-1 rounded bg-rose-950/80 text-rose-300 border border-rose-900/40">
                      #{idx + 1}
                    </span>
                    <span>
                      {p.match.home_team_short || p.match.home_team_name} vs{' '}
                      {p.match.away_team_short || p.match.away_team_name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{p.marketType}:</span>
                    <strong className="text-rose-300 font-mono">{p.selection}</strong>
                    <span className="text-emerald-400">(+{p.oddsPoints} pts)</span>
                  </div>
                </div>

                <button
                  onClick={() => removeStagedPrediction(p.match.id, p.marketType, p.selection)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-950/40 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Remove this selection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Set Name Input */}
          <div className="pt-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between mb-1">
              <span>Set Title / Accumulator Name:</span>
              <span className="text-[10px] text-slate-500">Optional</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={defaultTitle}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 sm:py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-600"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/40 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={clearStagedPredictions}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-colors min-h-[42px] sm:min-h-0"
              title="Clear all selections"
            >
              Clear
            </button>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all min-h-[42px] sm:min-h-0 bg-rose-700 hover:bg-rose-600 text-white shadow-rose-950/40 active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sign In to Lock In Set (+{totalPotentialPoints} pts)</span>
              </button>
            ) : (
              <button
                onClick={handleSubmitSet}
                disabled={submitting || stagedPredictions.length < 1}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all min-h-[42px] sm:min-h-0 active:scale-95 ${
                  stagedPredictions.length < 1
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-rose-700 hover:bg-rose-600 text-white shadow-md shadow-rose-950/40'
                }`}
              >
                {submitting ? (
                  <span>Submitting Set...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      Lock In Set ({stagedPredictions.length} {stagedPredictions.length === 1 ? 'pick' : 'picks'} • +{totalPotentialPoints} pts)
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
