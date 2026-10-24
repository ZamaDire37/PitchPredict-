import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Sliders,
  X,
  Play,
  Key,
  CheckCircle2,
  RefreshCw,
  Trophy,
  AlertCircle,
} from 'lucide-react';

interface MatchSimModalProps {
  matches: Match[];
  onClose: () => void;
  onGraded: () => void;
}

export const MatchSimModal: React.FC<MatchSimModalProps> = ({ matches, onClose, onGraded }) => {
  const [selectedMatchId, setSelectedMatchId] = useState<number>(matches[0]?.id || 0);
  const [homeScore, setHomeScore] = useState<number>(2);
  const [awayScore, setAwayScore] = useState<number>(1);
  const [homeCorners, setHomeCorners] = useState<number>(6);
  const [awayCorners, setAwayCorners] = useState<number>(4);

  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);

  const [simulating, setSimulating] = useState<boolean>(false);
  const [savingKey, setSavingKey] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    api.getApiKeyStatus().then((res) => {
      setApiKeyConfigured(res.configured);
      setMaskedKey(res.maskedKey || null);
    });
  }, []);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  const handleSimulate = async () => {
    if (!selectedMatchId) return;
    setSimulating(true);
    setStatusMsg(null);

    try {
      const res = await api.simulateMatchResult(
        selectedMatchId,
        homeScore,
        awayScore,
        homeCorners,
        awayCorners
      );
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setStatusMsg({
        type: 'success',
        text: `Match completed! Score: ${homeScore}-${awayScore} (${homeCorners + awayCorners} corners). Graded ${res.gradingResult?.graded || 0} user predictions!`,
      });
      onGraded();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to simulate match' });
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    setStatusMsg(null);
    try {
      await api.setApiKey(apiKeyInput);
      const res = await api.getApiKeyStatus();
      setApiKeyConfigured(res.configured);
      setMaskedKey(res.maskedKey || null);
      setApiKeyInput('');
      setStatusMsg({ type: 'success', text: 'Football-Data.org API key saved successfully!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save API key' });
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Match Simulator & Grader
              </h2>
              <p className="text-xs text-slate-400">Interactive live grading testbed & API key setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Section 1: Match Score Simulator */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Match Result & Auto-Grade Predictions</span>
            </h3>
            <p className="text-slate-400 text-[11px]">
              Select a fixture, specify the final score and corners, and trigger the backend scoring engine. All pending Basic & Serious predictions will be immediately graded and points awarded or deducted.
            </p>

            {/* Match dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Select Fixture to Finish:
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.competition_name}: {m.home_team_name} vs {m.away_team_name} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Score & Corners inputs */}
            {selectedMatch && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="text-center font-bold text-slate-200">
                  {selectedMatch.home_team_name} vs {selectedMatch.away_team_name}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {selectedMatch.home_team_short || 'Home'} Goals:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={homeScore}
                      onChange={(e) => setHomeScore(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-center text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {selectedMatch.away_team_short || 'Away'} Goals:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={awayScore}
                      onChange={(e) => setAwayScore(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-center text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {selectedMatch.home_team_short || 'Home'} Corners:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="25"
                      value={homeCorners}
                      onChange={(e) => setHomeCorners(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-center text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {selectedMatch.away_team_short || 'Away'} Corners:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="25"
                      value={awayCorners}
                      onChange={(e) => setAwayCorners(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-center text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>
                    {simulating ? 'Evaluating Predictions...' : 'Finish Match & Grade All Predictions'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/60 border-red-500/40 text-red-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Section 2: Football-Data.org API Token Configuration */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Football-Data.org API Service Token</span>
            </h3>
            <p className="text-slate-400 text-[11px]">
              The app automatically functions with the built-in authenticated real European football fixtures. If you have an API token from <a href="https://www.football-data.org/" target="_blank" rel="noreferrer" className="text-cyan-400 underline">football-data.org</a>, paste it here to fetch directly from their v4 endpoint.
            </p>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-slate-200">
                  {apiKeyConfigured ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active ({maskedKey})
                    </span>
                  ) : (
                    <span className="text-amber-400">Using Real Fixtures Dataset</span>
                  )}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste your Football-Data.org API token..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  disabled={savingKey}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
                >
                  {savingKey ? 'Saving...' : 'Save Token'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
