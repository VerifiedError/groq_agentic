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
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const username = credentials.username.toLowerCase().trim()
        const password = credentials.password

        // Get client IP for rate limiting
        const ip = getClientIp(req)

        // Check rate limit
        const rateLimit = checkRateLimit(username, ip)
        if (rateLimit.isBlocked) {
          console.warn(`Rate limit exceeded for ${username} from ${ip}`)
          throw new Error(
            `Too many failed attempts. Try again in ${rateLimit.remainingTime} minutes.`
          )
        }

        // Find user by username (case-insensitive)
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
          recordFailedAttempt(username, ip)
          return null
        }

        // Check if user is active
        if (!user.isActive) {
          console.warn(`Inactive user attempted login: ${username}`)
          return null
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash)

        if (!isValid) {
          recordFailedAttempt(username, ip)
          return null
        }

        // Successful login - clear rate limit and update lastLoginAt
        clearRateLimit(username, ip)

        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        })

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
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}
