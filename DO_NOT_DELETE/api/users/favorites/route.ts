import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/users/favorites
 * Get user's favorite model IDs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { favoriteModels: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const favorites = user.favoriteModels ? JSON.parse(user.favoriteModels) : []

    return NextResponse.json({ favorites })
  } catch (error: any) {
    console.error('Get favorites error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get favorites' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/favorites
 * Toggle a model's favorite status
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { modelId } = body

    if (!modelId || typeof modelId !== 'string') {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { favoriteModels: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentFavorites: string[] = user.favoriteModels
      ? JSON.parse(user.favoriteModels)
      : []

    let newFavorites: string[]
    let action: 'added' | 'removed'

    if (currentFavorites.includes(modelId)) {
      // Remove from favorites
      newFavorites = currentFavorites.filter(id => id !== modelId)
      action = 'removed'
    } else {
      // Add to favorites
      newFavorites = [...currentFavorites, modelId]
      action = 'added'
    }

    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: { favoriteModels: JSON.stringify(newFavorites) }
    })

    return NextResponse.json({
      success: true,
      action,
      favorites: newFavorites
    })
  } catch (error: any) {
    console.error('Toggle favorite error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle favorite' },
      { status: 500 }
    )
  }
}
