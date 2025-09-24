import { getWordDocument, createWordDocument, FirestoreServiceError } from './firestoreService';
import { getDeterministicSolutionWord, loadDictionary } from './dictionary';
import { hourIdUtc } from './timeUtils';
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
      return existingDoc.word.toUpperCase();
    }

    // Ensure dictionary is loaded
    await loadDictionary();

    // Generate word deterministically based on hour ID
    const word = getDeterministicSolutionWord(hourId);

    // Create word document
    const wordDoc: WordDocument = {
      word: word.toLowerCase(),
      createdAt: new Date().toISOString(),
      source: 'client',
      dictionaryVersion: 'v1'
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
          return existingDoc.word.toUpperCase();
        }
      }
      throw error;
    }

    // If we reach here, creation failed but not due to already-exists
    // Try one more time to read in case someone else created it
    const finalDoc = await getWordDocument(hourId);
    if (finalDoc) {
      return finalDoc.word.toUpperCase();
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
  if (doc.word.length !== 5) return false;
  if (!doc.createdAt || typeof doc.createdAt !== 'string') return false;
  if (!doc.source || typeof doc.source !== 'string') return false;
  if (!doc.dictionaryVersion || typeof doc.dictionaryVersion !== 'string') return false;
  
  // Validate word contains only letters
  if (!/^[a-zA-Z]{5}$/.test(doc.word)) return false;
  
  // Validate ISO date format
  try {
    const date = new Date(doc.createdAt);
    if (isNaN(date.getTime())) {
      return false;
    }
  } catch {
    return false;
  }
  
  return true;
}