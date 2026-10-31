import React, { useState } from 'react';
import {
  X,
  Shield,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Lock,
  Target,
  BarChart3,
  HelpCircle,
  Zap,
  Sparkles,
  Info,
} from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
  initialTab?: 'RULES' | 'ODDS';
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose, initialTab = 'RULES' }) => {
  const [activeTab, setActiveTab] = useState<'RULES' | 'ODDS'>(initialTab);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-emerald-500/30 shrink-0 shadow-sm shadow-emerald-500/10">
              <img src="/logo.png" alt="PitchPredict" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-white">
                Game Guide & Odds Architecture
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Rules, 10 Daily Limit & Points Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="shrink-0 flex border-b border-slate-800 bg-slate-950 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('RULES')}
            className={`flex-1 py-2.5 sm:py-3 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'RULES'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-900/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Rules & Modes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ODDS')}
            className={`flex-1 py-2.5 sm:py-3 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'ODDS'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-900/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="flex items-center gap-1">
              <span>Market Odds</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-extrabold">
                Guide
              </span>
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain text-xs text-slate-300 pb-6">
          {activeTab === 'RULES' ? (
            /* ================= TAB 1: GAME RULES & MODES ================= */
            <>
              {/* Virtual Points Disclaimer */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Virtual Prediction Competition</h4>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    PitchPredict is a skill-based prediction competition for football fans using verified real match fixtures from European leagues. It is <strong>NOT a real-money gambling site</strong>. There are zero deposits, withdrawals, or monetary stakes.
                  </p>
                </div>
              </div>

              {/* All users start at 0 points announcement */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-300 text-sm">Fair Start: 0 Initial Points for All Accounts</h4>
                  <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                    All new official accounts start at <strong>0 Basic Points</strong> and <strong>0 Serious Points</strong>. Everyone begins on equal footing — your balance increases exclusively by predicting real match outcomes correctly.
                  </p>
                </div>
              </div>

              {/* TWO SEPARATE MODES COMPARISON */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BASIC MODE */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Shield className="w-4 h-4" />
                      <span>Basic Mode (Risk-Free)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      10 Picks / Day
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                    <li>
                      <strong className="text-emerald-300">10 Daily Selections Limit:</strong> Users can make a maximum of <strong>10 predictions per calendar day</strong> (UTC day, resets daily at 00:00 UTC).
                    </li>
                    <li>
                      <strong className="text-emerald-400">Correct predictions:</strong> Earn points based on the market odds matrix (e.g. +10, +30, +50 pts).
                    </li>
                    <li>
                      <strong className="text-slate-200">Incorrect predictions:</strong> Earn 0 points.
                    </li>
                    <li>
                      <strong className="text-emerald-300 underline">NO negative point penalties</strong> ever in Basic Mode.
                    </li>
                    <li>Editing an upcoming pick you placed today does not consume extra daily slots.</li>
                    <li>Maintains an independent Basic Points balance & leaderboard.</li>
                  </ul>
                </div>

                {/* SERIOUS MODE */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Flame className="w-4 h-4" />
                      <span>Serious Mode (High Stakes)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                      -10 Penalty
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                    <li>
                      Predictions are grouped into custom <strong>Sets</strong> (<strong>Make as many selections as you want!</strong>).
                    </li>
                    <li>
                      <strong className="text-amber-400">100% Perfect Set:</strong> If every single pick in your set is correct, you win all accumulated points!
                    </li>
                    <li>
                      <strong className="text-red-400 underline font-bold">At least 1 wrong pick:</strong> Deducts <strong>10 points ONCE</strong> for the entire set, regardless of how many failed.
                    </li>
                    <li>If multiple sets fail, 10 points are deducted per failed set.</li>
                    <li>Serious points and Basic points never cross over or interfere.</li>
                  </ul>
                </div>
              </div>

              {/* KICKOFF LOCK & AUTOMATED GRADING */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Kickoff Lock & Automated Real-Time Grading</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The exact moment a match kicks off, all predictions on that fixture are permanently locked and cannot be edited or voided. When the match completes, our backend scoring engine checks the final score, corners, and statistics, evaluates all user predictions, and credits or deducts points in real time.
                </p>
              </div>
            </>
          ) : (
            /* ================= TAB 2: HOW MARKET ODDS POINTS ARE DETERMINED ================= */
            <>
              {/* Introduction Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-950 to-slate-900 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <BarChart3 className="w-4 h-4" />
                  <span>The Odds & Points Determination Philosophy</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  In traditional bookmaking, odds reflect the implied probability of an event happening. In PitchPredict, we translate this probability directly into an integer <strong>Points Value Matrix</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">High Probability (Safe)</span>
                    <span className="text-emerald-400 font-black text-sm font-mono">+5 to +8 pts</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Low risk, frequent wins</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Standard 50/50 Markets</span>
                    <span className="text-cyan-400 font-black text-sm font-mono">+10 to +12 pts</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Core balance & skill</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Rare & Exact Scores</span>
                    <span className="text-amber-400 font-black text-sm font-mono">+14 to +50 pts</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Maximum point multipliers</span>
                  </div>
                </div>
              </div>

              {/* TIER 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs">
                      1
                    </span>
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Tier 1: High Probability & Double Coverage (5 – 8 Points)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Lower Risk
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Designed for steady point accumulation. These selections cover the vast majority of match scenarios:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Double Chance (1X, 12, X2):</strong> Covers 2 of 3 outcomes</span>
                    <span className="font-bold font-mono text-emerald-400">+6 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Over 0.5 Goals:</strong> Any goal in the entire match</span>
                    <span className="font-bold font-mono text-emerald-400">+5 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Under 5.5 Goals:</strong> 5 or fewer goals scored</span>
                    <span className="font-bold font-mono text-emerald-400">+6 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Draw No Bet (DNB):</strong> Push/refund if match is drawn</span>
                    <span className="font-bold font-mono text-emerald-400">+8 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Over 1.5 Goals:</strong> 2+ total goals (~78% of games)</span>
                    <span className="font-bold font-mono text-emerald-400">+8 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>2 - 3 Goals Range:</strong> Most common goal band</span>
                    <span className="font-bold font-mono text-emerald-400">+8 pts</span>
                  </div>
                </div>
              </div>

              {/* TIER 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs">
                      2
                    </span>
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Tier 2: Standard 50/50 & Core Markets (10 – 12 Points)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    Standard Core
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  The foundational football markets where outcome probabilities are closely balanced:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Match Winner (Home / Away Win):</strong> Regular 90m outcome</span>
                    <span className="font-bold font-mono text-cyan-400">+10 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Both Teams to Score (BTTS Yes / No):</strong> 50/50 baseline</span>
                    <span className="font-bold font-mono text-cyan-400">+10 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Over / Under 2.5 Goals:</strong> The universal goals line</span>
                    <span className="font-bold font-mono text-cyan-400">+10 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Odd / Even Total Goals:</strong> Binary match distribution</span>
                    <span className="font-bold font-mono text-cyan-400">+10 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Corners Over / Under 8.5 & 9.5:</strong> Standard corner line</span>
                    <span className="font-bold font-mono text-cyan-400">+10 to +12 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Home Clean Sheet:</strong> Home team keeps shutout</span>
                    <span className="font-bold font-mono text-cyan-400">+12 pts</span>
                  </div>
                </div>
              </div>

              {/* TIER 3 */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs">
                      3
                    </span>
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Tier 3: Strategic Combos, Handicaps & Margins (14 – 25 Points)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Strategic Combos
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Requires predicting multiple correlated events or overcoming mathematical handicaps:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Full-Time Draw (X):</strong> Draws occur in ~24% of fixtures</span>
                    <span className="font-bold font-mono text-amber-400">+15 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>European Handicap (-1):</strong> Win by 2+ goals or exact 1</span>
                    <span className="font-bold font-mono text-amber-400">+14 to +18 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Result + Over 2.5 Goals:</strong> Combo winner and 3+ goals</span>
                    <span className="font-bold font-mono text-amber-400">+18 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>BTTS & Match Winner:</strong> Both teams score & winner decided</span>
                    <span className="font-bold font-mono text-amber-400">+20 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Draw & Over 2.5 Goals:</strong> High-scoring tie (e.g. 2-2)</span>
                    <span className="font-bold font-mono text-amber-400">+24 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Winning Margin (By 1, 2+, Blowout 3+):</strong> Goal gap precision</span>
                    <span className="font-bold font-mono text-amber-400">+14 to +22 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>BTTS Yes & Under 2.5:</strong> Only possible via 1-1 draw</span>
                    <span className="font-bold font-mono text-amber-400">+25 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>12+ Match Corners:</strong> Heavy corner barrage</span>
                    <span className="font-bold font-mono text-amber-400">+15 to +22 pts</span>
                  </div>
                </div>
              </div>

              {/* TIER 4 */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-red-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 font-black flex items-center justify-center text-xs">
                      4
                    </span>
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Tier 4: Precision Exact Scores & Extreme Outliers (30 – 50 Points!)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    Highest Multiplier
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  The most challenging predictions in football. Exact scorelines carry the highest point payouts:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Standard Exact Scores (1-0, 2-0, 2-1, 1-1, 0-1, 0-2):</strong> Common scorelines</span>
                    <span className="font-bold font-mono text-emerald-400">+30 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Under 0.5 Goals (0-0 Bore Draw):</strong> Only ~7% of games</span>
                    <span className="font-bold font-mono text-amber-400">+35 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>High Scoring Thrillers (3-2, 2-3, 4-1, 1-4):</strong> 5-goal thrillers</span>
                    <span className="font-bold font-mono text-amber-400">+35 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>Dominant Blowouts (4-0, 0-4):</strong> 4-goal shutouts</span>
                    <span className="font-bold font-mono text-amber-400">+40 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>3 - 3 Epic Draw:</strong> 6-goal draw rarity</span>
                    <span className="font-bold font-mono text-red-400">+45 pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span><strong>4 - 2 / 2 - 4 Wild Shootouts:</strong> Ultimate score payout</span>
                    <span className="font-bold font-mono text-red-400 font-black">+50 pts 🔥</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-safe">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 text-center sm:text-left">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Scores & corners verified automatically from official match results</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 min-h-[40px] sm:min-h-0"
          >
            Got it, Let's Predict!
          </button>
        </div>
      </div>
    </div>
  );
};
