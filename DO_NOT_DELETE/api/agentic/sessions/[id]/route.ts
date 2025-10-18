import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/agentic/sessions/[id] - Get a specific session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const agenticSession = await prisma.agenticSession.findFirst({
      where: {
        id: id,
        userId: user.id, // Ensure user can only access their own sessions
      },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })

    if (!agenticSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session: agenticSession }, { status: 200 })
  } catch (error) {
    console.error('[Agentic Session GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

// PATCH /api/agentic/sessions/[id] - Update a session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify session belongs to user
    const existingSession = await prisma.agenticSession.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, model, settings } = body

    // Update session
    const updatedSession = await prisma.agenticSession.update({
      where: { id: id },
      data: {
        ...(title !== undefined && { title }),
        ...(model !== undefined && { model }),
        ...(settings !== undefined && { settings: JSON.stringify(settings) }),
      },
    })

    return NextResponse.json({ session: updatedSession }, { status: 200 })
  } catch (error) {
    console.error('[Agentic Session PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

// DELETE /api/agentic/sessions/[id] - Delete a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify session belongs to user
    const existingSession = await prisma.agenticSession.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Delete session (messages will cascade delete due to schema)
    await prisma.agenticSession.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Agentic Session DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
