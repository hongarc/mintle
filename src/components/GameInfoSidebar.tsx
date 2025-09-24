import React from 'react';
import { formatTimeRemaining } from '../lib/timeUtils';
import { useViewport } from './ResponsiveContainer';
import './GameInfoSidebar.css';

interface GameInfoSidebarProps {
  timeToNextHour: number;
  currentAttempt: number;
  maxAttempts: number;
  gameStatus: 'playing' | 'won' | 'lost';
  onNewGame?: () => void;
  showNewGameButton?: boolean;
}

export const GameInfoSidebar: React.FC<GameInfoSidebarProps> = ({
  timeToNextHour,
  currentAttempt,
  maxAttempts,
  gameStatus,
  onNewGame,
  showNewGameButton = false
}) => {
  const viewport = useViewport();
  const timeRemaining = formatTimeRemaining(timeToNextHour);
  const progressPercentage = (currentAttempt / maxAttempts) * 100;
  const isGameOver = gameStatus !== 'playing';

  // Hide sidebar on mobile to save space
  if (viewport.isMobile) {
    return null;
  }

  return (
    <aside className="game-info-sidebar" data-testid="game-info-sidebar">
      <div className="sidebar-content">
        <div className="header-section">
          <h1 className="game-title">
            <span className="title-letter m">M</span>
            <span className="title-letter i">i</span>
            <span className="title-letter n">n</span>
            <span className="title-letter t">t</span>
            <span className="title-letter l">l</span>
            <span className="title-letter e">e</span>
          </h1>
          {showNewGameButton && onNewGame && (
            <button 
              className="new-game-button"
              onClick={onNewGame}
              data-testid="new-game-button"
            >
              New Game
            </button>
          )}
        </div>
        
        <div className="info-section">
          <div className="info-item">
            <div className="info-label">Next Word</div>
            <div className="info-value timer-value">
              <span className="timer-icon">⏱️</span>
              {timeRemaining}
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-label">Attempts</div>
            <div className="info-value attempts-value">
              {currentAttempt}/{maxAttempts}
            </div>
          </div>
          
          {isGameOver && (
            <div className="info-item game-status">
              <div className="info-label">Status</div>
              <div className={`status-badge ${gameStatus}`}>
                {gameStatus === 'won' ? '🎉 Won!' : '😔 Lost'}
              </div>
            </div>
          )}
        </div>
        
        <div className="progress-section">
          <div className="progress-label">Progress</div>
          <div className="progress-container">
            <div 
              className="progress-bar"
              role="progressbar"
              aria-valuenow={currentAttempt}
              aria-valuemin={0}
              aria-valuemax={maxAttempts}
              aria-label={`${currentAttempt} of ${maxAttempts} attempts used`}
            >
              <div 
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="progress-text">
              {Math.round(progressPercentage)}%
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default GameInfoSidebar;