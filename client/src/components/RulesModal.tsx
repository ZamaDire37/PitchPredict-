import React from 'react';
import { X, Shield, Flame, CheckCircle2, AlertTriangle, Trophy, Lock } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Game Rules & Scoring Architecture
              </h2>
              <p className="text-xs text-slate-400">Complete Guide to Basic and Serious Game Modes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
          {/* Virtual Points Disclaimer */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm">Virtual Prediction Competition</h4>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                PitchPredict is a skill-based football prediction platform for football fans. It uses
                real matches and current fixtures from European leagues. It is <strong>NOT a real-money betting site</strong>. There are zero deposits, withdrawals, or real-money wagering.
              </p>
            </div>
          </div>

          {/* TWO SEPARATE MODES COMPARISON */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BASIC MODE */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>Basic Mode (Risk-Free)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                <li>Make multiple independent predictions.</li>
                <li>
                  <strong className="text-emerald-400">Correct predictions:</strong> Earn points based on market odds.
                </li>
                <li>
                  <strong className="text-slate-200">Incorrect predictions:</strong> Earn 0 points.
                </li>
                <li>
                  <strong className="text-emerald-300 underline">NO negative point penalties</strong> ever in Basic Mode.
                </li>
                <li>Maintains its own separate Basic Mode points & leaderboard.</li>
              </ul>
            </div>

            {/* SERIOUS MODE */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Flame className="w-4 h-4" />
                <span>Serious Mode (High Stakes)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                <li>Predictions are grouped into <strong>Sets</strong> (multi-picks).</li>
                <li>
                  <strong className="text-amber-400">100% Correct Set:</strong> If every pick in the set is correct, award all points earned!
                </li>
                <li>
                  <strong className="text-red-400 underline">At least 1 wrong pick:</strong> Deducts 10 points ONCE for the entire set, regardless of how many failed.
                </li>
                <li>
                  If multiple sets fail, deducts 10 points for each failed set.
                </li>
                <li>Basic points and Serious points never mix or transfer.</li>
              </ul>
            </div>
          </div>

          {/* PREDICTION MARKETS TABLE */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Prediction Markets & Points Values
            </h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
              <div className="grid grid-cols-[1fr_auto] p-2.5 bg-slate-950 font-semibold text-slate-400 text-[11px]">
                <span>Market Type</span>
                <span>Points Awarded</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] p-2.5 bg-slate-900/60">
                <div>
                  <span className="font-bold text-white">Exact Score</span>
                  <p className="text-[10px] text-slate-400">E.g., 2-1, 1-1, 0-2 (Full 90 minutes)</p>
                </div>
                <span className="font-bold text-emerald-400 font-mono">+30 pts</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] p-2.5 bg-slate-900/60">
                <div>
                  <span className="font-bold text-white">Match Winner (1X2)</span>
                  <p className="text-[10px] text-slate-400">Home win, Away win, or Draw</p>
                </div>
                <span className="font-bold text-emerald-400 font-mono">+10 / +15 pts</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] p-2.5 bg-slate-900/60">
                <div>
                  <span className="font-bold text-white">Double Chance</span>
                  <p className="text-[10px] text-slate-400">1X (Home/Draw), 12 (Home/Away), X2 (Draw/Away)</p>
                </div>
                <span className="font-bold text-emerald-400 font-mono">+6 pts</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] p-2.5 bg-slate-900/60">
                <div>
                  <span className="font-bold text-white">Goals (Over / Under)</span>
                  <p className="text-[10px] text-slate-400">Over/Under 1.5, 2.5, 3.5 total goals</p>
                </div>
                <span className="font-bold text-emerald-400 font-mono">+8 to +12 pts</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] p-2.5 bg-slate-900/60">
                <div>
                  <span className="font-bold text-white">Corners (Over / Under)</span>
                  <p className="text-[10px] text-slate-400">Over/Under 8.5, 9.5, 10.5 total corners</p>
                </div>
                <span className="font-bold text-emerald-400 font-mono">+12 pts</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] p-2.5 bg-slate-900/60">
                <div>
                  <span className="font-bold text-white">Both Teams to Score (BTTS)</span>
                  <p className="text-[10px] text-slate-400">Yes or No</p>
                </div>
                <span className="font-bold text-emerald-400 font-mono">+10 pts</span>
              </div>
            </div>
          </div>

          {/* KICKOFF LOCK & REAL DATA */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Kickoff Lock & Automated Real-Time Grading</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Once a match kicks off, its predictions are strictly locked and can no longer be edited or cancelled. Once the match finishes, our backend scoring engine checks the final score and corners, automatically evaluates all predictions, and credits or deducts points according to your game mode!
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            Got it, Let's Predict!
          </button>
        </div>
      </div>
    </div>
  );
};
