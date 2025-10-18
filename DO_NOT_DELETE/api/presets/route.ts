import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Global presets (read-only)
const GLOBAL_PRESETS = [
  {
    id: 'global-creative',
    name: 'Creative Writing',
    description: 'Higher temperature for creative and diverse outputs',
    config: JSON.stringify({
      temperature: 1.2,
      maxTokens: 2000,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    }),
    isGlobal: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'global-precise',
    name: 'Precise Code',
    description: 'Lower temperature for focused and deterministic code generation',
    config: JSON.stringify({
      temperature: 0.3,
      maxTokens: 2000,
      topP: 0.5,
      frequencyPenalty: 0,
      presencePenalty: 0,
    }),
    isGlobal: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'global-balanced',
    name: 'Balanced',
    description: 'Balanced settings for general use',
    config: JSON.stringify({
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.8,
      frequencyPenalty: 0,
      presencePenalty: 0,
    }),
    isGlobal: true,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// GET /api/presets - List user + global presets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user presets
    const userPresets = await prisma.modelPreset.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    // Combine global + user presets
    const allPresets = [
      ...GLOBAL_PRESETS,
      ...userPresets.map(preset => ({
        ...preset,
        userId: undefined, // Don't expose userId to client
      })),
    ]

    return NextResponse.json({ presets: allPresets })
  } catch (error) {
    console.error('[API] Error fetching presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 }
    )
  }
}

// POST /api/presets - Create new preset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, config, isDefault } = body

    // Validate required fields
    if (!name || !config) {
      return NextResponse.json(
        { error: 'Name and config are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.modelPreset.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Create preset
    const preset = await prisma.modelPreset.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        config: typeof config === 'string' ? config : JSON.stringify(config),
        isGlobal: false,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ preset })
  } catch (error) {
    console.error('[API] Error creating preset:', error)
    return NextResponse.json(
      { error: 'Failed to create preset' },
      { status: 500 }
    )
  }
}
