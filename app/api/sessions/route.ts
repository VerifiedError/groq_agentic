import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/sessions - List user's sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch all sessions for this user, ordered by most recent
    const sessions = await prisma.agenticSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            reasoning: true,
            attachments: true,
            createdAt: true,
          },
        },
      },
    })

    // Transform to match client-side Session interface
    const transformedSessions = sessions.map((s) => ({
      id: s.id,
      name: s.title,
      model: s.model,
      messages: s.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        reasoning: m.reasoning || undefined,
        images: m.attachments ? JSON.parse(m.attachments) : undefined,
        timestamp: m.createdAt,
      })),
      totalCost: s.totalCost,
      totalTokens: s.inputTokens + s.outputTokens,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))

    return NextResponse.json({ sessions: transformedSessions })
  } catch (error) {
    console.error('[GET /api/sessions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { model, name } = body

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      )
    }

    // Create new session
    const newSession = await prisma.agenticSession.create({
      data: {
        userId: user.id,
        model,
        title: name || 'New Chat',
      },
      include: {
        messages: true,
      },
    })

    // Transform to match client-side Session interface
    const transformedSession = {
      id: newSession.id,
      name: newSession.title,
      model: newSession.model,
      messages: [],
      totalCost: newSession.totalCost,
      totalTokens: newSession.inputTokens + newSession.outputTokens,
      createdAt: newSession.createdAt,
      updatedAt: newSession.updatedAt,
    }

    return NextResponse.json({ session: transformedSession })
  } catch (error) {
    console.error('[POST /api/sessions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
