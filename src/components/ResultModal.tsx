import React, { useEffect, useState } from 'react';
import type { LetterFeedback } from '../types/game';
import { formatTimeRemaining } from '../lib/timeUtils';
import './ResultModal.css';

interface ResultModalProps {
  isOpen: boolean;
  gameStatus: 'won' | 'lost';
  secretWord: string;
  attempts: number;
  maxAttempts: number;
  feedback: LetterFeedback[][];
  timeToNextHour: number;
  onClose: () => void;
  onShare?: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  gameStatus,
  secretWord,
  attempts,
  maxAttempts,
  feedback,
  timeToNextHour,
  onClose,
  onShare
}) => {
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const generateShareText = (): string => {
    const title = 'Hourly Wordle';
    const result = gameStatus === 'won' ? `${attempts}/${maxAttempts}` : 'X/6';
    
    let grid = '';
    for (const row of feedback) {
      for (const letter of row) {
        switch (letter.status) {
          case 'correct':
            grid += '🟩';
            break;
          case 'present':
            grid += '🟨';
            break;
          case 'absent':
            grid += '⬜';
            break;
        }
      }
      grid += '\n';
    }

    return `${title} ${result}\n\n${grid.trim()}\n\nPlay at: ${window.location.origin}`;
  };

  const handleShare = async () => {
    const shareText = generateShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hourly Wordle',
          text: shareText
        });
      } catch (error) {
        // User cancelled or error occurred, fall back to clipboard
        handleCopyToClipboard(shareText);
      }
    } else {
      handleCopyToClipboard(shareText);
    }

    if (onShare) {
      onShare();
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const renderEmojiGrid = () => {
    return feedback.map((row, rowIndex) => (
      <div key={rowIndex} className="emoji-row">
        {row.map((letter, letterIndex) => {
          let emoji = '⬜';
          switch (letter.status) {
            case 'correct':
              emoji = '🟩';
              break;
            case 'present':
              emoji = '🟨';
              break;
            case 'absent':
              emoji = '⬜';
              break;
          }
          return (
            <span key={letterIndex} className="emoji-tile">
              {emoji}
            </span>
          );
        })}
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" data-testid="result-modal">
      <div className="modal-content">
        <button 
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
          data-testid="close-modal"
        >
          ×
        </button>

        <div className="modal-header">
          <h2 className={`result-title ${gameStatus}`}>
            {gameStatus === 'won' ? '🎉 Congratulations!' : '😔 Game Over'}
          </h2>
          
          <div className="result-stats">
            {gameStatus === 'won' ? (
              <p>You guessed the word in <strong>{attempts}</strong> attempts!</p>
            ) : (
              <p>The word was <strong>{secretWord}</strong></p>
            )}
          </div>
        </div>

        <div className="modal-body">
          <div className="emoji-grid">
            {renderEmojiGrid()}
          </div>

          <div className="game-stats">
            <div className="stat-item">
              <div className="stat-value">{attempts}</div>
              <div className="stat-label">Attempts</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{gameStatus === 'won' ? '✓' : '✗'}</div>
              <div className="stat-label">Result</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatTimeRemaining(timeToNextHour)}</div>
              <div className="stat-label">Next Game</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="share-button"
            onClick={handleShare}
            data-testid="share-button"
          >
            📋 Share Result
          </button>
          
          {showShareSuccess && (
            <div className="share-success" data-testid="share-success">
              ✓ Copied to clipboard!
            </div>
          )}

          <div className="next-game-info">
            <p>Next word available in <strong>{formatTimeRemaining(timeToNextHour)}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;