import React from 'react';
import { Match } from '../types';
import { useGameMode } from '../context/GameModeContext';
import { useTimezone } from '../context/TimezoneContext';
import { TeamBadge } from './TeamBadge';
import { Clock, Lock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Trophy, Flame, Shield } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onSelectMatch: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelectMatch }) => {
  const { mode } = useGameMode();
  const { formatKickoffParts } = useTimezone();
  const kickoffDate = new Date(match.utc_date);
  const now = new Date();
  const isStarted = kickoffDate.getTime() <= now.getTime();
  const isFinished = match.status === 'FINISHED';
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';

  // Format date and time according to user's configured timezone
  const { datePrefix, timeDisplay, tzAbbr } = formatKickoffParts(match.utc_date);

  // Check user predictions on this match
  const userPredictions = match.userPredictions || [];
  const activeModePredictions = userPredictions.filter((p) => p.mode === mode);

  return (
    <div
      onClick={() => !isStarted && onSelectMatch(match)}
      className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg ${
        isStarted
          ? 'border-slate-800/80 opacity-90 cursor-default bg-slate-900/90'
          : mode === 'SERIOUS'
          ? 'border-rose-950/60 bg-slate-900/90 hover:border-rose-800/60 hover:shadow-rose-950/20 hover:shadow-xl cursor-pointer hover:-translate-y-0.5'
          : 'border-slate-800 bg-slate-900/90 hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:shadow-xl cursor-pointer hover:-translate-y-0.5'
      }`}
    >
      {/* Top Header: Competition & Kickoff / Status */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b text-xs transition-colors ${
          mode === 'SERIOUS'
            ? 'bg-slate-950/60 border-rose-900/30'
            : 'bg-slate-950/60 border-slate-800/70'
        }`}
      >
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
          <span className="font-semibold text-slate-300 truncate max-w-[140px] sm:max-w-[190px]">
            {match.competition_name}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 text-[11px]">Matchday {match.matchday}</span>
          {mode === 'SERIOUS' && !isStarted && (
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-950/60 text-rose-300 border border-rose-800/40">
              <Flame className="w-2.5 h-2.5 text-rose-400" />
              Set Pick
            </span>
          )}
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
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
              <Clock className={`w-3.5 h-3.5 ${mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>
                {datePrefix} {timeDisplay}
              </span>
              {tzAbbr && (
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                  {tzAbbr}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Card Body: Teams and Scores */}
      <div className="p-3.5 sm:p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full p-1.5 sm:p-2 flex items-center justify-center mb-1.5 sm:mb-2 shadow-inner border transition-colors ${
                mode === 'SERIOUS'
                  ? 'bg-red-950/40 border-red-900/50'
                  : 'bg-slate-800/80 border-slate-700/60'
              }`}
            >
              <TeamBadge
                name={match.home_team_name}
                shortName={match.home_team_short}
                crest={match.home_team_crest}
                size="md"
              />
            </div>
            <span className="font-bold text-slate-100 text-xs sm:text-sm line-clamp-1">
              {match.home_team_short || match.home_team_name}
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:block">Home</span>
          </div>

          {/* Middle: Score or VS */}
          <div className="flex flex-col items-center justify-center min-w-[60px] sm:min-w-[70px]">
            {isFinished || isLive ? (
              <div className="flex flex-col items-center">
                <div
                  className={`text-xl sm:text-3xl font-black tracking-tight text-white px-2.5 py-1 rounded-xl border font-mono ${
                    mode === 'SERIOUS'
                      ? 'bg-black/90 border-red-900/60 shadow-inner'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {match.home_score ?? 0} - {match.away_score ?? 0}
                </div>
                {match.home_corners !== null && match.away_corners !== null && (
                  <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1 whitespace-nowrap">
                    🚩 {match.home_corners} : {match.away_corners}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg tracking-wider ${
                    mode === 'SERIOUS'
                      ? 'bg-rose-950/40 border border-rose-900/40 text-rose-300 shadow-sm'
                      : 'bg-slate-800/70 text-slate-400'
                  }`}
                >
                  VS
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full p-1.5 sm:p-2 flex items-center justify-center mb-1.5 sm:mb-2 shadow-inner border transition-colors ${
                mode === 'SERIOUS'
                  ? 'bg-rose-950/30 border-rose-900/40'
                  : 'bg-slate-800/80 border-slate-700/60'
              }`}
            >
              <TeamBadge
                name={match.away_team_name}
                shortName={match.away_team_short}
                crest={match.away_team_crest}
                size="md"
              />
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
        <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-400">
            {match.prediction_count ? `${match.prediction_count} community prediction(s)` : 'Be first to predict'}
          </div>

          <div className="w-full xs:w-auto">
            {isStarted ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 w-full xs:w-auto">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked (Match Started)</span>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMatch(match);
                }}
                className={`w-full xs:w-auto flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 sm:py-1.5 rounded-xl transition-all shadow-md min-h-[42px] sm:min-h-0 ${
                  mode === 'BASIC'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
                    : 'bg-rose-700 hover:bg-rose-600 text-white shadow-md shadow-rose-950/40 active:scale-95'
                }`}
              >
                {mode === 'SERIOUS' ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-rose-300" />
                    <span>{activeModePredictions.length > 0 ? 'Edit Serious Pick' : '+ Add to Serious Set'}</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5 text-slate-950" />
                    <span>{activeModePredictions.length > 0 ? 'Edit Prediction' : 'Predict Match'}</span>
                  </>
                )}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
