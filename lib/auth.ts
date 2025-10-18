import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import type { NextAuthOptions } from 'next-auth'
import bcrypt from 'bcrypt'

// Hardcoded credentials for single-user deployment
const VALID_USERNAME = 'addison'
const VALID_PASSWORD_HASH = '$2b$10$rQ7Z8Z8Z8Z8Z8Z8Z8Z8Z8O' // Will be replaced with actual hash

// Hash the password on first import (dev only - in production, use pre-hashed)
let PASSWORD_HASH: string | null = null
;(async () => {
  PASSWORD_HASH = await bcrypt.hash('ac783d', 10)
})()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Validate credentials
        if (credentials.username !== VALID_USERNAME) {
          return null
        }

        // Wait for password hash to be generated if not ready yet
        if (!PASSWORD_HASH) {
          PASSWORD_HASH = await bcrypt.hash('ac783d', 10)
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, PASSWORD_HASH)
        if (!isValid) {
          return null
        }

        // Find or create user in database
        let user = await prisma.user.findUnique({
          where: { username: VALID_USERNAME }
        })

        if (!user) {
          // Create user on first successful login
          user = await prisma.user.create({
            data: {
              username: VALID_USERNAME,
              email: 'addison@agentic.local',
              name: 'Addison'
            }
          })
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name || user.username || ''
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}
