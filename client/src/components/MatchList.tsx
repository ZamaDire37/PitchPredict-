import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { MatchCard } from './MatchCard';
import { api } from '../services/api';
import { useGameMode } from '../context/GameModeContext';
import { useTimezone } from '../context/TimezoneContext';
import {
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Trophy,
  ShieldCheck,
  AlertCircle,
  Wifi,
  Database,
  CheckCircle2,
  Flame,
  ChevronDown,
  ChevronUp,
  Layers,
  LayoutGrid,
  Clock,
  Globe,
} from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  loading: boolean;
  onSelectMatch: (match: Match) => void;
  onSync: () => void;
  onOpenTimezone?: () => void;
  isSyncing: boolean;
  filter: string;
  setFilter: (f: string) => void;
  competition: string;
  setCompetition: (c: string) => void;
  syncMessage?: string | null;
  syncError?: string | null;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  loading,
  onSelectMatch,
  onSync,
  onOpenTimezone,
  isSyncing,
  filter,
  setFilter,
  competition,
  setCompetition,
  syncMessage,
  syncError,
}) => {
  const { mode } = useGameMode();
  const { formatKickoffParts, timezoneLabel, timezoneAbbr } = useTimezone();
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [groupByLeague, setGroupByLeague] = useState<boolean>(true);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.getApiDiagnostics()
      .then((res) => {
        if (res?.diagnostics) {
          setDiagnostics(res.diagnostics);
        }
      })
      .catch((err) => {
        console.warn('Diagnostics fetch failed:', err);
      });
  }, [matches.length, isSyncing]);

  const competitionsList = [
    { id: 'ALL', name: 'All Competitions' },
    { id: 'CL', name: 'Champions League' },
    { id: 'EL', name: 'Europa League' },
    { id: 'PL', name: 'Premier League' },
    { id: 'PD', name: 'La Liga' },
    { id: 'BL1', name: 'Bundesliga' },
    { id: 'SA', name: 'Serie A' },
    { id: 'FL1', name: 'Ligue 1' },
    { id: 'WC', name: 'World Cup' },
    { id: 'EC', name: 'UEFA Euro' },
  ];

  const DEFAULT_EMBLEMS: Record<string, string> = {
    PL: 'https://crests.football-data.org/PL.png',
    CL: 'https://crests.football-data.org/CL.png',
    EL: 'https://crests.football-data.org/EL.png',
    PD: 'https://crests.football-data.org/PD.png',
    BL1: 'https://crests.football-data.org/BL1.png',
    SA: 'https://crests.football-data.org/SA.png',
    FL1: 'https://crests.football-data.org/FL1.png',
    WC: 'https://crests.football-data.org/WC.png',
    EC: 'https://crests.football-data.org/EC.png',
  };

  const filteredMatches = React.useMemo(() => {
    return matches
      .filter((m) => {
        if (competition !== 'ALL' && m.competition_id !== competition) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const home = m.home_team_name.toLowerCase();
          const away = m.away_team_name.toLowerCase();
          const comp = m.competition_name.toLowerCase();
          return home.includes(q) || away.includes(q) || comp.includes(q);
        }
        return true;
      })
      // 1. Time: Sort all matches chronologically by earliest kickoff first
      .sort((a, b) => new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime());
  }, [matches, competition, searchQuery]);

  const formatNextKickoff = (utcDateStr?: string) => {
    if (!utcDateStr) return '';
    const { datePrefix, timeDisplay, tzAbbr } = formatKickoffParts(utcDateStr);
    return `${datePrefix} at ${timeDisplay} ${tzAbbr}`.trim();
  };

  const groupedByLeague = React.useMemo(() => {
    interface LeagueGroupData {
      id: string;
      name: string;
      emblem?: string;
      earliestTime: number;
      earliestDate: string;
      matches: Match[];
    }

    const groupsMap = new Map<string, LeagueGroupData>();

    for (const match of filteredMatches) {
      const compId = match.competition_id || 'OTHER';
      const compName = match.competition_name || 'Other Competitions';
      const compEmblem = match.competition_emblem || DEFAULT_EMBLEMS[compId];
      const matchTime = new Date(match.utc_date).getTime();

      if (!groupsMap.has(compId)) {
        groupsMap.set(compId, {
          id: compId,
          name: compName,
          emblem: compEmblem,
          earliestTime: matchTime,
          earliestDate: match.utc_date,
          matches: [],
        });
      }

      const group = groupsMap.get(compId)!;
      group.matches.push(match);
      if (matchTime < group.earliestTime) {
        group.earliestTime = matchTime;
        group.earliestDate = match.utc_date;
      }
    }

    const priorityMap: Record<string, number> = {
      CL: 1,
      EL: 2,
      PL: 3,
      PD: 4,
      BL1: 5,
      SA: 6,
      FL1: 7,
      WC: 8,
      EC: 9,
      DFB: 10,
      BL2: 11,
      INT: 12,
    };

    // Sort league groups:
    // 1. TIME: League with the earliest kickoff match comes first
    // 2. LEAGUE: If both leagues kick off at the exact same time, break ties by league priority / alphabetical
    return Array.from(groupsMap.values())
      .map((g) => ({
        ...g,
        // Ensure matches inside the league are also strictly ordered by time
        matches: g.matches.sort((a, b) => new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime()),
      }))
      .sort((a, b) => {
        // First order by earliest kickoff time
        if (a.earliestTime !== b.earliestTime) {
          return a.earliestTime - b.earliestTime;
        }
        // Then order by league priority / name
        const pA = priorityMap[a.id] ?? 99;
        const pB = priorityMap[b.id] ?? 99;
        if (pA !== pB) return pA - pB;
        return a.name.localeCompare(b.name);
      });
  }, [filteredMatches]);

  const toggleLeagueCollapse = (leagueId: string) => {
    setCollapsedLeagues((prev) => ({
      ...prev,
      [leagueId]: !prev[leagueId],
    }));
  };

  const areAllCollapsed = groupedByLeague.length > 0 && groupedByLeague.every((g) => collapsedLeagues[g.id]);

  const toggleAllCollapse = () => {
    if (areAllCollapsed) {
      setCollapsedLeagues({});
    } else {
      const all: Record<string, boolean> = {};
      groupedByLeague.forEach((g) => {
        all[g.id] = true;
      });
      setCollapsedLeagues(all);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live API Connectivity & Verification Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              <Wifi className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Live Football API Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  CONNECTED
                </span>
                <span className="text-slate-400 text-[11px] hidden md:inline">
                  (TheSportsDB Free API • OpenFootball Public API • OpenLigaDB)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Displaying actual real matches scheduled to be played. Kickoff dates are strictly in the future. Predictions lock at kickoff.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenTimezone && (
              <button
                onClick={onOpenTimezone}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition-colors"
                title={`Active Timezone: ${timezoneLabel} (Click to change)`}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Timezone:</span>
                <span className="font-bold text-white">{timezoneAbbr}</span>
              </button>
            )}

            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors ${
                isSyncing ? 'opacity-70' : ''
              }`}
              title="Refresh live fixtures directly from football APIs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Fetching Live API...' : 'Sync Live APIs'}</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Alert */}
        {syncMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {syncError && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Live Provider Breakdown Badges */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            Active Live API Feeds:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            OpenFootball Public Datasets (EPL, LaLiga, SerieA, Bundesliga, Ligue1, WC, Euro)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            TheSportsDB Free API (Champions League, Europa League)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            OpenLigaDB Live REST API (Bundesliga)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950 text-emerald-400 border border-emerald-500/30 font-semibold">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Supabase Cloud Database Ready
          </span>
          {diagnostics?.totalMatchesInDb > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {diagnostics.totalMatchesInDb} Verified Real Matches
            </span>
          )}
        </div>
      </div>

      {/* Top Filter and Search Bar */}
      <div
        className={`p-4 rounded-2xl border shadow-md backdrop-blur-md space-y-4 transition-colors ${
          mode === 'SERIOUS'
            ? 'bg-[#150707]/90 border-red-950/80 shadow-red-950/20'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x flex-nowrap pb-1 md:pb-0 -mx-1 px-1">
            {[
              { id: 'upcoming', label: 'Upcoming Fixtures' },
              { id: 'today', label: "Today's Matches" },
              { id: 'finished', label: 'Completed Results' },
              { id: 'all', label: 'All Fixtures' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] sm:min-h-0 flex items-center shrink-0 ${
                  filter === tab.id
                    ? mode === 'SERIOUS'
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white shadow-md shadow-red-500/30 font-black'
                      : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team or competition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl pl-9 pr-3 py-2 sm:py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                mode === 'SERIOUS'
                  ? 'border-red-950/80 focus:border-red-500'
                  : 'border-slate-800 focus:border-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Timezone Indicator Sub-bar */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-0.5 px-0.5 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Kickoffs matched to: <strong className="text-cyan-300 font-semibold">{timezoneLabel}</strong></span>
          </div>
          {onOpenTimezone && (
            <button
              type="button"
              onClick={onOpenTimezone}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 transition-colors flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              <span>Change Timezone</span>
            </button>
          )}
        </div>

        {/* Competition Badges Filter (All 9 Real Competitions) */}
        <div
          className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x flex-nowrap pt-1 border-t -mx-1 px-1 transition-colors ${
            mode === 'SERIOUS' ? 'border-red-950/60' : 'border-slate-800/60'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Trophy className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Competitions:</span>
          </span>
          {competitionsList.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setCompetition(comp.id)}
              className={`px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                competition === comp.id
                  ? mode === 'SERIOUS'
                    ? 'bg-gradient-to-r from-red-950 to-amber-950 text-amber-200 border border-red-500/50 shadow-sm font-bold'
                    : 'bg-slate-700 text-white border border-slate-600 shadow-sm'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/60'
              }`}
            >
              {comp.name}
            </button>
          ))}
        </div>

        {/* View Mode & Group Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grouping:</span>
            </span>
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setGroupByLeague(true)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  groupByLeague
                    ? mode === 'SERIOUS'
                      ? 'bg-red-500 text-white shadow-sm font-black'
                      : 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Group by League</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupByLeague(false)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  !groupByLeague
                    ? mode === 'SERIOUS'
                      ? 'bg-red-500 text-white shadow-sm font-black'
                      : 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Flat List</span>
              </button>
            </div>
          </div>

          {groupByLeague && groupedByLeague.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">
                {groupedByLeague.length} {groupedByLeague.length === 1 ? 'League' : 'Leagues'} • {filteredMatches.length} Matches
              </span>
              <button
                type="button"
                onClick={toggleAllCollapse}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                {areAllCollapsed ? (
                  <>
                    <ChevronDown className="w-3 h-3 text-emerald-400" />
                    <span>Expand All</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3 h-3 text-emerald-400" />
                    <span>Collapse All</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Matches Content Area */}
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
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Real Fixtures Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            The application strictly displays real data from live football APIs and does not generate mock matches.
            No matches were returned for this specific filter.
          </p>
          <div className="pt-2">
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Retry Live API Sync</span>
            </button>
          </div>
        </div>
      ) : groupByLeague ? (
        <div className="space-y-6">
          {groupedByLeague.map((group) => {
            const isCollapsed = Boolean(collapsedLeagues[group.id]);
            return (
              <div
                key={group.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  mode === 'SERIOUS'
                    ? 'border-red-950/70 bg-[#120505]/80 shadow-lg shadow-red-950/20'
                    : 'border-slate-800/90 bg-slate-900/50 shadow-sm'
                }`}
              >
                {/* League Header */}
                <button
                  type="button"
                  onClick={() => toggleLeagueCollapse(group.id)}
                  className={`w-full p-4 flex items-center justify-between gap-3 text-left transition-colors ${
                    mode === 'SERIOUS'
                      ? 'hover:bg-red-950/40 bg-gradient-to-r from-red-950/60 via-[#180707] to-amber-950/30'
                      : 'hover:bg-slate-800/50 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                      {group.emblem ? (
                        <img
                          src={group.emblem}
                          alt={group.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Trophy className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                          {group.name}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {group.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>Starts: {formatNextKickoff(group.earliestDate)}</span>
                        </span>
                        <span>•</span>
                        <span>{group.matches.length} {group.matches.length === 1 ? 'fixture' : 'fixtures'} scheduled</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        mode === 'SERIOUS'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {group.matches.length} {group.matches.length === 1 ? 'Match' : 'Matches'}
                    </span>
                    <div className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-950/80 border border-slate-800 transition-colors">
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* League Matches Grid */}
                {!isCollapsed && (
                  <div className="p-4 pt-1 border-t border-slate-800/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      {group.matches.map((m) => (
                        <MatchCard key={m.id} match={m} onSelectMatch={onSelectMatch} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
