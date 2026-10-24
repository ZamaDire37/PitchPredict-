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
} from 'lucide-react';

interface SeriousSetBuilderProps {
  onSuccess: () => void;
  onOpenAuth: () => void;
}

export const SeriousSetBuilder: React.FC<SeriousSetBuilderProps> = ({ onSuccess, onOpenAuth }) => {
  const { mode, stagedPredictions, removeStagedPrediction, clearStagedPredictions } = useGameMode();
  const { isAuthenticated, refreshUser } = useAuth();

  const [setName, setSetName] = useState<string>('Weekend Power Multi');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    if (stagedPredictions.length < 2) {
      setErrorMsg('Serious Mode sets require at least 2 predictions.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await api.submitSeriousSet(
        setName,
        stagedPredictions.map((p) => ({
          matchId: p.match.id,
          marketType: p.marketType,
          selection: p.selection,
        }))
      );
      await refreshUser();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
      clearStagedPredictions();
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit Serious Set');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm sm:max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-950/40 overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-red-950/80 cursor-pointer select-none border-b border-amber-500/20"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
            <Flame className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-wide">
                SERIOUS SET BUILDER
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                {stagedPredictions.length} picks
              </span>
            </div>
            <p className="text-[10px] text-amber-300/80">
              Potential Reward: <strong>+{totalPotentialPoints} pts</strong>
            </p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white p-1">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
          {/* Rule Alert */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Serious Mode Rule:</strong> All {stagedPredictions.length} predictions must be
              correct to win. If even 1 fails,{' '}
              <strong className="text-red-400 underline">10 points will be deducted once</strong> for
              the entire set.
            </span>
          </div>

          {/* Staged Items List */}
          <div className="space-y-1.5">
            {stagedPredictions.map((p) => (
              <div
                key={`${p.match.id}-${p.marketType}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
              >
                <div className="truncate mr-2">
                  <div className="font-bold text-white truncate">
                    {p.match.home_team_short || p.match.home_team_name} vs{' '}
                    {p.match.away_team_short || p.match.away_team_name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>{p.marketType}:</span>
                    <strong className="text-amber-400 font-mono">{p.selection}</strong>
                    <span className="text-emerald-400">(+{p.oddsPoints} pts)</span>
                  </div>
                </div>

                <button
                  onClick={() => removeStagedPrediction(p.match.id, p.marketType)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  title="Remove selection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Set Name Input */}
          <div className="pt-2">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Set Title / Accumulator Name:
            </label>
            <input
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="e.g., Champions League Treble"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={clearStagedPredictions}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-colors"
            >
              Clear
            </button>

            <button
              onClick={handleSubmitSet}
              disabled={submitting || stagedPredictions.length < 2}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
                stagedPredictions.length < 2
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white shadow-amber-500/20'
              }`}
            >
              {submitting ? (
                <span>Submitting Set...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    Lock In Serious Set (+{totalPotentialPoints} pts / -10 risk)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
