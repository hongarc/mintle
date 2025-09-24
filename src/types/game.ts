export interface WordDocument {
  word: string;
  createdAt: string;
  source: 'client';
  dictionaryVersion: string;
  hash?: string;
}

export interface LetterFeedback {
  letter: string;
  status: 'correct' | 'present' | 'absent';
}

export interface GameState {
  currentWord: string;
  guesses: string[];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  feedback: LetterFeedback[][];
  hourId: string;
  timeToNextHour: number;
}

export interface GameProgress {
  hourId: string;
  guesses: string[];
  gameStatus: string;
  lastPlayed: string;
}

export interface Dictionary {
  solutions: Set<string>;
  allowed: Set<string>;
  version: string;
  hash: string;
}