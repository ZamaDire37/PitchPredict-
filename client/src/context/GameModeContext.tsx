import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameMode, StagedPrediction } from '../types';

interface GameModeContextType {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  stagedPredictions: StagedPrediction[];
  addStagedPrediction: (item: StagedPrediction) => void;
  removeStagedPrediction: (matchId: number, marketType: string) => void;
  clearStagedPredictions: () => void;
  isStaged: (matchId: number, marketType: string, selection: string) => boolean;
}

const GameModeContext = createContext<GameModeContextType | undefined>(undefined);

export const GameModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<GameMode>(() => {
    const saved = localStorage.getItem('fp_mode');
    return saved === 'SERIOUS' ? 'SERIOUS' : 'BASIC';
  });

  const [stagedPredictions, setStagedPredictions] = useState<StagedPrediction[]>([]);

  const setMode = (newMode: GameMode) => {
    setModeState(newMode);
    localStorage.setItem('fp_mode', newMode);
  };

  const addStagedPrediction = (item: StagedPrediction) => {
    setStagedPredictions((prev) => {
      // If already staged for this match & market, replace it; else append
      const filtered = prev.filter(
        (p) => !(p.match.id === item.match.id && p.marketType === item.marketType)
      );
      return [...filtered, item];
    });
  };

  const removeStagedPrediction = (matchId: number, marketType: string) => {
    setStagedPredictions((prev) =>
      prev.filter((p) => !(p.match.id === matchId && p.marketType === marketType))
    );
  };

  const clearStagedPredictions = () => {
    setStagedPredictions([]);
  };

  const isStaged = (matchId: number, marketType: string, selection: string) => {
    return stagedPredictions.some(
      (p) => p.match.id === matchId && p.marketType === marketType && p.selection === selection
    );
  };

  return (
    <GameModeContext.Provider
      value={{
        mode,
        setMode,
        stagedPredictions,
        addStagedPrediction,
        removeStagedPrediction,
        clearStagedPredictions,
        isStaged,
      }}
    >
      {children}
    </GameModeContext.Provider>
  );
};

export const useGameMode = () => {
  const context = useContext(GameModeContext);
  if (!context) throw new Error('useGameMode must be used within a GameModeProvider');
  return context;
};
