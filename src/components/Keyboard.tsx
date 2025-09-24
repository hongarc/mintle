import React, { useEffect, useRef } from 'react';
import type { LetterFeedback } from '../types/game';
import { getKeyboardLetterStatus } from '../lib/wordEvaluation';
import { useViewport } from './ResponsiveContainer';
import { addTouchOptimizedListeners, triggerHapticFeedback } from '../lib/touchOptimization';
import './Keyboard.css';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  disabled: boolean;
  allFeedback: LetterFeedback[][];
  currentGuess: string;
  maxGuessLength: number;
}

interface KeyProps {
  letter: string;
  status?: 'correct' | 'present' | 'absent' | 'unused';
  onClick: () => void;
  disabled: boolean;
  className?: string;
}

const Key: React.FC<KeyProps> = ({ 
  letter, 
  status = 'unused', 
  onClick, 
  disabled, 
  className = '' 
}) => {
  const keyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const keyElement = keyRef.current;
    if (!keyElement || disabled) return;

    // Add touch-optimized event listeners with haptic feedback
    const cleanup = addTouchOptimizedListeners(
      keyElement,
      () => {
        onClick();
        // Provide haptic feedback based on key type
        if (letter === 'ENTER') {
          triggerHapticFeedback('medium');
        } else if (letter === '⌫') {
          triggerHapticFeedback('light');
        } else {
          triggerHapticFeedback('light');
        }
      },
      {
        hapticFeedback: true,
        preventDoubleClick: true,
      }
    );

    return cleanup;
  }, [onClick, disabled, letter]);

  return (
    <button
      ref={keyRef}
      className={`keyboard-key ${status} ${className} interactive`}
      onClick={onClick}
      disabled={disabled}
      data-testid={`keyboard-key-${letter}`}
      aria-label={`Key ${letter}`}
    >
      {letter}
    </button>
  );
};

const KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  disabled,
  allFeedback,
  currentGuess,
  maxGuessLength
}) => {
  const viewport = useViewport();
  const letterStatuses = getKeyboardLetterStatus(allFeedback);
  
  const handleKeyClick = (key: string) => {
    if (disabled) return;
    onKeyPress(key);
  };

  const getKeyStatus = (letter: string): 'correct' | 'present' | 'absent' | 'unused' => {
    const status = letterStatuses.get(letter.toLowerCase());
    return status || 'unused';
  };

  const isKeyDisabled = (key: string): boolean => {
    if (disabled) return true;
    
    if (key === 'ENTER') {
      return currentGuess.length !== maxGuessLength;
    }
    
    if (key === 'BACKSPACE') {
      return currentGuess.length === 0;
    }
    
    // Letter keys are disabled if guess is at max length
    if (key.match(/^[A-Z]$/)) {
      return currentGuess.length >= maxGuessLength;
    }
    
    return false;
  };

  const renderKey = (key: string) => {
    if (key === 'ENTER') {
      return (
        <Key
          key={key}
          letter="ENTER"
          onClick={() => handleKeyClick('ENTER')}
          disabled={isKeyDisabled(key)}
          className="action-key enter-key"
        />
      );
    }
    
    if (key === 'BACKSPACE') {
      return (
        <Key
          key={key}
          letter="⌫"
          onClick={() => handleKeyClick('BACKSPACE')}
          disabled={isKeyDisabled(key)}
          className="action-key backspace-key"
        />
      );
    }
    
    return (
      <Key
        key={key}
        letter={key}
        status={getKeyStatus(key)}
        onClick={() => handleKeyClick(key)}
        disabled={isKeyDisabled(key)}
        className="letter-key"
      />
    );
  };

  const keyboardClasses = [
    'keyboard',
    viewport.isMobile && 'mobile',
    viewport.isTablet && 'tablet',
    viewport.isDesktop && 'desktop',
    viewport.orientation,
  ].filter(Boolean).join(' ');

  return (
    <div className={keyboardClasses} data-testid="keyboard">
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row" data-testid={`keyboard-row-${rowIndex}`}>
          {row.map(renderKey)}
        </div>
      ))}
      
      {/* Status indicator */}
      <div className="keyboard-status" data-testid="keyboard-status">
        <div className="guess-progress">
          {currentGuess.length}/{maxGuessLength}
        </div>
        {currentGuess.length === maxGuessLength && (
          <div className="ready-indicator">
            Ready to submit!
          </div>
        )}
      </div>
    </div>
  );
};

export default Keyboard;