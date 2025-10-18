import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/sessions/[id] - Update session
export async function PATCH(
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

    const { id } = await params
    const body = await request.json()
    const { name, totalCost, totalTokens } = body

    // Verify session belongs to user
    const existingSession = await prisma.agenticSession.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Update session
    const updateData: any = {}
    if (name !== undefined) updateData.title = name
    if (totalCost !== undefined) updateData.totalCost = totalCost
    if (totalTokens !== undefined) {
      // Store tokens in inputTokens for now (we can track separately later)
      updateData.inputTokens = totalTokens
    }

    const updatedSession = await prisma.agenticSession.update({
      where: { id },
      data: updateData,
    })

    // Transform to match client-side Session interface
    const transformedSession = {
      id: updatedSession.id,
      name: updatedSession.title,
      model: updatedSession.model,
      totalCost: updatedSession.totalCost,
      totalTokens: updatedSession.inputTokens + updatedSession.outputTokens,
      updatedAt: updatedSession.updatedAt,
    }

    return NextResponse.json({ session: transformedSession })
  } catch (error) {
    console.error('[PATCH /api/sessions/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(
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

    const { id } = await params

    // Verify session belongs to user
    const existingSession = await prisma.agenticSession.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Delete session (cascades to messages due to onDelete: Cascade)
    await prisma.agenticSession.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/sessions/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
