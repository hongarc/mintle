import React, { useState } from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import { useToast } from './hooks/useToast';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Header from './components/Header';
import GameBoard from './components/GameBoard';
import Keyboard from './components/Keyboard';
import ResultModal from './components/ResultModal';
import { ToastContainer } from './components/Toast';
import './App.css';

const GameContent: React.FC = () => {
  const { gameState, submitGuess, updateCurrentGuess, resetGame, isLoading, error } = useGame();
  const { toasts, showToast, removeToast } = useToast();
  const [showResultModal, setShowResultModal] = useState(false);

  const handleKeyPress = async (key: string) => {
    if (key === 'ENTER') {
      if (gameState.currentGuess.length === 5) {
        const result = await submitGuess(gameState.currentGuess);
        if (!result.success && result.error) {
          showToast(result.error, 'error');
        } else if (result.success && gameState.gameStatus !== 'playing') {
          // Game ended, show result modal after a brief delay
          setTimeout(() => setShowResultModal(true), 1000);
        }
      }
    } else if (key === 'BACKSPACE') {
      if (gameState.currentGuess.length > 0) {
        updateCurrentGuess(gameState.currentGuess.slice(0, -1));
      }
    } else if (key.match(/^[A-Z]$/)) {
      if (gameState.currentGuess.length < 5) {
        updateCurrentGuess(gameState.currentGuess + key);
      }
    }
  };

  const handleNewGame = async () => {
    await resetGame();
    setShowResultModal(false);
    showToast('New game started!', 'success');
  };

  const handleShare = () => {
    showToast('Result copied to clipboard!', 'success');
  };

  // Handle physical keyboard input
  React.useEffect(() => {
    const handlePhysicalKeyPress = (event: KeyboardEvent) => {
      // Prevent default behavior for game keys
      if (event.key.match(/^[a-zA-Z]$/) || event.key === 'Enter' || event.key === 'Backspace') {
        event.preventDefault();
      }

      // Convert to uppercase and handle
      if (event.key.match(/^[a-zA-Z]$/)) {
        handleKeyPress(event.key.toUpperCase());
      } else if (event.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (event.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      }
    };

    // Add event listener
    document.addEventListener('keydown', handlePhysicalKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handlePhysicalKeyPress);
    };
  }, [gameState.currentGuess, gameState.gameStatus]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading game..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Game Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload Game</button>
      </div>
    );
  }

  const isGameOver = gameState.gameStatus !== 'playing';

  return (
    <div className="app">
      <Header
        timeToNextHour={gameState.timeToNextHour}
        currentAttempt={gameState.guesses.length}
        maxAttempts={6}
        gameStatus={gameState.gameStatus}
        onNewGame={gameState.timeToNextHour <= 0 ? handleNewGame : undefined}
      />

      <main className="game-container">
        <GameBoard
          guesses={gameState.guesses}
          currentGuess={gameState.currentGuess}
          feedback={gameState.feedback}
          maxGuesses={6}
          isGameOver={isGameOver}
        />

        <Keyboard
          onKeyPress={handleKeyPress}
          disabled={isGameOver}
          allFeedback={gameState.feedback}
          currentGuess={gameState.currentGuess}
          maxGuessLength={5}
        />
      </main>

      <ResultModal
        isOpen={showResultModal}
        gameStatus={gameState.gameStatus as 'won' | 'lost'}
        secretWord={gameState.currentWord}
        attempts={gameState.guesses.length}
        maxAttempts={6}
        feedback={gameState.feedback}
        timeToNextHour={gameState.timeToNextHour}
        onClose={() => setShowResultModal(false)}
        onShare={handleShare}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </ErrorBoundary>
  );
};

export default App;
