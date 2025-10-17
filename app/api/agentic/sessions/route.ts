import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agentic/sessions - List all sessions for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user (upsert ensures user exists)
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        name: session.user.name || 'User',
      },
    })

    // Fetch all sessions for the user, ordered by most recent first
    const sessions = await prisma.agenticSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })

    return NextResponse.json({ sessions }, { status: 200 })
  } catch (error) {
    console.error('[Agentic Sessions GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST /api/agentic/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user (upsert ensures user exists)
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        name: session.user.name || 'User',
      },
    })

    const body = await request.json()
    const { title, model, settings } = body

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 })
    }

    // Create new agentic session
    const newSession = await prisma.agenticSession.create({
      data: {
        userId: user.id,
        title: title || 'New Agentic Session',
        model,
        settings: settings ? JSON.stringify(settings) : null,
      },
    })

    return NextResponse.json({ session: newSession }, { status: 201 })
  } catch (error) {
    console.error('[Agentic Sessions POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
