import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/sessions/[id]/messages - Add message to session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: sessionId } = await params
    const body = await request.json()
    const { role, content, reasoning, images, cost, inputTokens, outputTokens, cachedTokens } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    // Verify session belongs to user
    const existingSession = await prisma.agenticSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Create message with cost tracking
    const message = await prisma.agenticMessage.create({
      data: {
        sessionId,
        role,
        content,
        reasoning: reasoning || null,
        attachments: images ? JSON.stringify(images) : null,
        cost: cost || 0,
        inputTokens: inputTokens || 0,
        outputTokens: outputTokens || 0,
        cachedTokens: cachedTokens || 0,
      },
    })

    // Update session message count, cost, tokens, and timestamp
    await prisma.agenticSession.update({
      where: { id: sessionId },
      data: {
        messageCount: {
          increment: 1,
        },
        totalCost: {
          increment: cost || 0,
        },
        inputTokens: {
          increment: inputTokens || 0,
        },
        outputTokens: {
          increment: outputTokens || 0,
        },
        cachedTokens: {
          increment: cachedTokens || 0,
        },
        updatedAt: new Date(),
      },
    })

    // Transform to match client-side Message interface
    const transformedMessage = {
      id: message.id,
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
      reasoning: message.reasoning || undefined,
      images: message.attachments ? JSON.parse(message.attachments) : undefined,
      timestamp: message.createdAt,
      cost: message.cost,
      inputTokens: message.inputTokens,
      outputTokens: message.outputTokens,
      cachedTokens: message.cachedTokens,
    }

    return NextResponse.json({ message: transformedMessage })
  } catch (error) {
    console.error('[POST /api/sessions/[id]/messages] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
