import React, { useMemo } from 'react';
import { useViewport } from './ResponsiveContainer';
import type { LetterFeedback } from '../types/game';
import './DynamicGameBoard.css';

interface DynamicGameBoardProps {
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
  size: number;
  fontSize: number;
}

const DynamicTile: React.FC<TileProps> = ({ 
  letter, 
  status = 'empty', 
  animate = false,
  size,
  fontSize
}) => {
  const tileStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${fontSize}px`,
  };

  return (
    <div 
      className={`dynamic-tile ${status} ${animate ? 'animate' : ''}`}
      style={tileStyle}
      data-testid="dynamic-game-tile"
    >
      {letter}
    </div>
  );
};

interface DynamicRowProps {
  guess: string;
  feedback?: LetterFeedback[];
  isCurrentRow: boolean;
  currentGuess?: string;
  isRevealing: boolean;
  tileSize: number;
  fontSize: number;
  gap: number;
}

const DynamicRow: React.FC<DynamicRowProps> = ({ 
  guess, 
  feedback, 
  isCurrentRow, 
  currentGuess = '', 
  isRevealing,
  tileSize,
  fontSize,
  gap
}) => {
  const letters = Array(5).fill('');
  
  if (feedback && guess) {
    for (let i = 0; i < 5; i++) {
      letters[i] = feedback[i]?.letter || '';
    }
  } else if (isCurrentRow) {
    for (let i = 0; i < currentGuess.length && i < 5; i++) {
      letters[i] = currentGuess[i];
    }
  } else if (guess) {
    for (let i = 0; i < guess.length && i < 5; i++) {
      letters[i] = guess[i];
    }
  }

  const rowStyle = {
    gap: `${gap}px`,
  };

  return (
    <div className="dynamic-game-row" style={rowStyle} data-testid="dynamic-game-row">
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
          <DynamicTile
            key={index}
            letter={letter}
            status={status}
            animate={!!(isRevealing && feedback && feedback[index])}
            size={tileSize}
            fontSize={fontSize}
          />
        );
      })}
    </div>
  );
};

export const DynamicGameBoard: React.FC<DynamicGameBoardProps> = ({
  guesses,
  currentGuess,
  feedback,
  maxGuesses = 6,
  isGameOver
}) => {
  const viewport = useViewport();

  // Calculate optimal tile size and spacing based on viewport
  const boardDimensions = useMemo(() => {
    const { width, height, isMobile, isTablet, orientation } = viewport;
    
    // Available space calculations
    const availableWidth = width - 32; // Account for padding
    const availableHeight = height - 200; // Account for header and keyboard
    
    // Base tile size calculations
    let tileSize: number;
    let gap: number;
    let fontSize: number;
    
    if (isMobile) {
      if (orientation === 'landscape') {
        // Landscape mobile - prioritize fitting in height
        const maxTileHeight = Math.floor((availableHeight - (5 * 4)) / 6); // 6 rows, 5px gaps
        const maxTileWidth = Math.floor((availableWidth - (4 * 4)) / 5); // 5 columns, 4px gaps
        tileSize = Math.min(maxTileHeight, maxTileWidth, 45);
        gap = 3;
        fontSize = Math.max(tileSize * 0.4, 14);
      } else {
        // Portrait mobile - optimize for width
        const maxTileWidth = Math.floor((availableWidth - (4 * 5)) / 5); // 5 columns, 5px gaps
        tileSize = Math.min(maxTileWidth, 62, Math.max(40, maxTileWidth));
        gap = Math.max(3, Math.floor(tileSize * 0.08));
        fontSize = Math.max(tileSize * 0.35, 16);
      }
    } else if (isTablet) {
      // Tablet - balanced approach
      const maxTileWidth = Math.floor((availableWidth - (4 * 6)) / 5);
      tileSize = Math.min(maxTileWidth, 70, Math.max(50, maxTileWidth));
      gap = 6;
      fontSize = Math.max(tileSize * 0.4, 18);
    } else {
      // Desktop - standard size
      tileSize = 62;
      gap = 5;
      fontSize = 32;
    }
    
    // Ensure minimum sizes for accessibility
    tileSize = Math.max(tileSize, 40);
    fontSize = Math.max(fontSize, 14);
    
    return {
      tileSize: Math.floor(tileSize),
      gap: Math.floor(gap),
      fontSize: Math.floor(fontSize),
      boardWidth: (tileSize * 5) + (gap * 4),
      boardHeight: (tileSize * maxGuesses) + (gap * (maxGuesses - 1)),
    };
  }, [viewport, maxGuesses]);

  const rows = Array(maxGuesses).fill(null);

  const boardStyle = {
    gap: `${boardDimensions.gap}px`,
    width: `${boardDimensions.boardWidth}px`,
    height: `${boardDimensions.boardHeight}px`,
  };

  return (
    <div 
      className="dynamic-game-board" 
      style={boardStyle}
      data-testid="dynamic-game-board"
      data-tile-size={boardDimensions.tileSize}
      data-viewport-type={viewport.isMobile ? 'mobile' : viewport.isTablet ? 'tablet' : 'desktop'}
    >
      {rows.map((_, rowIndex) => {
        const isCurrentRow = rowIndex === guesses.length && !isGameOver;
        const guess = guesses[rowIndex] || '';
        const rowFeedback = feedback[rowIndex];
        const isRevealing = rowFeedback && rowIndex === guesses.length - 1;

        return (
          <DynamicRow
            key={rowIndex}
            guess={guess}
            feedback={rowFeedback}
            isCurrentRow={isCurrentRow}
            currentGuess={isCurrentRow ? currentGuess : ''}
            isRevealing={!!isRevealing}
            tileSize={boardDimensions.tileSize}
            fontSize={boardDimensions.fontSize}
            gap={boardDimensions.gap}
          />
        );
      })}
    </div>
  );
};

export default DynamicGameBoard;