import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/settings
 * Get user settings including API key status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user from database (upsert ensures user exists)
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {}, // No updates, just ensure user exists
      create: {
        email: session.user.email,
        name: session.user.name || 'User',
      },
      select: {
        id: true,
        email: true,
        name: true,
        apiKey: true, // Include API key
      },
    })

    // Return settings (mask API key for security)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      hasApiKey: !!user.apiKey,
      apiKeyPreview: user.apiKey
        ? `${user.apiKey.substring(0, 7)}...${user.apiKey.substring(user.apiKey.length - 4)}`
        : null,
    })
  } catch (error: any) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/settings
 * Update user settings (API key, name, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey, name } = body

    // Validate API key format if provided
    if (apiKey !== undefined && apiKey !== null && apiKey !== '') {
      if (!apiKey.startsWith('gsk_')) {
        return NextResponse.json(
          { error: 'Invalid API key format. Groq API keys start with "gsk_"' },
          { status: 400 }
        )
      }

      if (apiKey.length < 20) {
        return NextResponse.json(
          { error: 'API key seems too short. Please check and try again.' },
          { status: 400 }
        )
      }
    }

    // Update or create user settings (upsert ensures user exists)
    const updatedUser = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {
        ...(apiKey !== undefined && { apiKey: apiKey || null }), // Allow clearing by sending empty string
        ...(name !== undefined && { name }),
      },
      create: {
        email: session.user.email,
        name: name || session.user.name || 'User',
        ...(apiKey && { apiKey }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        apiKey: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
      hasApiKey: !!updatedUser.apiKey,
      apiKeyPreview: updatedUser.apiKey
        ? `${updatedUser.apiKey.substring(0, 7)}...${updatedUser.apiKey.substring(updatedUser.apiKey.length - 4)}`
        : null,
    })
  } catch (error: any) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
