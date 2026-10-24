import React, { useState } from 'react';
import { Match } from '../types';
import { MatchCard } from './MatchCard';
import { Search, Calendar, Filter, RefreshCw, Trophy } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  loading: boolean;
  onSelectMatch: (match: Match) => void;
  onSync: () => void;
  isSyncing: boolean;
  filter: string;
  setFilter: (f: string) => void;
  competition: string;
  setCompetition: (c: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  loading,
  onSelectMatch,
  onSync,
  isSyncing,
  filter,
  setFilter,
  competition,
  setCompetition,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const competitionsList = [
    { id: 'ALL', name: 'All Leagues' },
    { id: 'PL', name: 'Premier League' },
    { id: 'CL', name: 'Champions League' },
    { id: 'PD', name: 'La Liga' },
    { id: 'BL1', name: 'Bundesliga' },
    { id: 'SA', name: 'Serie A' },
  ];

  const filteredMatches = matches.filter((m) => {
    if (competition !== 'ALL' && m.competition_id !== competition) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const home = m.home_team_name.toLowerCase();
      const away = m.away_team_name.toLowerCase();
      const comp = m.competition_name.toLowerCase();
      return home.includes(q) || away.includes(q) || comp.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'today', label: "Today's Fixtures" },
              { id: 'finished', label: 'Recent Results' },
              { id: 'all', label: 'All Matches' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box & Sync button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teams or leagues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors shrink-0 ${
                isSyncing ? 'opacity-70' : ''
              }`}
              title="Refresh fixtures from Football-Data API"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {/* Competition Badges Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-slate-500" />
            Leagues:
          </span>
          {competitionsList.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setCompetition(comp.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                competition === comp.id
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/60'
              }`}
            >
              {comp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse"
            />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Matches Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No matches match the selected criteria. Try changing filters or sync real fixtures from the API.
          </p>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Live Football Matches</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((m) => (
            <MatchCard key={m.id} match={m} onSelectMatch={onSelectMatch} />
          ))}
        </div>
      )}
    </div>
  );
};
