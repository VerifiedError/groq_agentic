import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import type { NextAuthOptions } from 'next-auth'
import { verifyPassword } from '@/lib/auth/password'
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from '@/lib/auth/login-rate-limit'

/**
 * Get client IP address from request
 * @param req - Request object
 * @returns IP address or 'unknown'
 */
function getClientIp(req: any): string {
  // Check various headers for IP
  const forwarded = req.headers?.['x-forwarded-for']
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers?.['x-real-ip']
  if (realIp) {
    return realIp
  }

  return req.connection?.remoteAddress || 'unknown'
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        console.log('[Auth] Authorize called')

        // Environment variable checks
        console.log('[Auth] Environment check:', {
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          nextAuthUrl: process.env.NEXTAUTH_URL,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          hasDatabase: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV,
        })

        if (!process.env.NEXTAUTH_URL) {
          console.error('[Auth] CRITICAL: NEXTAUTH_URL not set!')
          throw new Error('Authentication system misconfigured. Contact administrator.')
        }

        if (!process.env.NEXTAUTH_SECRET) {
          console.error('[Auth] CRITICAL: NEXTAUTH_SECRET not set!')
          throw new Error('Authentication system misconfigured. Contact administrator.')
        }

        if (!credentials?.username || !credentials?.password) {
          console.error('[Auth] Missing credentials')
          throw new Error('Username and password are required')
        }

        const username = credentials.username.toLowerCase().trim()
        const password = credentials.password

        console.log('[Auth] Attempting login for username:', username)

        // Get client IP for rate limiting
        const ip = getClientIp(req)
        console.log('[Auth] Client IP:', ip)

        // Check rate limit
        const rateLimit = checkRateLimit(username, ip)
        if (rateLimit.isBlocked) {
          console.warn(`[Auth] Rate limit exceeded for ${username} from ${ip}`)
          throw new Error(
            `Too many failed attempts. Try again in ${rateLimit.remainingTime} minutes.`
          )
        }

        // Find user by username (case-insensitive)
        console.log('[Auth] Looking up user in database...')
        const user = await prisma.user.findFirst({
          where: {
            username: {
              equals: username,
              mode: 'insensitive',
            },
          },
        })

        // User not found
        if (!user) {
          console.warn(`[Auth] User not found: ${username}`)
          recordFailedAttempt(username, ip)
          throw new Error('Invalid username or password')
        }

        console.log('[Auth] User found:', { id: user.id, username: user.username, isActive: user.isActive })

        // Check if user is active
        if (!user.isActive) {
          console.warn(`[Auth] Inactive user attempted login: ${username}`)
          throw new Error('Account is disabled. Please contact an administrator.')
        }

        // Verify password
        console.log('[Auth] Verifying password...')
        const isValid = await verifyPassword(password, user.passwordHash)

        if (!isValid) {
          console.warn(`[Auth] Invalid password for user: ${username}`)
          recordFailedAttempt(username, ip)
          throw new Error('Invalid username or password')
        }

        console.log('[Auth] Password verified successfully')

        // Successful login - clear rate limit and update lastLoginAt
        clearRateLimit(username, ip)

        console.log('[Auth] Updating lastLoginAt...')
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        })

        console.log('[Auth] Login successful for:', username)

        // Return user data for session
        return {
          id: String(user.id),
          email: user.email,
          name: user.name || user.username,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        // Add role to session if available
        if (token.role) {
          ;(session.user as any).role = token.role
        }
      }
      return session
    },
    async jwt({ token, user }) {
      // Add role to JWT token on login
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  // Removed custom cookie configuration - let NextAuth handle it automatically
  // This fixes issues with custom domains on Vercel where cookie domain/name
  // needs to be dynamically configured based on NEXTAUTH_URL
}
