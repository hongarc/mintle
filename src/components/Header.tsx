import React from 'react';
import { formatTimeRemaining } from '../lib/timeUtils';
import './Header.css';

interface HeaderProps {
  timeToNextHour: number;
  currentAttempt: number;
  maxAttempts: number;
  gameStatus: 'playing' | 'won' | 'lost';
  onNewGame?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  timeToNextHour,
  currentAttempt,
  maxAttempts,
  gameStatus,
  onNewGame
}) => {
  const timeRemaining = formatTimeRemaining(timeToNextHour);
  const isGameOver = gameStatus !== 'playing';
  
  return (
    <header className="game-header" data-testid="game-header">
      <div className="header-content">
        <div className="game-title">
          <h1>Hourly Wordle</h1>
          <p className="game-subtitle">A new word every hour</p>
        </div>
        
        <div className="game-info">
          <div className="timer-section">
            <div className="timer-label">Next word in:</div>
            <div className="countdown-timer" data-testid="countdown-timer">
              {timeRemaining}
            </div>
          </div>
          
          <div className="attempts-section">
            <div className="attempts-label">Attempts:</div>
            <div className="attempts-counter" data-testid="attempts-counter">
              {currentAttempt}/{maxAttempts}
            </div>
          </div>
          
          {isGameOver && (
            <div className="game-status">
              <div className={`status-badge ${gameStatus}`}>
                {gameStatus === 'won' ? '🎉 Won!' : '😔 Lost'}
              </div>
              {timeToNextHour > 0 && (
                <div className="next-game-info">
                  Next game in {timeRemaining}
                </div>
              )}
            </div>
          )}
        </div>
        
        {onNewGame && timeToNextHour <= 0 && (
          <button 
            className="new-game-button"
            onClick={onNewGame}
            data-testid="new-game-button"
          >
            New Game Available!
          </button>
        )}
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${(currentAttempt / maxAttempts) * 100}%` }}
        />
      </div>
    </header>
  );
};

export default Header;