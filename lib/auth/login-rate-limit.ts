/**
 * Login rate limiting to prevent brute force attacks
 * Uses in-memory store (can be upgraded to Redis for production)
 */

interface RateLimitEntry {
  attempts: number
  firstAttemptAt: number
  lastAttemptAt: number
  blockedUntil?: number
}

// In-memory store for rate limiting
// Key format: "username:ip"
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  // Maximum attempts before blocking
  maxAttempts: 5,

  // Time window in milliseconds (15 minutes)
  windowMs: 15 * 60 * 1000,

  // Block duration in milliseconds (30 minutes)
  blockDurationMs: 30 * 60 * 1000,

  // Cleanup interval (remove old entries every hour)
  cleanupIntervalMs: 60 * 60 * 1000,
}

/**
 * Cleanup old rate limit entries
 */
function cleanupRateLimitStore() {
  const now = Date.now()
  const cutoff = now - RATE_LIMIT_CONFIG.windowMs

  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove if last attempt was outside the time window and not blocked
    if (entry.lastAttemptAt < cutoff && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup periodically
if (typeof global !== 'undefined') {
  setInterval(cleanupRateLimitStore, RATE_LIMIT_CONFIG.cleanupIntervalMs)
}

/**
 * Generate rate limit key
 * @param username - Username attempting login
 * @param ip - IP address of the request
 * @returns Rate limit key
 */
function getRateLimitKey(username: string, ip: string): string {
  return `${username.toLowerCase()}:${ip}`
}

/**
 * Check if login attempt is rate limited
 * @param username - Username attempting login
 * @param ip - IP address of the request
 * @returns Object with isBlocked boolean and remainingTime if blocked
 */
export function checkRateLimit(
  username: string,
  ip: string
): { isBlocked: boolean; remainingTime?: number; attemptsRemaining?: number } {
  const key = getRateLimitKey(username, ip)
  const entry = rateLimitStore.get(key)
  const now = Date.now()

  // No previous attempts
  if (!entry) {
    return { isBlocked: false, attemptsRemaining: RATE_LIMIT_CONFIG.maxAttempts }
  }

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000 / 60) // minutes
    return { isBlocked: true, remainingTime }
  }

  // Check if time window has expired
  if (now - entry.firstAttemptAt > RATE_LIMIT_CONFIG.windowMs) {
    // Window expired, reset
    rateLimitStore.delete(key)
    return { isBlocked: false, attemptsRemaining: RATE_LIMIT_CONFIG.maxAttempts }
  }

  // Check if max attempts reached
  if (entry.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
    // Block the user
    entry.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs
    rateLimitStore.set(key, entry)

    const remainingTime = Math.ceil(RATE_LIMIT_CONFIG.blockDurationMs / 1000 / 60) // minutes
    return { isBlocked: true, remainingTime }
  }

  // Not blocked yet
  const attemptsRemaining = RATE_LIMIT_CONFIG.maxAttempts - entry.attempts
  return { isBlocked: false, attemptsRemaining }
}

/**
 * Record a failed login attempt
 * @param username - Username that failed login
 * @param ip - IP address of the request
 */
export function recordFailedAttempt(username: string, ip: string): void {
  const key = getRateLimitKey(username, ip)
  const entry = rateLimitStore.get(key)
  const now = Date.now()

  if (!entry) {
    // First attempt
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    })
  } else {
    // Additional attempt
    entry.attempts++
    entry.lastAttemptAt = now
    rateLimitStore.set(key, entry)
  }
}

/**
 * Clear rate limit for a user (after successful login)
 * @param username - Username that successfully logged in
 * @param ip - IP address of the request
 */
export function clearRateLimit(username: string, ip: string): void {
  const key = getRateLimitKey(username, ip)
  rateLimitStore.delete(key)
}

/**
 * Get remaining attempts for a user
 * @param username - Username to check
 * @param ip - IP address of the request
 * @returns Number of remaining attempts
 */
export function getRemainingAttempts(username: string, ip: string): number {
  const key = getRateLimitKey(username, ip)
  const entry = rateLimitStore.get(key)

  if (!entry) {
    return RATE_LIMIT_CONFIG.maxAttempts
  }

  const now = Date.now()

  // If blocked, return 0
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return 0
  }

  // If window expired, reset
  if (now - entry.firstAttemptAt > RATE_LIMIT_CONFIG.windowMs) {
    return RATE_LIMIT_CONFIG.maxAttempts
  }

  return Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - entry.attempts)
}
