import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameMode, StagedPrediction } from '../types';

interface GameModeContextType {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  stagedPredictions: StagedPrediction[];
  addStagedPrediction: (item: StagedPrediction) => void;
  toggleStagedPrediction: (item: StagedPrediction) => void;
  removeStagedPrediction: (matchId: number, marketType: string, selection?: string) => void;
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
      // If exact same pick already exists, keep it; otherwise append (unlimited selections)
      const exists = prev.some(
        (p) =>
          p.match.id === item.match.id &&
          p.marketType === item.marketType &&
          p.selection === item.selection
      );
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const toggleStagedPrediction = (item: StagedPrediction) => {
    setStagedPredictions((prev) => {
      const exists = prev.some(
        (p) =>
          p.match.id === item.match.id &&
          p.marketType === item.marketType &&
          p.selection === item.selection
      );
      if (exists) {
        // Deselect / Remove
        return prev.filter(
          (p) =>
            !(
              p.match.id === item.match.id &&
              p.marketType === item.marketType &&
              p.selection === item.selection
            )
        );
      } else {
        // Append - users can make as many selections as they want!
        return [...prev, item];
      }
    });
  };

  const removeStagedPrediction = (matchId: number, marketType: string, selection?: string) => {
    setStagedPredictions((prev) =>
      prev.filter(
        (p) =>
          !(
            p.match.id === matchId &&
            p.marketType === marketType &&
            (selection === undefined || p.selection === selection)
          )
      )
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
        toggleStagedPrediction,
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
