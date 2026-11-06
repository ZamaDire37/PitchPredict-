import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameModeProvider, useGameMode } from './context/GameModeContext';
import { TimezoneProvider, useTimezone } from './context/TimezoneContext';
import { Navbar } from './components/Navbar';
import { ModeBanner } from './components/ModeBanner';
import { MatchList } from './components/MatchList';
import { MarketsSection } from './components/MarketsSection';
import { PredictionModal } from './components/PredictionModal';
import { SeriousSetBuilder } from './components/SeriousSetBuilder';
import { PredictionHistory } from './components/PredictionHistory';
import { PointsAnalytics } from './components/PointsAnalytics';
import { LeaderboardView } from './components/LeaderboardView';
import { RulesModal } from './components/RulesModal';
import { AuthModal } from './components/AuthModal';
import { MatchSimModal } from './components/MatchSimModal';
import { DatabaseModal } from './components/DatabaseModal';
import { TimezoneModal } from './components/TimezoneModal';
import { api } from './services/api';
import { Match } from './types';
import { ShieldCheck, Sparkles, Heart } from 'lucide-react';

const MainApp: React.FC = () => {
  const { refreshUser } = useAuth();
  const { mode } = useGameMode();
  const [activeTab, setActiveTab] = useState<string>('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [matchFilter, setMatchFilter] = useState<string>('upcoming');
  const [competitionFilter, setCompetitionFilter] = useState<string>('ALL');

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [rulesInitialTab, setRulesInitialTab] = useState<'RULES' | 'ODDS'>('RULES');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState<boolean>(false);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState<boolean>(false);
  const { tzOffsetMinutes, clientTodayYmd } = useTimezone();

  const handleOpenRules = (tab: 'RULES' | 'ODDS' = 'RULES') => {
    setRulesInitialTab(tab);
    setIsRulesOpen(true);
  };

  const loadMatches = async () => {
    try {
      setLoadingMatches(true);
      const res = await api.getMatches(
        matchFilter,
        competitionFilter,
        undefined,
        undefined,
        tzOffsetMinutes,
        clientTodayYmd
      );
      setMatches(res.matches);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [matchFilter, competitionFilter, tzOffsetMinutes, clientTodayYmd]);

  const handleSyncApi = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const res = await api.syncMatches();
      await loadMatches();
      await refreshUser();
      setSyncMessage(res.message || 'Football API synchronization complete!');
      setTimeout(() => setSyncMessage(null), 8000);
    } catch (err: any) {
      setSyncError(err.message || 'Failed to sync football data from live APIs.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePredictionSuccess = async () => {
    await loadMatches();
    await refreshUser();
  };

  const handleSimulatedMatchGraded = async () => {
    await loadMatches();
    await refreshUser();
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative overflow-x-hidden ${
        mode === 'SERIOUS'
          ? 'bg-[#0d0404] text-slate-100 selection:bg-red-500 selection:text-white'
          : 'bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950'
      }`}
    >
      {/* Thematic Ambient Glow Backgrounds */}
      {mode === 'SERIOUS' ? (
        <>
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(239,68,68,0.18),transparent_75%)]" />
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_60%_45%_at_80%_90%,rgba(245,158,11,0.08),transparent_70%)]" />
        </>
      ) : (
        <>
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(16,185,129,0.14),transparent_75%)]" />
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_60%_45%_at_10%_90%,rgba(6,182,212,0.06),transparent_70%)]" />
        </>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenRules={() => handleOpenRules('RULES')}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenDatabase={() => setIsDatabaseOpen(true)}
        onOpenTimezone={() => setIsTimezoneOpen(true)}
        onSyncApi={handleSyncApi}
        isSyncing={isSyncing}
      />

      {/* Mode Status Banner */}
      <ModeBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36 sm:pb-28 md:pb-8">
        {activeTab === 'matches' && (
          <MatchList
            matches={matches}
            loading={loadingMatches}
            onSelectMatch={(m) => setSelectedMatch(m)}
            onSync={handleSyncApi}
            onOpenTimezone={() => setIsTimezoneOpen(true)}
            isSyncing={isSyncing}
            filter={matchFilter}
            setFilter={setMatchFilter}
            competition={competitionFilter}
            setCompetition={setCompetitionFilter}
            syncMessage={syncMessage}
            syncError={syncError}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsSection
            matches={matches}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenRules={handleOpenRules}
            onRefreshData={handlePredictionSuccess}
          />
        )}

        {activeTab === 'predictions' && (
          <PredictionHistory onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {activeTab === 'analytics' && <PointsAnalytics />}

        {activeTab === 'leaderboard' && (
          <LeaderboardView onOpenAuth={() => setIsAuthOpen(true)} />
        )}
      </main>

      {/* Floating Serious Mode Set Builder */}
      <SeriousSetBuilder
        onSuccess={handlePredictionSuccess}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Modals */}
      {selectedMatch && (
        <PredictionModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSuccess={handlePredictionSuccess}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenRules={handleOpenRules}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onSuccess={async () => {
            await loadMatches();
            await refreshUser();
          }}
        />
      )}

      {isRulesOpen && (
        <RulesModal
          initialTab={rulesInitialTab}
          onClose={() => setIsRulesOpen(false)}
        />
      )}

      {isSimulatorOpen && (
        <MatchSimModal
          matches={matches}
          onClose={() => setIsSimulatorOpen(false)}
          onGraded={handleSimulatedMatchGraded}
        />
      )}

      {isDatabaseOpen && (
        <DatabaseModal onClose={() => setIsDatabaseOpen(false)} />
      )}

      {isTimezoneOpen && (
        <TimezoneModal onClose={() => setIsTimezoneOpen(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 sm:py-8 px-4 pb-24 md:pb-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">PitchPredict</span>
            <span>•</span>
            <span>Real Football Fixture Predictions</span>
          </div>

          <div className="flex items-center gap-1.5 text-center text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Disclaimer: Skill-based prediction app. No real-money gambling, deposits, or cash withdrawals.
            </span>
          </div>

          <div className="text-slate-400">
            Powered by reliable football API data
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <GameModeProvider>
        <TimezoneProvider>
          <MainApp />
        </TimezoneProvider>
      </GameModeProvider>
    </AuthProvider>
  );
}
