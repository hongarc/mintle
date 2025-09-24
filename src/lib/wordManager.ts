import { getWordDocument, createWordDocument, FirestoreServiceError } from './firestoreService';
import { getDeterministicSolutionWord, loadDictionary } from './dictionary';
import { hourIdUtc } from './timeUtils';
import { encryptWord, decryptWord, generateWordHash } from './encryption';
import type { WordDocument } from '../types/game';

/**
 * Get or create the hourly word for a given hour ID
 * Handles race conditions when multiple clients try to create the same word
 * @param hourId - Hour ID in YYYYMMDDHH format
 * @returns Promise resolving to the word for that hour
 */
export async function getOrCreateHourlyWord(hourId: string): Promise<string> {
  try {
    // First, try to get existing word
    const existingDoc = await getWordDocument(hourId);
    if (existingDoc) {
      // Decrypt the word from storage
      const decryptedWord = decryptWord(existingDoc.word, hourId);
      return decryptedWord.toUpperCase();
    }

    // Ensure dictionary is loaded
    await loadDictionary();

    // Generate word deterministically based on hour ID
    const word = getDeterministicSolutionWord(hourId);

    // Encrypt the word for storage
    const encryptedWord = encryptWord(word, hourId);
    const wordHash = generateWordHash(word, hourId);

    // Create word document with encrypted word
    const wordDoc: WordDocument = {
      word: encryptedWord,
      createdAt: new Date().toISOString(),
      source: 'client',
      dictionaryVersion: 'v1',
      hash: wordHash
    };

    try {
      const created = await createWordDocument(hourId, wordDoc);
      if (created) {
        return word;
      }
    } catch (error) {
      // If creation failed due to race condition, try to read the existing document
      if (error instanceof FirestoreServiceError && error.code === 'already-exists') {
        const existingDoc = await getWordDocument(hourId);
        if (existingDoc) {
          const decryptedWord = decryptWord(existingDoc.word, hourId);
          return decryptedWord.toUpperCase();
        }
      }
      throw error;
    }

    // If we reach here, creation failed but not due to already-exists
    // Try one more time to read in case someone else created it
    const finalDoc = await getWordDocument(hourId);
    if (finalDoc) {
      const decryptedWord = decryptWord(finalDoc.word, hourId);
      return decryptedWord.toUpperCase();
    }

    throw new Error(`Failed to get or create word for hour ${hourId}`);
  } catch (error) {
    console.error('Error in getOrCreateHourlyWord:', error);
    throw error;
  }
}

/**
 * Get the current hour's word
 * @returns Promise resolving to current hour's word
 */
export async function getCurrentHourWord(): Promise<string> {
  const currentHourId = hourIdUtc();
  return getOrCreateHourlyWord(currentHourId);
}

/**
 * Get word for a specific date/time
 * @param date - Date object
 * @returns Promise resolving to word for that hour
 */
export async function getWordForDate(date: Date): Promise<string> {
  const hourId = hourIdUtc(date);
  return getOrCreateHourlyWord(hourId);
}

/**
 * Pre-generate words for future hours (optional utility)
 * @param hoursAhead - Number of hours to pre-generate
 * @returns Promise resolving to array of generated hour IDs
 */
export async function preGenerateWords(hoursAhead: number = 24): Promise<string[]> {
  const generatedHours: string[] = [];
  const now = new Date();

  for (let i = 0; i < hoursAhead; i++) {
    const futureDate = new Date(now.getTime() + (i * 60 * 60 * 1000));
    const hourId = hourIdUtc(futureDate);
    
    try {
      await getOrCreateHourlyWord(hourId);
      generatedHours.push(hourId);
    } catch (error) {
      console.error(`Failed to pre-generate word for hour ${hourId}:`, error);
    }
  }

  return generatedHours;
}

/**
 * Validate that a word document is properly formatted
 * @param doc - Word document to validate
 * @returns True if valid, false otherwise
 */
export function validateWordDocument(doc: WordDocument): boolean {
  if (!doc.word || typeof doc.word !== 'string') return false;
  if (!doc.createdAt || typeof doc.createdAt !== 'string') return false;
  if (!doc.source || typeof doc.source !== 'string') return false;
  if (!doc.dictionaryVersion || typeof doc.dictionaryVersion !== 'string') return false;
  
  // For encrypted words, we can't validate the exact format, but we can check it's Base64-like
  // Base64 strings should only contain A-Z, a-z, 0-9, +, /, and = for padding
  if (!/^[A-Za-z0-9+/]+=*$/.test(doc.word)) return false;
  
  // Validate ISO date format
  try {
    const date = new Date(doc.createdAt);
    if (isNaN(date.getTime())) {
      return false;
    }
  } catch {
    return false;
  }
  
  // If hash is present, validate it's a string
  if (doc.hash !== undefined && typeof doc.hash !== 'string') return false;
  
  return true;
}