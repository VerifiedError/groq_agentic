import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GROQ_PRICING, isVisionModel } from '@/lib/groq-utils'

// GET /api/models - Fetch all active models
export async function GET() {
  try {
    // Try to fetch from database first
    const dbModels = await prisma.groqModel.findMany({
      where: { isActive: true },
      orderBy: [
        { isVision: 'desc' }, // Vision models first
        { displayName: 'asc' },
      ],
    })

    // If database has models, return them
    if (dbModels.length > 0) {
      return NextResponse.json({
        models: dbModels,
        source: 'database',
      })
    }

    // Fallback to hardcoded models if database is empty
    const fallbackModels = Object.entries(GROQ_PRICING).map(([id, pricing]) => {
      // Generate display names from model IDs
      const displayName = id
        .replace(/^groq\//, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())

      return {
        id,
        displayName,
        contextWindow: id.includes('compound') ? 128000 : 8192,
        inputPricing: pricing.input,
        outputPricing: pricing.output,
        isVision: isVisionModel(id),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

    return NextResponse.json({
      models: fallbackModels,
      source: 'fallback',
    })
  } catch (error: any) {
    console.error('[Models API] Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}
