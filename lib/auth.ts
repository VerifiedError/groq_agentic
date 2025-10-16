import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Simple mock auth for development
        if (!credentials?.email) return null

        let user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          // Auto-create user for simplicity
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: 'Demo User'
            }
          })
        }

        return { id: String(user.id), email: user.email, name: user.name || '' }
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
