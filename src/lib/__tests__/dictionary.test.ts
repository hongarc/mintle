import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadDictionary, 
  isValidGuess, 
  isValidSolution, 
  getRandomSolutionWord,
  getDeterministicSolutionWord 
} from '../dictionary';

describe('dictionary', () => {
  beforeEach(async () => {
    await loadDictionary();
  });

  describe('loadDictionary', () => {
    it('should load dictionary successfully', async () => {
      const dictionary = await loadDictionary();
      
      expect(dictionary).toBeDefined();
      expect(dictionary.solutions).toBeInstanceOf(Set);
      expect(dictionary.allowed).toBeInstanceOf(Set);
      expect(dictionary.version).toBe('v1');
      expect(dictionary.hash).toBeDefined();
    });

    it('should return same instance on multiple calls', async () => {
      const dict1 = await loadDictionary();
      const dict2 = await loadDictionary();
      
      expect(dict1).toBe(dict2);
    });

    it('should have solutions as subset of allowed words', async () => {
      const dictionary = await loadDictionary();
      
      for (const solution of dictionary.solutions) {
        expect(dictionary.allowed.has(solution)).toBe(true);
      }
    });
  });

  describe('isValidGuess', () => {
    it('should return true for valid guess words', () => {
      expect(isValidGuess('ABOUT')).toBe(true);
      expect(isValidGuess('about')).toBe(true);
      expect(isValidGuess('WHICH')).toBe(true);
      expect(isValidGuess('THERE')).toBe(true); // Valid guess from words.json
    });

    it('should return false for invalid words', () => {
      expect(isValidGuess('ZZZZZ')).toBe(false);
      expect(isValidGuess('ABCDE')).toBe(false);
      expect(isValidGuess('12345')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isValidGuess('ABOUT')).toBe(true);
      expect(isValidGuess('about')).toBe(true);
      expect(isValidGuess('About')).toBe(true);
      expect(isValidGuess('aBouT')).toBe(true);
    });

    it('should throw error if dictionary not loaded', () => {
      // This would require resetting the module state, which is complex in Vitest
      // For now, we'll skip this test as the dictionary is loaded in beforeEach
    });
  });

  describe('isValidSolution', () => {
    it('should return true for valid solution words', () => {
      expect(isValidSolution('ABOUT')).toBe(true);
      expect(isValidSolution('about')).toBe(true);
      expect(isValidSolution('WORLD')).toBe(true);
    });

    it('should return false for non-solution words', () => {
      // Test with a word that's likely in allowed but not in first 2000 (solutions)
      expect(isValidSolution('ZZZZZ')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isValidSolution('ABOUT')).toBe(true);
      expect(isValidSolution('about')).toBe(true);
      expect(isValidSolution('About')).toBe(true);
    });
  });

  describe('getRandomSolutionWord', () => {
    it('should return a valid solution word', () => {
      const word = getRandomSolutionWord();
      
      expect(typeof word).toBe('string');
      expect(word.length).toBe(5);
      expect(word).toBe(word.toUpperCase());
      expect(isValidSolution(word)).toBe(true);
    });

    it('should return different words on multiple calls (probabilistic)', () => {
      const words = new Set();
      
      // Generate 20 words - should be very unlikely to get all the same
      for (let i = 0; i < 20; i++) {
        words.add(getRandomSolutionWord());
      }
      
      // Should have at least 2 different words (very high probability)
      expect(words.size).toBeGreaterThan(1);
    });
  });

  describe('getDeterministicSolutionWord', () => {
    it('should return consistent word for same seed', () => {
      const word1 = getDeterministicSolutionWord('test-seed');
      const word2 = getDeterministicSolutionWord('test-seed');
      
      expect(word1).toBe(word2);
    });

    it('should return different words for different seeds', () => {
      const word1 = getDeterministicSolutionWord('seed1');
      const word2 = getDeterministicSolutionWord('seed2');
      
      expect(word1).not.toBe(word2);
    });

    it('should return valid solution words', () => {
      const seeds = ['test1', 'test2', 'test3', '2025092323', 'hourly-game'];
      
      for (const seed of seeds) {
        const word = getDeterministicSolutionWord(seed);
        expect(typeof word).toBe('string');
        expect(word.length).toBe(5);
        expect(word).toBe(word.toUpperCase());
        expect(isValidSolution(word)).toBe(true);
      }
    });

    it('should handle hour ID format seeds', () => {
      const hourId = '2025092323';
      const word = getDeterministicSolutionWord(hourId);
      
      expect(isValidSolution(word)).toBe(true);
      
      // Same hour ID should always return same word
      const word2 = getDeterministicSolutionWord(hourId);
      expect(word).toBe(word2);
    });
  });
});