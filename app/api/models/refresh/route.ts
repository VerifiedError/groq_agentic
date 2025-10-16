import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'
import { isVisionModel } from '@/lib/groq-utils'

// Vision model patterns for detection
const VISION_MODEL_PATTERNS = [
  'vision',
  'llava',
  'llama-4-maverick',
  'llama-4-scout',
  'llama-3.2-11b',
  'llama-3.2-90b',
]

function detectVisionModel(modelId: string): boolean {
  // First check against known vision models
  if (isVisionModel(modelId)) return true

  // Then check patterns
  return VISION_MODEL_PATTERNS.some((pattern) =>
    modelId.toLowerCase().includes(pattern)
  )
}

// POST /api/models/refresh - Fetch models from Groq API and sync to database
export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Models Refresh] Fetching models from Groq API...')

    // Fetch models from Groq API
    const modelsResponse = await groq.models.list()

    if (!modelsResponse.data || modelsResponse.data.length === 0) {
      throw new Error('No models returned from Groq API')
    }

    console.log(`[Models Refresh] Received ${modelsResponse.data.length} models from Groq`)

    // Parse and upsert each model
    const upsertedModels = []

    for (const model of modelsResponse.data) {
      // Extract model metadata
      const modelId = model.id
      const displayName = model.id
        .replace(/^groq\//, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())

      // Detect if it's a vision model
      const isVision = detectVisionModel(modelId)

      // Default pricing (will be $0 until we get real pricing data)
      // In production, you might want to call a separate pricing API or parse from model metadata
      const inputPricing = 0
      const outputPricing = 0

      // Context window from model data or default
      const contextWindow = model.context_window || 8192

      // Upsert the model
      const upsertedModel = await prisma.groqModel.upsert({
        where: { id: modelId },
        update: {
          displayName,
          contextWindow,
          inputPricing,
          outputPricing,
          isVision,
          isActive: model.active !== false, // Mark inactive if explicitly set to false
          updatedAt: new Date(),
        },
        create: {
          id: modelId,
          displayName,
          contextWindow,
          inputPricing,
          outputPricing,
          isVision,
          isActive: model.active !== false,
        },
      })

      upsertedModels.push(upsertedModel)
      console.log(`[Models Refresh] Upserted model: ${modelId} (Vision: ${isVision})`)
    }

    console.log(`[Models Refresh] Successfully synced ${upsertedModels.length} models`)

    return NextResponse.json({
      success: true,
      count: upsertedModels.length,
      models: upsertedModels,
    })
  } catch (error: any) {
    console.error('[Models Refresh] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to refresh models',
        details: error.message
      },
      { status: 500 }
    )
  }
}
