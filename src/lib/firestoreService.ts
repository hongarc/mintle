import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc,
  FirestoreError 
} from 'firebase/firestore';
import { db } from './firebase';
import type { WordDocument, GameProgress } from '../types/game';

/**
 * Custom error class for Firestore operations
 */
export class FirestoreServiceError extends Error {
  public code: string;
  public originalError?: Error;
  
  constructor(
    message: string,
    code: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'FirestoreServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Retry configuration for Firestore operations
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
};

/**
 * Execute a function with exponential backoff retry logic
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to function result
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain error types
      if (error instanceof FirestoreError) {
        if (error.code === 'permission-denied' || 
            error.code === 'unauthenticated' ||
            error.code === 'already-exists') {
          throw new FirestoreServiceError(
            `Firestore operation failed: ${error.message}`,
            error.code,
            error
          );
        }
      }
      
      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt),
        config.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw new FirestoreServiceError(
    `Operation failed after ${config.maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
    'max-retries-exceeded',
    lastError
  );
}

/**
 * Get a word document by hour ID
 * @param hourId - Hour ID in YYYYMMDDHH format
 * @returns Promise resolving to word document or null if not found
 */
export async function getWordDocument(hourId: string): Promise<WordDocument | null> {
  return withRetry(async () => {
    try {
      const docRef = doc(db, 'words', hourId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          word: data.word,
          createdAt: data.createdAt,
          source: data.source,
          dictionaryVersion: data.dictionaryVersion,
          hash: data.hash
        } as WordDocument;
      }
      
      return null;
    } catch (error) {
      if (error instanceof FirestoreError) {
        throw error;
      }
      throw new FirestoreServiceError(
        `Failed to get word document: ${error}`,
        'get-document-failed',
        error as Error
      );
    }
  });
}

/**
 * Create a new word document
 * @param hourId - Hour ID in YYYYMMDDHH format
 * @param wordDoc - Word document data
 * @returns Promise resolving to success boolean
 */
export async function createWordDocument(
  hourId: string, 
  wordDoc: WordDocument
): Promise<boolean> {
  return withRetry(async () => {
    try {
      const docRef = doc(db, 'words', hourId);
      
      // Use setDoc with merge: false to ensure we only create, not update
      await setDoc(docRef, wordDoc, { merge: false });
      return true;
    } catch (error) {
      if (error instanceof FirestoreError) {
        if (error.code === 'already-exists') {
          // Document already exists, this is expected in race conditions
          return false;
        }
        throw error;
      }
      throw new FirestoreServiceError(
        `Failed to create word document: ${error}`,
        'create-document-failed',
        error as Error
      );
    }
  });
}

/**
 * Check if a word document exists
 * @param hourId - Hour ID in YYYYMMDDHH format
 * @returns Promise resolving to boolean indicating existence
 */
export async function wordDocumentExists(hourId: string): Promise<boolean> {
  return withRetry(async () => {
    try {
      const docRef = doc(db, 'words', hourId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      if (error instanceof FirestoreError) {
        throw error;
      }
      throw new FirestoreServiceError(
        `Failed to check document existence: ${error}`,
        'check-existence-failed',
        error as Error
      );
    }
  });
}

/**
 * Save game progress (optional analytics)
 * @param gameProgress - Game progress data
 * @returns Promise resolving to document ID
 */
export async function saveGameProgress(gameProgress: GameProgress): Promise<string> {
  return withRetry(async () => {
    try {
      const collectionRef = collection(db, 'guesses');
      const docRef = await addDoc(collectionRef, {
        ...gameProgress,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      if (error instanceof FirestoreError) {
        throw error;
      }
      throw new FirestoreServiceError(
        `Failed to save game progress: ${error}`,
        'save-progress-failed',
        error as Error
      );
    }
  });
}

/**
 * Test Firestore connection
 * @returns Promise resolving to boolean indicating connection success
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Try to read a non-existent document to test connection
    const testDocRef = doc(db, 'test', 'connection');
    await getDoc(testDocRef);
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
}

/**
 * Get Firestore error message in user-friendly format
 * @param error - Firestore error
 * @returns User-friendly error message
 */
export function getFirestoreErrorMessage(error: FirestoreError): string {
  switch (error.code) {
    case 'permission-denied':
      return 'Access denied. Please check your permissions.';
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again.';
    case 'deadline-exceeded':
      return 'Request timed out. Please try again.';
    case 'resource-exhausted':
      return 'Service is busy. Please try again later.';
    case 'unauthenticated':
      return 'Authentication required.';
    case 'not-found':
      return 'Requested data not found.';
    case 'already-exists':
      return 'Data already exists.';
    case 'failed-precondition':
      return 'Operation not allowed in current state.';
    case 'aborted':
      return 'Operation was aborted. Please try again.';
    case 'out-of-range':
      return 'Invalid request parameters.';
    case 'unimplemented':
      return 'Feature not implemented.';
    case 'internal':
      return 'Internal server error. Please try again.';
    case 'data-loss':
      return 'Data corruption detected.';
    default:
      return `An error occurred: ${error.message}`;
  }
}