import type { Dictionary } from '../types/game';
import wordsData from './words.json';

// Extract words from JSON file and convert to uppercase
const ALL_WORDS = wordsData.words.map((word: string) => word.toUpperCase());

// Use first 2000 words as solutions (most common words)
const SOLUTION_WORDS = ALL_WORDS.slice(0, 2000);

// Use all words as allowed guesses
const ALLOWED_WORDS = ALL_WORDS;

let dictionaryInstance: Dictionary | null = null;

/**
 * Load and initialize the dictionary
 * @returns Promise resolving to Dictionary instance
 */
export async function loadDictionary(): Promise<Dictionary> {
  if (dictionaryInstance) {
    return dictionaryInstance;
  }

  // Create sets for fast lookup
  const solutions = new Set(SOLUTION_WORDS.map(word => word.toLowerCase()));
  const allowed = new Set(ALLOWED_WORDS.map(word => word.toLowerCase()));

  // Generate a simple hash for integrity checking
  const hash = await generateDictionaryHash(ALLOWED_WORDS);

  dictionaryInstance = {
    solutions,
    allowed,
    version: 'v1',
    hash
  };

  return dictionaryInstance;
}

/**
 * Check if a word is valid for guessing
 * @param word - Word to validate
 * @returns True if word is in allowed list
 */
export function isValidGuess(word: string): boolean {
  if (!dictionaryInstance) {
    throw new Error('Dictionary not loaded. Call loadDictionary() first.');
  }
  
  return dictionaryInstance.allowed.has(word.toLowerCase());
}

/**
 * Check if a word is a valid solution word
 * @param word - Word to check
 * @returns True if word is in solutions list
 */
export function isValidSolution(word: string): boolean {
  if (!dictionaryInstance) {
    throw new Error('Dictionary not loaded. Call loadDictionary() first.');
  }
  
  return dictionaryInstance.solutions.has(word.toLowerCase());
}

/**
 * Get a random solution word
 * @returns Random word from solutions list
 */
export function getRandomSolutionWord(): string {
  if (!dictionaryInstance) {
    throw new Error('Dictionary not loaded. Call loadDictionary() first.');
  }
  
  const solutionsArray = Array.from(dictionaryInstance.solutions);
  const randomIndex = Math.floor(Math.random() * solutionsArray.length);
  return solutionsArray[randomIndex].toUpperCase();
}

/**
 * Get a deterministic solution word based on seed
 * @param seed - Seed for deterministic selection
 * @returns Word selected based on seed
 */
export function getDeterministicSolutionWord(seed: string): string {
  if (!dictionaryInstance) {
    throw new Error('Dictionary not loaded. Call loadDictionary() first.');
  }
  
  const solutionsArray = Array.from(dictionaryInstance.solutions);
  const hash = simpleStringHash(seed);
  const index = Math.abs(hash) % solutionsArray.length;
  return solutionsArray[index].toUpperCase();
}

/**
 * Generate a simple hash for dictionary integrity
 * @param words - Array of words to hash
 * @returns Promise resolving to hash string
 */
async function generateDictionaryHash(words: string[]): Promise<string> {
  const concatenated = words.sort().join('');
  const encoder = new TextEncoder();
  const data = encoder.encode(concatenated);
  
  if (crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for environments without crypto.subtle
    return simpleStringHash(concatenated).toString(16);
  }
}

/**
 * Simple string hash function for fallback
 * @param str - String to hash
 * @returns Hash number
 */
function simpleStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}