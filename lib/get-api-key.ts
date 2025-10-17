import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get the effective GROQ API key for the current user
 * Priority: User's API key > Global environment variable
 */
export async function getEffectiveApiKey(): Promise<string> {
  try {
    // Try to get user's API key
    const session = await getServerSession(authOptions)

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { apiKey: true },
      })

      // If user has their own API key, use it
      if (user?.apiKey) {
        console.log('[API Key] Using user-specific API key')
        return user.apiKey
      }
    }

    // Fall back to global API key
    const globalKey = process.env.GROQ_API_KEY

    if (!globalKey) {
      throw new Error(
        'No API key available. Please set your API key in Settings or configure GROQ_API_KEY environment variable.'
      )
    }

    console.log('[API Key] Using global API key from environment')
    return globalKey
  } catch (error) {
    console.error('[API Key] Error getting API key:', error)
    throw error
  }
}
