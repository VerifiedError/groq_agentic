/**
 * Password hashing and verification utilities
 * Uses bcrypt for secure password storage
 */

import bcrypt from 'bcrypt'

/**
 * Number of salt rounds for bcrypt hashing
 * Higher = more secure but slower
 * 12 rounds provides good security/performance balance
 */
const BCRYPT_ROUNDS = 12

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty')
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Verify a plain text password against a bcrypt hash
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false
  }

  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  error?: string
} {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' }
  }

  // Optional: Add more strength requirements
  // Uncomment to enforce complexity:
  // if (!/[A-Z]/.test(password)) {
  //   return { isValid: false, error: 'Password must contain uppercase letter' }
  // }
  // if (!/[a-z]/.test(password)) {
  //   return { isValid: false, error: 'Password must contain lowercase letter' }
  // }
  // if (!/[0-9]/.test(password)) {
  //   return { isValid: false, error: 'Password must contain a number' }
  // }

  return { isValid: true }
}

/**
 * Common weak passwords to prevent
 */
const COMMON_PASSWORDS = [
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'password123',
  'admin',
  'letmein',
]

/**
 * Check if password is in common password list
 * @param password - Password to check
 * @returns True if password is common/weak
 */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase())
}
