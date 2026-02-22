import crypto from 'crypto';
import { env } from '../../config/env.js';

// ============================================
// ENCRYPTION UTILITIES
// ============================================
// Provides functions to encrypt, decrypt, and mask sensitive data
// Uses AES-256-CBC encryption algorithm for security
// Primary use case: Encrypting Aadhar numbers in database

// ============================================
// ENCRYPTION ALGORITHM CONFIGURATION
// ============================================
const ALGORITHM = 'aes-256-cbc'; // Advanced Encryption Standard with 256-bit key
// Ensure the key is exactly 32 bytes by padding or truncating
const rawKey = env.ENCRYPTION_KEY || 'your-32-character-secret-key!!';
const ENCRYPTION_KEY = Buffer.from(rawKey.padEnd(32, '0').slice(0, 32), 'utf8');
const IV_LENGTH = 16; // Initialization Vector length (16 bytes for AES)

// ============================================
// ENCRYPT FUNCTION
// ============================================
// Encrypts plain text data using AES-256-CBC
// Returns: encrypted_data:initialization_vector (format: "abc123:def456")
// 
// How it works:
// 1. Generate random IV (Initialization Vector) for each encryption
// 2. Create cipher with algorithm, key, and IV
// 3. Encrypt the text
// 4. Return encrypted data + IV (IV needed for decryption)
//
// Example:
// Input: "123456789012"
// Output: "a1b2c3d4e5f6:1a2b3c4d5e6f7g8h"
export const encrypt = (text) => {
    // Step 1: Generate random 16-byte IV for this encryption
    // IV ensures same text encrypts to different values each time
    const iv = crypto.randomBytes(IV_LENGTH);

    // Step 2: Create cipher object with our algorithm, key, and IV
    const cipher = crypto.createCipheriv(
        ALGORITHM,                                    // Algorithm: AES-256-CBC
        ENCRYPTION_KEY,                               // Key: 32-byte encryption key
        iv                                            // IV: Random initialization vector
    );

    // Step 3: Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex'); // Convert text to encrypted hex
    encrypted += cipher.final('hex');                    // Finalize encryption

    // Step 4: Return encrypted data with IV (separated by colon)
    // Format: "encrypted_data:iv"
    // We need IV later for decryption
    return `${encrypted}:${iv.toString('hex')}`;
};
// ============================================
// DECRYPT FUNCTION
// ============================================
// Decrypts encrypted data back to original text
// Input format: "encrypted_data:initialization_vector"
// Returns: Original plain text
//
// How it works:
// 1. Split encrypted string to get data and IV
// 2. Create decipher with algorithm, key, and IV
// 3. Decrypt the data
// 4. Return original text
//
// Example:
// Input: "a1b2c3d4e5f6:1a2b3c4d5e6f7g8h"
// Output: "123456789012"
export const decrypt = (encryptedText) => {
    // Step 1: Split the encrypted string to extract data and IV
    // Format is "encrypted_data:iv"
    const parts = encryptedText.split(':');
    const encrypted = parts[0];  // The encrypted data
    const iv = Buffer.from(parts[1], 'hex'); // The IV used during encryption

    // Step 2: Create decipher object with same algorithm, key, and IV
    const decipher = crypto.createDecipheriv(
        ALGORITHM,                                    // Same algorithm used for encryption
        ENCRYPTION_KEY,                               // Same key used for encryption
        iv                                            // Same IV used for encryption
    );

    // Step 3: Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8'); // Convert hex back to text
    decrypted += decipher.final('utf8');                        // Finalize decryption

    // Step 4: Return original plain text
    return decrypted;
};

// ============================================
// MASK AADHAR FUNCTION
// ============================================
// Masks Aadhar number for display purposes
// Shows only last 4 digits, rest are X
// Format: XXXX XXXX 1234
//
// How it works:
// 1. Get last 4 digits of Aadhar
// 2. Replace first 8 digits with X
// 3. Add spaces for readability
//
// Example:
// Input: "123456789012"
// Output: "XXXX XXXX 9012"
export const maskAadhar = (aadharNumber) => {
    // Step 1: Validate input
    if (!aadharNumber || aadharNumber.length !== 12) {
        return 'XXXX XXXX XXXX'; // Return fully masked if invalid
    }

    // Step 2: Get last 4 digits
    const lastFour = aadharNumber.slice(-4);

    // Step 3: Create masked format with spaces
    // Format: "XXXX XXXX [last4digits]"
    return `XXXX XXXX ${lastFour}`;
};
