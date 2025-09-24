import React from 'react';
import type { LetterFeedback } from '../types/game';
import './GameBoard.css';

interface GameBoardProps {
  guesses: string[];
  currentGuess: string;
  feedback: LetterFeedback[][];
  maxGuesses?: number;
  isGameOver: boolean;
}

interface TileProps {
  letter: string;
  status?: 'correct' | 'present' | 'absent' | 'empty' | 'pending';
  animate?: boolean;
}

const Tile: React.FC<TileProps> = ({ letter, status = 'empty', animate = false }) => {
  return (
    <div 
      className={`tile ${status} ${animate ? 'animate' : ''}`}
      data-testid="game-tile"
    >
      {letter}
    </div>
  );
};

interface RowProps {
  guess: string;
  feedback?: LetterFeedback[];
  isCurrentRow: boolean;
  currentGuess?: string;
  isRevealing: boolean;
}

const Row: React.FC<RowProps> = ({ 
  guess, 
  feedback, 
  isCurrentRow, 
  currentGuess = '', 
  isRevealing 
}) => {
  const letters = Array(5).fill('');
  
  if (feedback && guess) {
    // Completed row with feedback
    for (let i = 0; i < 5; i++) {
      letters[i] = feedback[i]?.letter || '';
    }
  } else if (isCurrentRow) {
    // Current row being typed
    for (let i = 0; i < currentGuess.length && i < 5; i++) {
      letters[i] = currentGuess[i];
    }
  } else if (guess) {
    // Submitted row without feedback yet
    for (let i = 0; i < guess.length && i < 5; i++) {
      letters[i] = guess[i];
    }
  }

  return (
    <div className="game-row" data-testid="game-row">
      {letters.map((letter, index) => {
        let status: 'correct' | 'present' | 'absent' | 'empty' | 'pending' = 'empty';
        
        if (feedback && feedback[index]) {
          status = feedback[index].status;
        } else if (letter && !isCurrentRow) {
          status = 'pending';
        } else if (letter && isCurrentRow) {
          status = 'pending';
        }

        return (
          <Tile
            key={index}
            letter={letter}
            status={status}
            animate={!!(isRevealing && feedback && feedback[index])}
          />
        );
      })}
    </div>
  );
};

export const GameBoard: React.FC<GameBoardProps> = ({
  guesses,
  currentGuess,
  feedback,
  maxGuesses = 6,
  isGameOver
}) => {
  const rows = Array(maxGuesses).fill(null);

  return (
    <div className="game-board" data-testid="game-board">
      {rows.map((_, rowIndex) => {
        const isCurrentRow = rowIndex === guesses.length && !isGameOver;
        const guess = guesses[rowIndex] || '';
        const rowFeedback = feedback[rowIndex];
        const isRevealing = rowFeedback && rowIndex === guesses.length - 1;

        return (
          <Row
            key={rowIndex}
            guess={guess}
            feedback={rowFeedback}
            isCurrentRow={isCurrentRow}
            currentGuess={isCurrentRow ? currentGuess : ''}
            isRevealing={!!isRevealing}
          />
        );
      })}
    </div>
  );
};

export default GameBoard;