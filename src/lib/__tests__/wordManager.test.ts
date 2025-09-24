import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateHourlyWord, getCurrentHourWord, getWordForDate, validateWordDocument } from '../wordManager';
import type { WordDocument } from '../../types/game';

// Mock the dependencies
vi.mock('../firestoreService', () => ({
  getWordDocument: vi.fn(),
  createWordDocument: vi.fn(),
  FirestoreServiceError: class extends Error {
    public code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  }
}));

vi.mock('../dictionary', () => ({
  getDeterministicSolutionWord: vi.fn(),
  loadDictionary: vi.fn()
}));

vi.mock('../timeUtils', () => ({
  hourIdUtc: vi.fn()
}));

import { getWordDocument, createWordDocument, FirestoreServiceError } from '../firestoreService';
import { getDeterministicSolutionWord, loadDictionary } from '../dictionary';
import { hourIdUtc } from '../timeUtils';

describe('wordManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateHourlyWord', () => {
    it('should return existing word if document exists', async () => {
      const mockDoc: WordDocument = {
        word: 'hello',
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client',
        dictionaryVersion: 'v1'
      };

      vi.mocked(getWordDocument).mockResolvedValue(mockDoc);

      const result = await getOrCreateHourlyWord('2025092323');
      
      expect(result).toBe('HELLO');
      expect(getWordDocument).toHaveBeenCalledWith('2025092323');
      expect(createWordDocument).not.toHaveBeenCalled();
    });

    it('should create new word if document does not exist', async () => {
      vi.mocked(getWordDocument).mockResolvedValueOnce(null);
      vi.mocked(loadDictionary).mockResolvedValue({} as any);
      vi.mocked(getDeterministicSolutionWord).mockReturnValue('WORLD');
      vi.mocked(createWordDocument).mockResolvedValue(true);

      const result = await getOrCreateHourlyWord('2025092323');
      
      expect(result).toBe('WORLD');
      expect(loadDictionary).toHaveBeenCalled();
      expect(getDeterministicSolutionWord).toHaveBeenCalledWith('2025092323');
      expect(createWordDocument).toHaveBeenCalledWith('2025092323', {
        word: 'world',
        createdAt: expect.any(String),
        source: 'client',
        dictionaryVersion: 'v1'
      });
    });

    it('should handle race condition when document already exists', async () => {
      const existingDoc: WordDocument = {
        word: 'peace',
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client',
        dictionaryVersion: 'v1'
      };

      vi.mocked(getWordDocument)
        .mockResolvedValueOnce(null) // First check - doesn't exist
        .mockResolvedValueOnce(existingDoc); // After failed create - exists

      vi.mocked(loadDictionary).mockResolvedValue({} as any);
      vi.mocked(getDeterministicSolutionWord).mockReturnValue('WORLD');
      vi.mocked(createWordDocument).mockRejectedValue(
        new FirestoreServiceError('Document already exists', 'already-exists')
      );

      const result = await getOrCreateHourlyWord('2025092323');
      
      expect(result).toBe('PEACE');
      expect(getWordDocument).toHaveBeenCalledTimes(2);
    });

    it('should throw error if creation fails for non-race-condition reasons', async () => {
      vi.mocked(getWordDocument).mockResolvedValue(null);
      vi.mocked(loadDictionary).mockResolvedValue({} as any);
      vi.mocked(getDeterministicSolutionWord).mockReturnValue('WORLD');
      vi.mocked(createWordDocument).mockRejectedValue(
        new FirestoreServiceError('Permission denied', 'permission-denied')
      );

      await expect(getOrCreateHourlyWord('2025092323')).rejects.toThrow('Permission denied');
    });

    it('should handle creation failure with fallback read', async () => {
      const fallbackDoc: WordDocument = {
        word: 'found',
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client',
        dictionaryVersion: 'v1'
      };

      vi.mocked(getWordDocument)
        .mockResolvedValueOnce(null) // Initial check
        .mockResolvedValueOnce(fallbackDoc); // Fallback read

      vi.mocked(loadDictionary).mockResolvedValue({} as any);
      vi.mocked(getDeterministicSolutionWord).mockReturnValue('WORLD');
      vi.mocked(createWordDocument).mockResolvedValue(false); // Creation failed

      const result = await getOrCreateHourlyWord('2025092323');
      
      expect(result).toBe('FOUND');
    });
  });

  describe('getCurrentHourWord', () => {
    it('should get word for current hour', async () => {
      vi.mocked(hourIdUtc).mockReturnValue('2025092323');
      vi.mocked(getWordDocument).mockResolvedValue({
        word: 'current',
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client',
        dictionaryVersion: 'v1'
      });

      const result = await getCurrentHourWord();
      
      expect(result).toBe('CURRENT');
      expect(hourIdUtc).toHaveBeenCalledWith();
    });
  });

  describe('getWordForDate', () => {
    it('should get word for specific date', async () => {
      const testDate = new Date('2025-09-23T23:30:00Z');
      
      vi.mocked(hourIdUtc).mockReturnValue('2025092323');
      vi.mocked(getWordDocument).mockResolvedValue({
        word: 'dated',
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client',
        dictionaryVersion: 'v1'
      });

      const result = await getWordForDate(testDate);
      
      expect(result).toBe('DATED');
      expect(hourIdUtc).toHaveBeenCalledWith(testDate);
    });
  });

  describe('validateWordDocument', () => {
    it('should validate correct word document', () => {
      const validDoc: WordDocument = {
        word: 'hello',
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client',
        dictionaryVersion: 'v1'
      };

      expect(validateWordDocument(validDoc)).toBe(true);
    });

    it('should reject document with invalid word length', () => {
      const invalidDoc: WordDocument = {
        word: 'hi',
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client',
        dictionaryVersion: 'v1'
      };

      expect(validateWordDocument(invalidDoc)).toBe(false);
    });

    it('should reject document with non-alphabetic characters', () => {
      const invalidDoc: WordDocument = {
        word: 'hel1o',
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client',
        dictionaryVersion: 'v1'
      };

      expect(validateWordDocument(invalidDoc)).toBe(false);
    });

    it('should reject document with missing fields', () => {
      const invalidDoc = {
        word: 'hello',
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client'
        // missing dictionaryVersion
      } as WordDocument;

      expect(validateWordDocument(invalidDoc)).toBe(false);
    });

    it('should reject document with invalid date', () => {
      const invalidDoc: WordDocument = {
        word: 'hello',
        createdAt: 'invalid-date',
        source: 'client',
        dictionaryVersion: 'v1'
      };

      expect(validateWordDocument(invalidDoc)).toBe(false);
    });

    it('should reject document with wrong data types', () => {
      const invalidDoc = {
        word: 123,
        createdAt: '2025-09-23T23:00:00Z',
        source: 'client',
        dictionaryVersion: 'v1'
      } as any;

      expect(validateWordDocument(invalidDoc)).toBe(false);
    });
  });
});