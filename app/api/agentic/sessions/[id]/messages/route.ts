import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/agentic/sessions/[id]/messages - Get all messages for a session
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

    // Verify session belongs to user
    const agenticSession = await prisma.agenticSession.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!agenticSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Fetch all messages for the session, ordered by creation time
    const messages = await prisma.agenticMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages }, { status: 200 })
  } catch (error) {
    console.error('[Agentic Messages GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
