import React, { useEffect, useCallback } from 'react';
// import { isValidGuess } from '../lib/dictionary';

interface GuessInputProps {
  currentGuess: string;
  onGuessChange: (guess: string) => void;
  onSubmitGuess: () => void;
  disabled: boolean;
  maxLength?: number;
}

export const GuessInput: React.FC<GuessInputProps> = ({
  currentGuess,
  onGuessChange,
  onSubmitGuess,
  disabled,
  maxLength = 5
}) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    const key = event.key.toLowerCase();

    // Handle letter input
    if (key.match(/^[a-z]$/) && currentGuess.length < maxLength) {
      event.preventDefault();
      onGuessChange(currentGuess + key.toUpperCase());
      return;
    }

    // Handle backspace
    if (key === 'backspace' && currentGuess.length > 0) {
      event.preventDefault();
      onGuessChange(currentGuess.slice(0, -1));
      return;
    }

    // Handle enter
    if (key === 'enter' && currentGuess.length === maxLength) {
      event.preventDefault();
      onSubmitGuess();
      return;
    }

    // Prevent other keys
    if (key.match(/^[a-z]$/) || key === 'backspace' || key === 'enter') {
      event.preventDefault();
    }
  }, [currentGuess, onGuessChange, onSubmitGuess, disabled, maxLength]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const handleVirtualKeyPress = (key: string) => {
    if (disabled) return;

    if (key === 'BACKSPACE') {
      if (currentGuess.length > 0) {
        onGuessChange(currentGuess.slice(0, -1));
      }
    } else if (key === 'ENTER') {
      if (currentGuess.length === maxLength) {
        onSubmitGuess();
      }
    } else if (key.match(/^[A-Z]$/) && currentGuess.length < maxLength) {
      onGuessChange(currentGuess + key);
    }
  };

  const canSubmit = currentGuess.length === maxLength && !disabled;

  return (
    <div className="guess-input" data-testid="guess-input">
      {/* Hidden input for accessibility */}
      <input
        type="text"
        value={currentGuess}
        onChange={() => {}} // Controlled by keyboard events
        disabled={disabled}
        maxLength={maxLength}
        className="sr-only"
        aria-label="Current guess"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
      />
      
      {/* Virtual keyboard for mobile */}
      <div className="virtual-keyboard" data-testid="virtual-keyboard">
        <div className="keyboard-row">
          {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(letter => (
            <button
              key={letter}
              className="key letter-key"
              onClick={() => handleVirtualKeyPress(letter)}
              disabled={disabled || currentGuess.length >= maxLength}
              data-testid={`key-${letter}`}
            >
              {letter}
            </button>
          ))}
        </div>
        
        <div className="keyboard-row">
          {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(letter => (
            <button
              key={letter}
              className="key letter-key"
              onClick={() => handleVirtualKeyPress(letter)}
              disabled={disabled || currentGuess.length >= maxLength}
              data-testid={`key-${letter}`}
            >
              {letter}
            </button>
          ))}
        </div>
        
        <div className="keyboard-row">
          <button
            className="key action-key"
            onClick={() => handleVirtualKeyPress('ENTER')}
            disabled={!canSubmit}
            data-testid="key-enter"
          >
            ENTER
          </button>
          
          {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(letter => (
            <button
              key={letter}
              className="key letter-key"
              onClick={() => handleVirtualKeyPress(letter)}
              disabled={disabled || currentGuess.length >= maxLength}
              data-testid={`key-${letter}`}
            >
              {letter}
            </button>
          ))}
          
          <button
            className="key action-key"
            onClick={() => handleVirtualKeyPress('BACKSPACE')}
            disabled={disabled || currentGuess.length === 0}
            data-testid="key-backspace"
          >
            ⌫
          </button>
        </div>
      </div>
      
      {/* Input status */}
      <div className="input-status" data-testid="input-status">
        <div className="guess-length">
          {currentGuess.length}/{maxLength}
        </div>
        {currentGuess.length === maxLength && (
          <div className="submit-hint">
            Press ENTER to submit
          </div>
        )}
      </div>
    </div>
  );
};

export default GuessInput;