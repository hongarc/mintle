import { getWordDocument, createWordDocument, FirestoreServiceError } from './firestoreService';
import { getDeterministicSolutionWord, loadDictionary } from './dictionary';
import { hourIdUtc } from './timeUtils';
import { encryptWord, decryptWord, generateWordHash } from './encryption';
import type { WordDocument, LetterFeedback } from '../types/game';


/**
 * Suggest a valid hint word based on current guesses and feedback
 * @param guesses - Array of guessed words
 * @param feedback - Array of feedback arrays for each guess
 * @returns A word that matches all known constraints, or null if none
 */
export async function suggestHintWord(
  guesses: string[],
  feedback: LetterFeedback[][]
): Promise<string | null> {

  // Assume solutions are lowercase words
  const solutions = Array.from((await loadDictionary()).solutions);

  // Build constraints
  const mustBe: (string | null)[] = [null, null, null, null, null];
  const mustInclude = new Set<string>();
  const mustNotInclude = new Set<string>();
  const cannotBe: Record<number, Set<string>> = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };

  for (let g = 0; g < feedback.length; g++) {
    for (let i = 0; i < feedback[g].length; i++) {
      const letter = feedback[g][i].letter.toLowerCase();
      const status = feedback[g][i].status;

      if (status === "correct") {
        mustBe[i] = letter;
      } else if (status === "present") {
        mustInclude.add(letter);
        cannotBe[i].add(letter);
      } else if (status === "absent") {
        // Only mark absent if not seen as correct/present elsewhere
        let foundElsewhere = false;
        for (let j = 0; j < feedback[g].length; j++) {
          if (j !== i && feedback[g][j].letter.toLowerCase() === letter && feedback[g][j].status !== "absent") {
            foundElsewhere = true;
            break;
          }
        }
        if (!foundElsewhere) {
          mustNotInclude.add(letter);
        } else {
          cannotBe[i].add(letter);
        }
      }
    }
  }

  // Filter candidate words
  const validWords = solutions.filter((word) => {
    // Must match known positions
    for (let i = 0; i < 5; i++) {
      if (mustBe[i] && word[i] !== mustBe[i]) return false;
      if (cannotBe[i].has(word[i])) return false;
    }
    // Must include all present letters
    for (const ch of mustInclude) {
      if (!word.includes(ch)) return false;
    }
    // Must exclude absent letters
    for (const ch of mustNotInclude) {
      if (word.includes(ch)) return false;
    }
    // Avoid repeating guesses
    if (guesses.includes(word)) return false;
    return true;
  });
  console.log("Hint candidates:", validWords.length);

  if (validWords.length === 0) return null;
  if (validWords.length === 1) return validWords[0];
  // Pick a random valid word
  return validWords[Math.floor(Math.random() * validWords.length)];
}


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