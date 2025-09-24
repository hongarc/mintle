import React from 'react';
import { formatTimeRemaining } from '../lib/timeUtils';
import { useViewport } from './ResponsiveContainer';
import './MobileInfoBar.css';

interface MobileInfoBarProps {
  timeToNextHour: number;
  currentAttempt: number;
  maxAttempts: number;
  gameStatus: 'playing' | 'won' | 'lost';
}

export const MobileInfoBar: React.FC<MobileInfoBarProps> = ({
  timeToNextHour,
  currentAttempt,
  maxAttempts,
  gameStatus
}) => {
  const viewport = useViewport();
  const timeRemaining = formatTimeRemaining(timeToNextHour);
  const progressPercentage = (currentAttempt / maxAttempts) * 100;
  const isGameOver = gameStatus !== 'playing';

  // Only show on mobile when sidebar is hidden
  if (!viewport.isMobile) {
    return null;
  }

  return (
    <div className="mobile-info-bar" data-testid="mobile-info-bar">
      <div className="info-items">
        <div className="info-item">
          <span className="info-icon">⏱️</span>
          <span className="info-text">{timeRemaining}</span>
        </div>
        
        <div className="info-item">
          <span className="info-text">{currentAttempt}/{maxAttempts}</span>
        </div>
        
        {isGameOver && (
          <div className="info-item status">
            <span className={`status-indicator ${gameStatus}`}>
              {gameStatus === 'won' ? '🎉' : '😔'}
            </span>
          </div>
        )}
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default MobileInfoBar;