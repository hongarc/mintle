import { useState, useEffect, useCallback } from 'react';
import type { GameState, LetterFeedback, GameProgress } from '../types/game';
import { evaluateGuess, isCorrectGuess } from '../lib/wordEvaluation';
import { suggestHintWord } from '../lib/wordManager';
import { isValidGuess, loadDictionary } from '../lib/dictionary';
import { getCurrentHourWord } from '../lib/wordManager';
import { hourIdUtc, millisecondsToNextHour } from '../lib/timeUtils';

const MAX_GUESSES = 6;
const GUESS_LENGTH = 5;

interface UseGameStateReturn {
  gameState: GameState;
  submitGuess: (guess: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrentGuess: (guess: string) => void;
  resetGame: () => Promise<void>;
  getHint: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}


/**
 * Custom hook for managing game state
 */
export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState>({
    currentWord: '',
    guesses: [],
    currentGuess: '',
    gameStatus: 'playing',
    feedback: [],
    hourId: '',
    timeToNextHour: 0
  });

  // Get a hint word
  const getHint = useCallback(async (): Promise<string | null> => {
    return suggestHintWord(gameState.guesses, gameState.feedback);
  }, [gameState.guesses, gameState.feedback]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load game state from localStorage
  const loadGameProgress = useCallback((): GameProgress | null => {
    try {
      const saved = localStorage.getItem('mintle-progress');
      if (saved) {
        const progress: GameProgress = JSON.parse(saved);
        // Check if it's for the current hour
        const currentHourId = hourIdUtc();
        if (progress.hourId === currentHourId) {
          return progress;
        }
      }
    } catch (error) {
      console.error('Failed to load game progress:', error);
    }
    return null;
  }, []);

  // Save game state to localStorage
  const saveGameProgress = useCallback((state: GameState) => {
    try {
      const progress: GameProgress = {
        hourId: state.hourId,
        guesses: state.guesses,
        gameStatus: state.gameStatus,
        lastPlayed: new Date().toISOString()
      };
      localStorage.setItem('mintle-progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save game progress:', error);
    }
  }, []);

  // Initialize game
  const initializeGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load dictionary
      await loadDictionary();
      
      // Get current hour info
      const currentHourId = hourIdUtc();
      const timeToNext = millisecondsToNextHour();
      
      // Try to load existing progress
      const savedProgress = loadGameProgress();
      
      if (savedProgress && savedProgress.hourId === currentHourId) {
        // Resume existing game
        const currentWord = await getCurrentHourWord();
        
        // Reconstruct feedback from saved guesses
        const feedback: LetterFeedback[][] = [];
        for (const guess of savedProgress.guesses) {
          feedback.push(evaluateGuess(guess, currentWord));
        }
        
        setGameState({
          currentWord,
          guesses: savedProgress.guesses,
          currentGuess: '',
          gameStatus: savedProgress.gameStatus as 'playing' | 'won' | 'lost',
          feedback,
          hourId: currentHourId,
          timeToNextHour: timeToNext
        });
      } else {
        // Start new game
        const currentWord = await getCurrentHourWord();
        
        const newState: GameState = {
          currentWord,
          guesses: [],
          currentGuess: '',
          gameStatus: 'playing',
          feedback: [],
          hourId: currentHourId,
          timeToNextHour: timeToNext
        };
        
        setGameState(newState);
        saveGameProgress(newState);
      }
    } catch (err) {
      console.error('Failed to initialize game:', err);
      setError('Failed to load game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [loadGameProgress, saveGameProgress]);

  // Update timer
  useEffect(() => {
    const timer = setInterval(() => {
      const timeToNext = millisecondsToNextHour();
      setGameState(prev => ({ ...prev, timeToNextHour: timeToNext }));
      
      // Check if hour has changed
      const currentHourId = hourIdUtc();
      if (currentHourId !== gameState.hourId) {
        // Hour changed, reinitialize game
        initializeGame();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.hourId, initializeGame]);

  // Initialize on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Submit a guess
  const submitGuess = useCallback(async (guess: string): Promise<{ success: boolean; error?: string }> => {
    if (gameState.gameStatus !== 'playing') {
      return { success: false, error: 'Game is already finished' };
    }
    
    if (guess.length !== GUESS_LENGTH) {
      return { success: false, error: `Guess must be ${GUESS_LENGTH} letters` };
    }
    
    if (gameState.guesses.length >= MAX_GUESSES) {
      return { success: false, error: 'No more guesses allowed' };
    }
    
    // Validate guess
    try {
      if (!isValidGuess(guess)) {
        return { success: false, error: 'Not in word list' };
      }
    } catch (err) {
      console.error('Dictionary validation error:', err);
      return { success: false, error: 'Validation error' };
    }
    
    // Evaluate guess
    const feedback = evaluateGuess(guess, gameState.currentWord);
    const isCorrect = isCorrectGuess(guess, gameState.currentWord);
    const newGuesses = [...gameState.guesses, guess.toUpperCase()];
    const newFeedback = [...gameState.feedback, feedback];
    
    // Determine new game status
    let newStatus: 'playing' | 'won' | 'lost' = 'playing';
    if (isCorrect) {
      newStatus = 'won';
    } else if (newGuesses.length >= MAX_GUESSES) {
      newStatus = 'lost';
    }
    
    // Update state
    const newState: GameState = {
      ...gameState,
      guesses: newGuesses,
      currentGuess: '',
      gameStatus: newStatus,
      feedback: newFeedback
    };
    
    setGameState(newState);
    saveGameProgress(newState);
    
    return { success: true };
  }, [gameState, saveGameProgress]);

  // Update current guess
  const updateCurrentGuess = useCallback((guess: string) => {
    if (gameState.gameStatus !== 'playing') return;
    
    const sanitized = guess.toUpperCase().replace(/[^A-Z]/g, '');
    const truncated = sanitized.slice(0, GUESS_LENGTH);
    
    setGameState(prev => ({ ...prev, currentGuess: truncated }));
  }, [gameState.gameStatus]);

  // Reset game (for new hour)
  const resetGame = useCallback(async () => {
    await initializeGame();
  }, [initializeGame]);

  return {
    gameState,
    submitGuess,
    updateCurrentGuess,
    resetGame,
    getHint,
    isLoading,
    error
  };
}