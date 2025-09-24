import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useViewport } from './ResponsiveContainer';
import { formatTimeRemaining } from '../lib/timeUtils';
import { addTouchOptimizedListeners, triggerHapticFeedback } from '../lib/touchOptimization';
import './MobileOptimizedHeader.css';

interface MobileOptimizedHeaderProps {
  timeToNextHour: number;
  currentAttempt: number;
  maxAttempts: number;
  gameStatus: 'playing' | 'won' | 'lost';
  onNewGame?: () => void;
}

export const MobileOptimizedHeader: React.FC<MobileOptimizedHeaderProps> = ({
  timeToNextHour,
  currentAttempt,
  maxAttempts,
  gameStatus,
  onNewGame
}) => {
  const viewport = useViewport();
  const [isExpanded, setIsExpanded] = useState(false);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const newGameButtonRef = useRef<HTMLButtonElement>(null);
  
  const timeRemaining = formatTimeRemaining(timeToNextHour);
  const isGameOver = gameStatus !== 'playing';
  const progressPercentage = (currentAttempt / maxAttempts) * 100;

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
    triggerHapticFeedback('light');
  }, []);

  // Add touch optimization to expand button
  useEffect(() => {
    const expandButton = expandButtonRef.current;
    if (!expandButton) return;

    const cleanup = addTouchOptimizedListeners(
      expandButton,
      toggleExpanded,
      {
        hapticFeedback: true,
        preventDoubleClick: true,
      }
    );

    return cleanup;
  }, [toggleExpanded]);

  // Add touch optimization to new game button
  useEffect(() => {
    const newGameButton = newGameButtonRef.current;
    if (!newGameButton || !onNewGame) return;

    const cleanup = addTouchOptimizedListeners(
      newGameButton,
      () => {
        onNewGame();
        triggerHapticFeedback('medium');
      },
      {
        hapticFeedback: true,
        preventDoubleClick: true,
      }
    );

    return cleanup;
  }, [onNewGame]);

  // Determine if we should use compact mode
  const useCompactMode = viewport.isMobile && (
    viewport.orientation === 'landscape' || 
    viewport.height < 600
  );

  const headerClasses = [
    'mobile-optimized-header',
    viewport.isMobile && 'mobile',
    viewport.isTablet && 'tablet',
    viewport.isDesktop && 'desktop',
    viewport.orientation,
    useCompactMode && 'compact',
    isExpanded && 'expanded',
    isGameOver && 'game-over'
  ].filter(Boolean).join(' ');

  return (
    <header className={headerClasses} data-testid="mobile-optimized-header">
      <div className="header-main">
        <div className="title-section">
          <h1 className="game-title">
            {useCompactMode ? 'Hourly' : 'Hourly Wordle'}
          </h1>
          {!useCompactMode && (
            <p className="game-subtitle">A new word every hour</p>
          )}
        </div>

        <div className="essential-info">
          <div className="timer-compact">
            <span className="timer-icon" aria-label="Time remaining">⏱️</span>
            <span className="timer-value">{timeRemaining}</span>
          </div>
          
          <div className="attempts-compact">
            <span className="attempts-value">{currentAttempt}/{maxAttempts}</span>
          </div>

          {viewport.isMobile && (
            <button
              ref={expandButtonRef}
              className="expand-toggle interactive"
              onClick={toggleExpanded}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse header' : 'Expand header'}
            >
              <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                ▼
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable content for mobile */}
      <div className={`header-details ${isExpanded || !viewport.isMobile ? 'visible' : 'hidden'}`}>
        <div className="detailed-info">
          <div className="timer-section">
            <div className="info-label">Next word in:</div>
            <div className="info-value timer-detailed">{timeRemaining}</div>
          </div>
          
          <div className="attempts-section">
            <div className="info-label">Attempts:</div>
            <div className="info-value attempts-detailed">{currentAttempt}/{maxAttempts}</div>
          </div>
          
          {isGameOver && (
            <div className="game-status-section">
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
            ref={newGameButtonRef}
            className="new-game-button interactive"
            onClick={onNewGame}
            data-testid="new-game-button"
          >
            <span className="button-icon">🎮</span>
            <span className="button-text">New Game Available!</span>
          </button>
        )}
      </div>
      
      {/* Progress bar */}
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
        {viewport.isMobile && (
          <div className="progress-text">
            {currentAttempt}/{maxAttempts}
          </div>
        )}
      </div>

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isGameOver && `Game ${gameStatus}. ${timeToNextHour > 0 ? `Next game in ${timeRemaining}` : 'New game available'}`}
      </div>
    </header>
  );
};

export default MobileOptimizedHeader;