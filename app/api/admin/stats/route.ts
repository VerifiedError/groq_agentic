import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-middleware'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats
 * Get system statistics (admin only)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    // Run all queries in parallel
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalSessions,
      totalMessages,
      totalCost,
      recentLogins,
      modelStats,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users
      prisma.user.count({
        where: { isActive: true },
      }),

      // Admin users
      prisma.user.count({
        where: { role: 'admin' },
      }),

      // Total sessions
      prisma.agenticSession.count(),

      // Total messages
      prisma.agenticMessage.count(),

      // Total cost aggregation
      prisma.agenticSession.aggregate({
        _sum: {
          totalCost: true,
          inputTokens: true,
          outputTokens: true,
          cachedTokens: true,
        },
      }),

      // Recent logins (last 7 days)
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Model usage stats
      prisma.agenticSession.groupBy({
        by: ['model'],
        _count: {
          model: true,
        },
        orderBy: {
          _count: {
            model: 'desc',
          },
        },
        take: 10,
      }),
    ])

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: adminUsers,
        recentLogins,
      },
      sessions: {
        total: totalSessions,
      },
      messages: {
        total: totalMessages,
      },
      costs: {
        totalCost: totalCost._sum.totalCost || 0,
        inputTokens: totalCost._sum.inputTokens || 0,
        outputTokens: totalCost._sum.outputTokens || 0,
        cachedTokens: totalCost._sum.cachedTokens || 0,
      },
      models: {
        usage: modelStats.map((stat) => ({
          model: stat.model,
          count: stat._count.model,
        })),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
