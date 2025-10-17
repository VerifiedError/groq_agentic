import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/presets/[id] - Update preset
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Prevent modifying global presets
    if (id.startsWith('global-')) {
      return NextResponse.json(
        { error: 'Cannot modify global presets' },
        { status: 403 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check ownership
    const preset = await prisma.modelPreset.findUnique({
      where: { id },
    })

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    if (preset.userId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this preset' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, config, isDefault } = body

    // If setting as default, unset other defaults
    if (isDefault && !preset.isDefault) {
      await prisma.modelPreset.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Update preset
    const updatedPreset = await prisma.modelPreset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(config && {
          config: typeof config === 'string' ? config : JSON.stringify(config),
        }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json({ preset: updatedPreset })
  } catch (error) {
    console.error('[API] Error updating preset:', error)
    return NextResponse.json(
      { error: 'Failed to update preset' },
      { status: 500 }
    )
  }
}

// DELETE /api/presets/[id] - Delete preset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Prevent deleting global presets
    if (id.startsWith('global-')) {
      return NextResponse.json(
        { error: 'Cannot delete global presets' },
        { status: 403 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check ownership
    const preset = await prisma.modelPreset.findUnique({
      where: { id },
    })

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    if (preset.userId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this preset' },
        { status: 403 }
      )
    }

    // Delete preset
    await prisma.modelPreset.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error deleting preset:', error)
    return NextResponse.json(
      { error: 'Failed to delete preset' },
      { status: 500 }
    )
  }
}
