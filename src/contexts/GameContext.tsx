import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useGameState } from '../hooks/useGameState';
import type { GameState } from '../types/game';

interface GameContextType {
  gameState: GameState;
  submitGuess: (guess: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrentGuess: (guess: string) => void;
  resetGame: () => Promise<void>;
  getHint: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const gameStateHook = useGameState();

  return (
    <GameContext.Provider value={gameStateHook}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameContext;