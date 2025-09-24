/**
 * Simple encryption utilities for protecting words in Firebase
 * Uses a combination of Caesar cipher and Base64 encoding with hour-based key
 */

/**
 * Generate an encryption key based on hour ID
 * @param hourId - Hour ID in YYYYMMDDHH format
 * @returns Encryption key (0-25)
 */
function generateEncryptionKey(hourId: string): number {
  // Use the hour ID to generate a consistent key for that hour
  let sum = 0;
  for (let i = 0; i < hourId.length; i++) {
    sum += hourId.charCodeAt(i);
  }
  return sum % 26;
}

/**
 * Caesar cipher encryption
 * @param text - Text to encrypt
 * @param shift - Shift amount (0-25)
 * @returns Encrypted text
 */
function caesarCipher(text: string, shift: number): string {
  return text
    .split('')
    .map(char => {
      if (char >= 'a' && char <= 'z') {
        return String.fromCharCode(((char.charCodeAt(0) - 97 + shift) % 26) + 97);
      }
      if (char >= 'A' && char <= 'Z') {
        return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
      }
      return char;
    })
    .join('');
}

/**
 * Caesar cipher decryption
 * @param text - Text to decrypt
 * @param shift - Shift amount (0-25)
 * @returns Decrypted text
 */
function caesarDecipher(text: string, shift: number): string {
  return caesarCipher(text, 26 - shift);
}

/**
 * Encrypt a word for storage in Firebase
 * @param word - Plain text word
 * @param hourId - Hour ID for key generation
 * @returns Encrypted word
 */
export function encryptWord(word: string, hourId: string): string {
  const key = generateEncryptionKey(hourId);
  const encrypted = caesarCipher(word.toLowerCase(), key);
  
  // Add Base64 encoding for additional obfuscation
  return btoa(encrypted);
}

/**
 * Decrypt a word from Firebase storage
 * @param encryptedWord - Encrypted word from Firebase
 * @param hourId - Hour ID for key generation
 * @returns Decrypted plain text word
 */
export function decryptWord(encryptedWord: string, hourId: string): string {
  try {
    // Decode from Base64
    const decoded = atob(encryptedWord);
    
    // Decrypt using Caesar cipher
    const key = generateEncryptionKey(hourId);
    return caesarDecipher(decoded, key);
  } catch (error) {
    throw new Error(`Failed to decrypt word: ${error}`);
  }
}

/**
 * Generate a hash of the word for verification without revealing the word
 * @param word - Plain text word
 * @param hourId - Hour ID for salt
 * @returns Hash string
 */
export function generateWordHash(word: string, hourId: string): string {
  // Simple hash function for verification
  let hash = 0;
  const input = word.toLowerCase() + hourId;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Verify a word against its hash without decrypting
 * @param word - Plain text word to verify
 * @param hash - Stored hash
 * @param hourId - Hour ID for salt
 * @returns True if word matches hash
 */
export function verifyWordHash(word: string, hash: string, hourId: string): boolean {
  return generateWordHash(word, hourId) === hash;
}