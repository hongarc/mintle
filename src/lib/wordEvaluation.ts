import type { LetterFeedback } from '../types/game';

/**
 * Evaluate a guess against the secret word and return feedback for each letter
 * Handles duplicate letters correctly using a two-pass algorithm
 * @param guess - The 5-letter guess word
 * @param secret - The 5-letter secret word
 * @returns Array of feedback for each letter position
 */
export function evaluateGuess(guess: string, secret: string): LetterFeedback[] {
  if (guess.length !== 5 || secret.length !== 5) {
    throw new Error('Both guess and secret must be exactly 5 letters');
  }

  const guessLower = guess.toLowerCase();
  const secretLower = secret.toLowerCase();
  
  const feedback: LetterFeedback[] = new Array(5);
  const secretLetterCounts = new Map<string, number>();
  
  // Count letters in secret word
  for (const letter of secretLower) {
    secretLetterCounts.set(letter, (secretLetterCounts.get(letter) || 0) + 1);
  }
  
  // First pass: mark exact matches (green)
  for (let i = 0; i < 5; i++) {
    const guessLetter = guessLower[i];
    const secretLetter = secretLower[i];
    
    if (guessLetter === secretLetter) {
      feedback[i] = {
        letter: guess[i],
        status: 'correct'
      };
      // Decrease count for this letter
      secretLetterCounts.set(guessLetter, secretLetterCounts.get(guessLetter)! - 1);
    }
  }
  
  // Second pass: mark present letters (yellow) and absent letters (gray)
  for (let i = 0; i < 5; i++) {
    if (feedback[i]) continue; // Skip already marked correct letters
    
    const guessLetter = guessLower[i];
    const remainingCount = secretLetterCounts.get(guessLetter) || 0;
    
    if (remainingCount > 0) {
      feedback[i] = {
        letter: guess[i],
        status: 'present'
      };
      // Decrease count for this letter
      secretLetterCounts.set(guessLetter, remainingCount - 1);
    } else {
      feedback[i] = {
        letter: guess[i],
        status: 'absent'
      };
    }
  }
  
  return feedback;
}

/**
 * Check if a guess is correct (all letters match)
 * @param guess - The guess word
 * @param secret - The secret word
 * @returns True if guess matches secret exactly
 */
export function isCorrectGuess(guess: string, secret: string): boolean {
  return guess.toLowerCase() === secret.toLowerCase();
}

/**
 * Get letter status for keyboard display
 * Aggregates feedback from all guesses to show best status for each letter
 * @param allFeedback - Array of feedback arrays from all guesses
 * @returns Map of letter to best status
 */
export function getKeyboardLetterStatus(allFeedback: LetterFeedback[][]): Map<string, 'correct' | 'present' | 'absent'> {
  const letterStatus = new Map<string, 'correct' | 'present' | 'absent'>();
  
  for (const feedback of allFeedback) {
    for (const letterFeedback of feedback) {
      const letter = letterFeedback.letter.toLowerCase();
      const currentStatus = letterStatus.get(letter);
      
      // Priority: correct > present > absent
      if (letterFeedback.status === 'correct') {
        letterStatus.set(letter, 'correct');
      } else if (letterFeedback.status === 'present' && currentStatus !== 'correct') {
        letterStatus.set(letter, 'present');
      } else if (letterFeedback.status === 'absent' && !currentStatus) {
        letterStatus.set(letter, 'absent');
      }
    }
  }
  
  return letterStatus;
}