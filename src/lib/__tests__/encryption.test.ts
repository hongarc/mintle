import { describe, it, expect } from 'vitest';
import { 
  encryptWord, 
  decryptWord, 
  generateWordHash, 
  verifyWordHash 
} from '../encryption';

describe('Encryption', () => {
  const testWord = 'HELLO';
  const testHourId = '2025092415';

  describe('encryptWord and decryptWord', () => {
    it('should encrypt and decrypt a word correctly', () => {
      const encrypted = encryptWord(testWord, testHourId);
      const decrypted = decryptWord(encrypted, testHourId);
      
      expect(decrypted.toLowerCase()).toBe(testWord.toLowerCase());
    });

    it('should produce different encrypted values for different hour IDs', () => {
      const encrypted1 = encryptWord(testWord, '2025092415');
      const encrypted2 = encryptWord(testWord, '2025092416');
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce the same encrypted value for the same inputs', () => {
      const encrypted1 = encryptWord(testWord, testHourId);
      const encrypted2 = encryptWord(testWord, testHourId);
      
      expect(encrypted1).toBe(encrypted2);
    });

    it('should handle lowercase input correctly', () => {
      const encrypted = encryptWord('hello', testHourId);
      const decrypted = decryptWord(encrypted, testHourId);
      
      expect(decrypted).toBe('hello');
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => {
        decryptWord('invalid-base64!', testHourId);
      }).toThrow();
    });
  });

  describe('generateWordHash and verifyWordHash', () => {
    it('should generate consistent hash for same inputs', () => {
      const hash1 = generateWordHash(testWord, testHourId);
      const hash2 = generateWordHash(testWord, testHourId);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different words', () => {
      const hash1 = generateWordHash('HELLO', testHourId);
      const hash2 = generateWordHash('WORLD', testHourId);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different hour IDs', () => {
      const hash1 = generateWordHash(testWord, '2025092415');
      const hash2 = generateWordHash(testWord, '2025092416');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct word against hash', () => {
      const hash = generateWordHash(testWord, testHourId);
      const isValid = verifyWordHash(testWord, hash, testHourId);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect word against hash', () => {
      const hash = generateWordHash('HELLO', testHourId);
      const isValid = verifyWordHash('WORLD', hash, testHourId);
      
      expect(isValid).toBe(false);
    });

    it('should be case insensitive for verification', () => {
      const hash = generateWordHash('HELLO', testHourId);
      const isValid = verifyWordHash('hello', hash, testHourId);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Security properties', () => {
    it('should not reveal the original word in encrypted form', () => {
      const word = 'SECRET';
      const encrypted = encryptWord(word, testHourId);
      
      // Encrypted word should not contain the original word
      expect(encrypted.toLowerCase()).not.toContain(word.toLowerCase());
    });

    it('should produce non-obvious encrypted values', () => {
      const words = ['APPLE', 'BREAD', 'CHAIR', 'DANCE', 'EAGLE'];
      const encrypted = words.map(word => encryptWord(word, testHourId));
      
      // None of the encrypted values should be obviously related to original
      encrypted.forEach((enc, i) => {
        expect(enc.toLowerCase()).not.toContain(words[i].toLowerCase());
      });
    });

    it('should handle all 5-letter words correctly', () => {
      const testWords = ['ABCDE', 'ZZZZZ', 'MIXED', 'LOWER', 'UPPER'];
      
      testWords.forEach(word => {
        const encrypted = encryptWord(word, testHourId);
        const decrypted = decryptWord(encrypted, testHourId);
        
        expect(decrypted.toUpperCase()).toBe(word.toUpperCase());
      });
    });
  });
});