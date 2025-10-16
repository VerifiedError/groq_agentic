import { NextResponse } from 'next/server'

/**
 * Rate Limiter using Token Bucket Algorithm
 *
 * Features:
 * - In-memory storage (use Redis for production)
 * - Configurable rate limits per endpoint
 * - IP-based and user-based rate limiting
 * - Automatic cleanup of expired entries
 */

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production for distributed rate limiting)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

/**
 * Rate limit middleware
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null if allowed
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60000, uniqueTokenPerInterval: 10 }
): Promise<NextResponse | null> {
  const now = Date.now()
  const key = `rate_limit:${identifier}`

  const entry = rateLimitStore.get(key)

  if (!entry) {
    // First request from this identifier
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.interval
    })
    return null
  }

  if (now > entry.resetTime) {
    // Reset window has passed
    entry.count = 1
    entry.resetTime = now + config.interval
    return null
  }

  if (entry.count >= config.uniqueTokenPerInterval) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.uniqueTokenPerInterval.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString()
        }
      }
    )
  }

  // Increment counter
  entry.count++

  return null
}

/**
 * Get rate limit identifier from request
 * Uses user ID if authenticated, otherwise IP address
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Get IP from various headers (for proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict: 10 requests per minute
  strict: {
    interval: 60000,
    uniqueTokenPerInterval: 10
  },
  // Standard: 30 requests per minute
  standard: {
    interval: 60000,
    uniqueTokenPerInterval: 30
  },
  // Relaxed: 100 requests per minute
  relaxed: {
    interval: 60000,
    uniqueTokenPerInterval: 100
  },
  // AI Streaming: 20 requests per minute (expensive operations)
  aiStream: {
    interval: 60000,
    uniqueTokenPerInterval: 20
  },
  // Login/Auth: 5 requests per 5 minutes
  auth: {
    interval: 300000,
    uniqueTokenPerInterval: 5
  },
  // Profile Update: 10 requests per minute
  profileUpdate: {
    interval: 60000,
    uniqueTokenPerInterval: 10
  }
} as const

/**
 * Helper to add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  identifier: string,
  config: RateLimitConfig
): NextResponse {
  const key = `rate_limit:${identifier}`
  const entry = rateLimitStore.get(key)

  if (entry) {
    const remaining = Math.max(0, config.uniqueTokenPerInterval - entry.count)
    response.headers.set('X-RateLimit-Limit', config.uniqueTokenPerInterval.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())
  }

  return response
}
