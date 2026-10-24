import React from 'react';
import { useGameMode } from '../context/GameModeContext';
import { useAuth } from '../context/AuthContext';
import { Shield, Flame, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ModeBanner: React.FC = () => {
  const { mode } = useGameMode();
  const { user } = useAuth();

  return (
    <div className="w-full">
      {mode === 'BASIC' ? (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border-y border-emerald-500/20 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-medium">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                <Shield className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong className="text-white font-bold">BASIC MODE:</strong> Risk-free predictions. Correct predictions earn points. Incorrect predictions earn 0 points. <span className="text-emerald-400 underline decoration-emerald-500/50">No point penalties</span>.
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-3 text-slate-300 font-semibold bg-emerald-950/60 px-3 py-1 rounded-md border border-emerald-500/30">
                <span>Basic Bankroll: <strong className="text-emerald-400">{user.basic_points} pts</strong></span>
                <span>•</span>
                <span>Streak: <strong className="text-emerald-400">{user.basic_streak} 🔥</strong></span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-red-950/50 border-y border-amber-500/30 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-200 font-medium">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                <Flame className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong className="text-white font-bold">SERIOUS MODE:</strong> Predictions are grouped into sets. Win all to collect full points. <span className="text-red-400 font-bold underline decoration-red-500/50">If ANY pick fails, 10 points are deducted once</span> for that entire set!
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-3 text-slate-300 font-semibold bg-amber-950/60 px-3 py-1 rounded-md border border-amber-500/40">
                <span>Serious Bankroll: <strong className="text-amber-400">{user.serious_points} pts</strong></span>
                <span>•</span>
                <span>Streak: <strong className="text-amber-400">{user.serious_streak} ⚡</strong></span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
