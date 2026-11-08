import React, { useState, useEffect, useMemo } from 'react';
import { Match } from '../types';
import { MatchCard } from './MatchCard';
import { useGameMode } from '../context/GameModeContext';
import { useTimezone } from '../context/TimezoneContext';
import { normalizeCompetition } from '../services/leagueRanking';
import {
  Search,
  Calendar,
  Trophy,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  loading: boolean;
  loadError?: string | null;
  onSelectMatch: (match: Match) => void;
  filter: string;
  setFilter: (f: string) => void;
  competition: string;
  setCompetition: (c: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  loading,
  loadError,
  onSelectMatch,
  filter,
  setFilter,
  competition,
  setCompetition,
}) => {
  const { mode } = useGameMode();
  const { formatKickoffParts, timezone, clientTodayYmd } = useTimezone();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'by_league' | 'by_kickoff'>('by_league');
  const [selectedDate, setSelectedDate] = useState<string>(() => clientTodayYmd || new Date().toISOString().split('T')[0]);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});

  // Sync selectedDate with clientTodayYmd when context initializes
  useEffect(() => {
    if (clientTodayYmd && !selectedDate) {
      setSelectedDate(clientTodayYmd);
    }
  }, [clientTodayYmd]);

  const hasBelgianMatches = useMemo(() => matches.some((m) => m.competition_id === 'BEL'), [matches]);

  const competitionsList = useMemo(() => [
    { id: 'ALL', name: 'All Competitions' },
    { id: 'PL', name: 'Premier League' },
    { id: 'PD', name: 'La Liga' },
    { id: 'SA', name: 'Serie A' },
    { id: 'BL1', name: 'Bundesliga' },
    { id: 'FL1', name: 'Ligue 1' },
    { id: 'PPL', name: 'Primeira Liga' },
    ...(hasBelgianMatches ? [{ id: 'BEL', name: 'Belgian Pro League' }] : []),
    { id: 'DED', name: 'Eredivisie' },
    { id: 'CL', name: 'Champions League' },
    { id: 'EL', name: 'Europa League' },
    { id: 'WC', name: 'World Cup' },
    { id: 'EC', name: 'UEFA Euro' },
  ], [hasBelgianMatches]);

  const DEFAULT_EMBLEMS: Record<string, string> = {
    PL: 'https://crests.football-data.org/PL.png',
    PD: 'https://crests.football-data.org/PD.png',
    SA: 'https://crests.football-data.org/SA.png',
    BL1: 'https://crests.football-data.org/BL1.png',
    FL1: 'https://crests.football-data.org/FL1.png',
    PPL: 'https://crests.football-data.org/PPL.png',
    BEL: 'https://crests.football-data.org/BEL.png',
    DED: 'https://crests.football-data.org/DED.png',
    CL: 'https://crests.football-data.org/CL.png',
    EL: 'https://crests.football-data.org/EL.png',
    WC: 'https://crests.football-data.org/WC.png',
    EC: 'https://crests.football-data.org/EC.png',
  };

  // Helper to extract the match's kickoff date in the user's active display timezone
  const getMatchLocalDateYmd = (utcDateStr: string): string => {
    try {
      const activeTz = timezone === 'AUTO' || !timezone ? undefined : timezone;
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: activeTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(utcDateStr));
    } catch {
      return utcDateStr.split('T')[0];
    }
  };

  // Helper to step date by N days
  const stepDate = (currentYmd: string, deltaDays: number): string => {
    try {
      const [y, m, d] = currentYmd.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
      return dt.toISOString().split('T')[0];
    } catch {
      return currentYmd;
    }
  };

  // Quick dates bar (Yesterday, Today, Tomorrow, +5 upcoming days)
  const quickDates = useMemo(() => {
    const base = clientTodayYmd || new Date().toISOString().split('T')[0];
    const list: string[] = [];
    for (let offset = -1; offset <= 6; offset++) {
      list.push(stepDate(base, offset));
    }
    return list;
  }, [clientTodayYmd]);

  const formatDateChipLabel = (ymdStr: string) => {
    if (ymdStr === clientTodayYmd) return 'Today';
    const [y, m, d] = ymdStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: timezone === 'AUTO' || !timezone ? undefined : timezone,
      }).format(dt);
    } catch {
      return ymdStr;
    }
  };

  const formatFullDateDisplay = (ymdStr: string) => {
    const [y, m, d] = ymdStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone === 'AUTO' || !timezone ? undefined : timezone,
      }).format(dt);
    } catch {
      return ymdStr;
    }
  };

  const formatNextKickoff = (utcDateStr?: string) => {
    if (!utcDateStr) return '';
    const { datePrefix, timeDisplay } = formatKickoffParts(utcDateStr);
    return `${datePrefix} at ${timeDisplay}`.trim();
  };

  // 1. BY KICKOFF TIME MATCHES: sorted strictly by kickoff time from earliest to latest
  const byKickoffMatches = useMemo(() => {
    return matches
      .filter((m) => {
        if (competition !== 'ALL' && m.competition_id !== competition) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const home = m.home_team_name.toLowerCase();
          const away = m.away_team_name.toLowerCase();
          const comp = m.competition_name.toLowerCase();
          if (!home.includes(q) && !away.includes(q) && !comp.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime());
  }, [matches, competition, searchQuery]);

  // 2. BY LEAGUE MATCHES:
  // - Filter matches to the selected date using the app's display timezone
  // - Group the matches by league and order groups by league rank, regardless of kickoff time
  // - Within each league, sort matches by kickoff time from earliest to latest
  // - Skip leagues with no matches for that date. Unranked leagues placed after all ranked leagues.
  const groupedByLeague = useMemo(() => {
    interface LeagueGroupData {
      id: string; // Stable competition ID
      name: string;
      emblem: string;
      rank: number;
      earliestTime: number;
      earliestDate: string;
      matches: Match[];
    }

    // Filter to selected date in user's display timezone
    const dateMatches = matches.filter((m) => {
      if (competition !== 'ALL' && m.competition_id !== competition) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const home = m.home_team_name.toLowerCase();
        const away = m.away_team_name.toLowerCase();
        const comp = m.competition_name.toLowerCase();
        if (!home.includes(q) && !away.includes(q) && !comp.includes(q)) return false;
      }
      return getMatchLocalDateYmd(m.utc_date) === selectedDate;
    });

    const groupsMap = new Map<string, LeagueGroupData>();

    for (const match of dateMatches) {
      const norm = normalizeCompetition(match.competition_id, match.competition_name, match.competition_emblem);
      const compId = norm.id;
      const compName = norm.name;
      const compEmblem = norm.emblem || DEFAULT_EMBLEMS[compId];
      const compRank = norm.rank;
      const matchTime = new Date(match.utc_date).getTime();

      if (!groupsMap.has(compId)) {
        groupsMap.set(compId, {
          id: compId,
          name: compName,
          emblem: compEmblem,
          rank: compRank,
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

    // Ordering rules:
    // 1. Order groups strictly by fixed league rank (1: PL, 2: PD, 3: SA, 4: BL1, 5: FL1, 6: PPL, 7: BEL, 8: DED... 999: unranked)
    // 2. Within each league, sort matches by kickoff time from earliest to latest
    // 3. Skip leagues with no matches for that date (handled by filtering to dateMatches)
    return Array.from(groupsMap.values())
      .filter((g) => g.matches.length > 0)
      .map((g) => ({
        ...g,
        matches: g.matches.sort((a, b) => new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime()),
      }))
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        return a.name.localeCompare(b.name);
      });
  }, [matches, competition, searchQuery, selectedDate, timezone]);

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

        {/* Date Selector Strip (Display Timezone Aware) */}
        <div className="pt-2 border-t border-slate-800/60 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Match Date:</span>
              <span className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {formatFullDateDisplay(selectedDate)}
              </span>
            </div>

            {/* Quick Step Buttons & Native Date Input */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDate((prev) => stepDate(prev, -1))}
                className="p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(clientTodayYmd || new Date().toISOString().split('T')[0])}
                className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate((prev) => stepDate(prev, 1))}
                className="p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-slate-950 text-slate-200 text-xs px-2 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                title="Pick specific date"
              />
            </div>
          </div>

          {/* Quick Date Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x -mx-1 px-1">
            {quickDates.map((dStr) => {
              const isSelected = dStr === selectedDate;
              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => setSelectedDate(dStr)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? mode === 'SERIOUS'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                      : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  {formatDateChipLabel(dStr)}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode Toggle: By League vs By Kickoff Time */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>View:</span>
            </span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('by_league')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'by_league'
                    ? mode === 'SERIOUS'
                      ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md font-black'
                      : 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Order by official 50-league ranking priority (#1 PL, #2 PD... #6 PPL, #7 BEL, #8 DED)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>By League</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('by_kickoff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'by_kickoff'
                    ? mode === 'SERIOUS'
                      ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md font-black'
                      : 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sort all matches by kickoff time from earliest to latest"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>By Kickoff Time</span>
              </button>
            </div>
          </div>

          {viewMode === 'by_league' && groupedByLeague.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">
                {groupedByLeague.length} {groupedByLeague.length === 1 ? 'League' : 'Leagues'} on {formatDateChipLabel(selectedDate)}
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
      ) : loadError && matches.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Matches are temporarily unavailable.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Please check back in a few moments.
          </p>
        </div>
      ) : viewMode === 'by_league' ? (
        // ==================== BY LEAGUE VIEW ====================
        groupedByLeague.length === 0 ? (
          <div className="text-center py-14 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No matches scheduled</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are no matches scheduled for {formatFullDateDisplay(selectedDate)}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDate(stepDate(selectedDate, 1))}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700"
              >
                <span>Check Next Day ➔</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('by_kickoff')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>View By Kickoff Time</span>
              </button>
            </div>
          </div>
        ) : (
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
                  {/* League Header with Official Priority Rank Badge */}
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
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            #{group.rank <= 50 ? group.rank : 'Unranked'}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {group.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className={`inline-flex items-center gap-1 font-bold ${
                            mode === 'SERIOUS' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>First Kickoff: {formatNextKickoff(group.earliestDate)}</span>
                          </span>
                          <span>•</span>
                          <span>{group.matches.length} {group.matches.length === 1 ? 'fixture' : 'fixtures'}</span>
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

                  {/* League Matches Grid: sorted strictly by kickoff time earliest to latest */}
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
        )
      ) : (
        // ==================== BY KICKOFF TIME VIEW ====================
        byKickoffMatches.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No matches scheduled</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are no matches scheduled matching your current filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Sorted by kickoff time from earliest to latest</span>
              <span className="font-mono text-emerald-400 font-bold">{byKickoffMatches.length} Matches</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {byKickoffMatches.map((m) => (
                <MatchCard key={m.id} match={m} onSelectMatch={onSelectMatch} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};
