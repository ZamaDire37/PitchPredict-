import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameModeProvider, useGameMode } from './context/GameModeContext';
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
import { api } from './services/api';
import { Match } from './types';
import { ShieldCheck, Sparkles, Heart } from 'lucide-react';

const MainApp: React.FC = () => {
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [matchFilter, setMatchFilter] = useState<string>('upcoming');
  const [competitionFilter, setCompetitionFilter] = useState<string>('ALL');

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  const loadMatches = async () => {
    try {
      setLoadingMatches(true);
      const res = await api.getMatches(matchFilter, competitionFilter);
      setMatches(res.matches);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [matchFilter, competitionFilter]);

  const handleSyncApi = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncMatches();
      await loadMatches();
      await refreshUser();
      alert(res.message || 'Matches updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to sync football data');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onSyncApi={handleSyncApi}
        isSyncing={isSyncing}
      />

      {/* Mode Status Banner */}
      <ModeBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'matches' && (
          <MatchList
            matches={matches}
            loading={loadingMatches}
            onSelectMatch={(m) => setSelectedMatch(m)}
            onSync={handleSyncApi}
            isSyncing={isSyncing}
            filter={matchFilter}
            setFilter={setMatchFilter}
            competition={competitionFilter}
            setCompetition={setCompetitionFilter}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsSection
            matches={matches}
            onOpenAuth={() => setIsAuthOpen(true)}
            onRefreshData={handlePredictionSuccess}
          />
        )}

        {activeTab === 'predictions' && <PredictionHistory />}

        {activeTab === 'analytics' && <PointsAnalytics />}

        {activeTab === 'leaderboard' && <LeaderboardView />}
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

      {isRulesOpen && <RulesModal onClose={() => setIsRulesOpen(false)} />}

      {isSimulatorOpen && (
        <MatchSimModal
          matches={matches}
          onClose={() => setIsSimulatorOpen(false)}
          onGraded={handleSimulatedMatchGraded}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-xs text-slate-500">
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
        <MainApp />
      </GameModeProvider>
    </AuthProvider>
  );
}
