import { describe, it, expect } from 'vitest';
import { evaluateGuess, isCorrectGuess, getKeyboardLetterStatus } from '../wordEvaluation';
import type { LetterFeedback } from '../../types/game';

describe('wordEvaluation', () => {
  describe('evaluateGuess', () => {
    it('should handle exact match', () => {
      const result = evaluateGuess('HELLO', 'HELLO');
      expect(result).toEqual([
        { letter: 'H', status: 'correct' },
        { letter: 'E', status: 'correct' },
        { letter: 'L', status: 'correct' },
        { letter: 'L', status: 'correct' },
        { letter: 'O', status: 'correct' }
      ]);
    });

    it('should handle no matches', () => {
      const result = evaluateGuess('ABCDE', 'FGHIJ');
      expect(result).toEqual([
        { letter: 'A', status: 'absent' },
        { letter: 'B', status: 'absent' },
        { letter: 'C', status: 'absent' },
        { letter: 'D', status: 'absent' },
        { letter: 'E', status: 'absent' }
      ]);
    });

    it('should handle mixed correct and present letters', () => {
      const result = evaluateGuess('CRANE', 'TRACE');
      expect(result).toEqual([
        { letter: 'C', status: 'present' },
        { letter: 'R', status: 'correct' },
        { letter: 'A', status: 'correct' },
        { letter: 'N', status: 'absent' },
        { letter: 'E', status: 'correct' }
      ]);
    });

    it('should handle duplicate letters correctly - BOOST vs BOOEE', () => {
      const result = evaluateGuess('BOOEE', 'BOOST');
      expect(result).toEqual([
        { letter: 'B', status: 'correct' },
        { letter: 'O', status: 'correct' },
        { letter: 'O', status: 'correct' },
        { letter: 'E', status: 'absent' },
        { letter: 'E', status: 'absent' }
      ]);
    });

    it('should handle duplicate letters correctly - ALLEY vs LLAMA', () => {
      const result = evaluateGuess('ALLEY', 'LLAMA');
      expect(result).toEqual([
        { letter: 'A', status: 'present' },
        { letter: 'L', status: 'correct' },
        { letter: 'L', status: 'present' }, // Second L is present but not in correct position
        { letter: 'E', status: 'absent' },
        { letter: 'Y', status: 'absent' }
      ]);
    });

    it('should handle complex duplicate scenario - SPEED vs ERASE', () => {
      const result = evaluateGuess('SPEED', 'ERASE');
      expect(result).toEqual([
        { letter: 'S', status: 'present' },
        { letter: 'P', status: 'absent' },
        { letter: 'E', status: 'present' },
        { letter: 'E', status: 'present' },
        { letter: 'D', status: 'absent' }
      ]);
    });

    it('should handle case insensitivity', () => {
      const result = evaluateGuess('hello', 'HELLO');
      expect(result).toEqual([
        { letter: 'h', status: 'correct' },
        { letter: 'e', status: 'correct' },
        { letter: 'l', status: 'correct' },
        { letter: 'l', status: 'correct' },
        { letter: 'o', status: 'correct' }
      ]);
    });

    it('should throw error for invalid word lengths', () => {
      expect(() => evaluateGuess('HI', 'HELLO')).toThrow('Both guess and secret must be exactly 5 letters');
      expect(() => evaluateGuess('HELLO', 'HI')).toThrow('Both guess and secret must be exactly 5 letters');
      expect(() => evaluateGuess('HELLOO', 'HELLO')).toThrow('Both guess and secret must be exactly 5 letters');
    });

    it('should handle tricky duplicate case - LLAMA vs ALLEY', () => {
      const result = evaluateGuess('LLAMA', 'ALLEY');
      expect(result).toEqual([
        { letter: 'L', status: 'present' },
        { letter: 'L', status: 'correct' },
        { letter: 'A', status: 'present' }, // A is present in ALLEY at position 0
        { letter: 'M', status: 'absent' },
        { letter: 'A', status: 'absent' } // Second A is absent (already used first A)
      ]);
    });
  });

  describe('isCorrectGuess', () => {
    it('should return true for exact matches', () => {
      expect(isCorrectGuess('HELLO', 'HELLO')).toBe(true);
      expect(isCorrectGuess('hello', 'HELLO')).toBe(true);
      expect(isCorrectGuess('HeLLo', 'hello')).toBe(true);
    });

    it('should return false for non-matches', () => {
      expect(isCorrectGuess('HELLO', 'WORLD')).toBe(false);
      expect(isCorrectGuess('HELL', 'HELLO')).toBe(false);
      expect(isCorrectGuess('HELLOO', 'HELLO')).toBe(false);
    });
  });

  describe('getKeyboardLetterStatus', () => {
    it('should prioritize correct over present over absent', () => {
      const feedback: LetterFeedback[][] = [
        [
          { letter: 'A', status: 'absent' },
          { letter: 'B', status: 'present' },
          { letter: 'C', status: 'correct' },
          { letter: 'D', status: 'absent' },
          { letter: 'E', status: 'absent' }
        ],
        [
          { letter: 'A', status: 'present' },
          { letter: 'B', status: 'correct' },
          { letter: 'C', status: 'present' },
          { letter: 'F', status: 'absent' },
          { letter: 'G', status: 'present' }
        ]
      ];

      const result = getKeyboardLetterStatus(feedback);
      
      expect(result.get('a')).toBe('present'); // absent -> present
      expect(result.get('b')).toBe('correct'); // present -> correct
      expect(result.get('c')).toBe('correct'); // correct stays correct
      expect(result.get('d')).toBe('absent');
      expect(result.get('e')).toBe('absent');
      expect(result.get('f')).toBe('absent');
      expect(result.get('g')).toBe('present');
    });

    it('should handle empty feedback', () => {
      const result = getKeyboardLetterStatus([]);
      expect(result.size).toBe(0);
    });

    it('should handle case insensitivity', () => {
      const feedback: LetterFeedback[][] = [
        [
          { letter: 'A', status: 'correct' },
          { letter: 'b', status: 'present' },
          { letter: 'C', status: 'absent' },
          { letter: 'd', status: 'correct' },
          { letter: 'E', status: 'present' }
        ]
      ];

      const result = getKeyboardLetterStatus(feedback);
      
      expect(result.get('a')).toBe('correct');
      expect(result.get('b')).toBe('present');
      expect(result.get('c')).toBe('absent');
      expect(result.get('d')).toBe('correct');
      expect(result.get('e')).toBe('present');
    });
  });
});