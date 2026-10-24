import React from 'react';
import { Match } from '../types';
import { useGameMode } from '../context/GameModeContext';
import { Clock, Lock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Trophy } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onSelectMatch: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelectMatch }) => {
  const { mode } = useGameMode();
  const kickoffDate = new Date(match.utc_date);
  const now = new Date();
  const isStarted = kickoffDate.getTime() <= now.getTime();
  const isFinished = match.status === 'FINISHED';
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';

  // Format date/time
  const isToday = kickoffDate.toDateString() === now.toDateString();
  const isTomorrow =
    new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === kickoffDate.toDateString();

  let timeDisplay = kickoffDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let datePrefix = isToday
    ? 'Today'
    : isTomorrow
    ? 'Tomorrow'
    : kickoffDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  // Check user predictions on this match
  const userPredictions = match.userPredictions || [];
  const activeModePredictions = userPredictions.filter((p) => p.mode === mode);

  return (
    <div
      onClick={() => !isStarted && onSelectMatch(match)}
      className={`group relative bg-slate-900/90 rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
        isStarted
          ? 'border-slate-800/80 opacity-90 cursor-default'
          : 'border-slate-800 hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:shadow-xl cursor-pointer hover:-translate-y-0.5'
      }`}
    >
      {/* Top Header: Competition & Kickoff / Status */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/70 text-xs">
        <div className="flex items-center gap-2">
          {match.competition_emblem ? (
            <img
              src={match.competition_emblem}
              alt={match.competition_name}
              className="w-4 h-4 object-contain"
            />
          ) : (
            <Trophy className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="font-semibold text-slate-300 truncate max-w-[150px] sm:max-w-[200px]">
            {match.competition_name}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 text-[11px]">Matchday {match.matchday}</span>
        </div>

        {/* Status Badge */}
        <div>
          {isLive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              LIVE
            </span>
          ) : isFinished ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              FT (Finished)
            </span>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {datePrefix} {timeDisplay}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Card Body: Teams and Scores */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800/80 p-2 flex items-center justify-center border border-slate-700/60 mb-2 shadow-inner">
              {match.home_team_crest ? (
                <img
                  src={match.home_team_crest}
                  alt={match.home_team_name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow"
                />
              ) : (
                <span className="font-bold text-slate-400 text-sm">
                  {match.home_team_short?.slice(0, 3) || 'HOM'}
                </span>
              )}
            </div>
            <span className="font-bold text-slate-100 text-xs sm:text-sm line-clamp-1">
              {match.home_team_short || match.home_team_name}
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:block">Home</span>
          </div>

          {/* Middle: Score or VS */}
          <div className="flex flex-col items-center justify-center min-w-[70px]">
            {isFinished || isLive ? (
              <div className="flex flex-col items-center">
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 font-mono">
                  {match.home_score ?? 0} - {match.away_score ?? 0}
                </div>
                {match.home_corners !== null && match.away_corners !== null && (
                  <span className="text-[10px] text-slate-400 mt-1">
                    🚩 {match.home_corners} : {match.away_corners} corners
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-800/70 text-slate-400 tracking-wider">
                  VS
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800/80 p-2 flex items-center justify-center border border-slate-700/60 mb-2 shadow-inner">
              {match.away_team_crest ? (
                <img
                  src={match.away_team_crest}
                  alt={match.away_team_name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow"
                />
              ) : (
                <span className="font-bold text-slate-400 text-sm">
                  {match.away_team_short?.slice(0, 3) || 'AWY'}
                </span>
              )}
            </div>
            <span className="font-bold text-slate-100 text-xs sm:text-sm line-clamp-1">
              {match.away_team_short || match.away_team_name}
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:block">Away</span>
          </div>
        </div>

        {/* Existing Predictions Pill Bar */}
        {activeModePredictions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Your {mode} Pick:
            </span>
            {activeModePredictions.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                  p.status === 'CORRECT'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : p.status === 'INCORRECT'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {p.status === 'CORRECT' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : p.status === 'INCORRECT' ? (
                  <XCircle className="w-3 h-3 text-red-400" />
                ) : (
                  <Clock className="w-3 h-3 text-cyan-400" />
                )}
                <span>
                  {p.market_type}: <strong>{p.selection}</strong>
                </span>
                {p.points_awarded > 0 && <span>(+{p.points_awarded} pts)</span>}
              </span>
            ))}
          </div>
        )}

        {/* Action Button Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {match.prediction_count ? `${match.prediction_count} community prediction(s)` : 'Be first to predict'}
          </div>

          <div>
            {isStarted ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked (Match Started)</span>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMatch(match);
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md ${
                  mode === 'BASIC'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white shadow-amber-500/20'
                }`}
              >
                <span>{activeModePredictions.length > 0 ? 'Edit Prediction' : 'Predict Match'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
