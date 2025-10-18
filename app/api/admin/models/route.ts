import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-middleware'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/models
 * Get all models including inactive ones (admin only)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const models = await prisma.groqModel.findMany({
      orderBy: [{ isActive: 'desc' }, { displayName: 'asc' }],
    })

    return NextResponse.json({
      models,
      total: models.length,
      active: models.filter((m) => m.isActive).length,
      inactive: models.filter((m) => !m.isActive).length,
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}
