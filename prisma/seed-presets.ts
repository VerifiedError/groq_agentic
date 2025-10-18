import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Default global presets that are available to all users
const GLOBAL_PRESETS = [
  {
    name: 'Creative Writing',
    description: 'Ideal for stories, poetry, and imaginative content',
    config: JSON.stringify({
      temperature: 1.2,
      topP: 0.9,
      maxTokens: 2000,
      systemPrompt: 'You are a creative writing assistant. Write engaging, vivid, and imaginative content.',
    }),
  },
  {
    name: 'Precise Code',
    description: 'Best for programming tasks requiring accuracy',
    config: JSON.stringify({
      temperature: 0.3,
      topP: 0.5,
      maxTokens: 4000,
      systemPrompt: 'You are an expert programmer. Write clean, efficient, well-documented code.',
    }),
  },
  {
    name: 'Balanced',
    description: 'General-purpose preset for everyday tasks',
    config: JSON.stringify({
      temperature: 0.7,
      topP: 0.8,
      maxTokens: 1500,
      systemPrompt: 'You are a helpful AI assistant.',
    }),
  },
  {
    name: 'Analytical',
    description: 'For research, analysis, and detailed reasoning',
    config: JSON.stringify({
      temperature: 0.5,
      topP: 0.7,
      maxTokens: 3000,
      systemPrompt: 'You are an analytical assistant. Provide detailed, logical, well-reasoned responses.',
    }),
  },
  {
    name: 'Conversational',
    description: 'Natural, engaging dialogue for casual chat',
    config: JSON.stringify({
      temperature: 0.9,
      topP: 0.9,
      maxTokens: 1000,
      systemPrompt: 'You are a friendly conversational AI. Chat naturally and engagingly.',
    }),
  },
]

async function seedPresets() {
  console.log('🌱 Seeding global presets...')

  // Create or get system user for global presets
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@groq-agentic.local' },
    update: {},
    create: {
      email: 'system@groq-agentic.local',
      name: 'System',
      username: 'system',
    },
  })

  console.log(`✅ System user: ${systemUser.email} (ID: ${systemUser.id})`)

  // Create global presets
  let createdCount = 0
  let skippedCount = 0

  for (const preset of GLOBAL_PRESETS) {
    const existing = await prisma.modelPreset.findFirst({
      where: {
        userId: systemUser.id,
        name: preset.name,
        isGlobal: true,
      },
    })

    if (existing) {
      console.log(`⏭️  Skipping "${preset.name}" (already exists)`)
      skippedCount++
    } else {
      await prisma.modelPreset.create({
        data: {
          userId: systemUser.id,
          name: preset.name,
          description: preset.description,
          config: preset.config,
          isGlobal: true,
          isDefault: false,
        },
      })
      console.log(`✅ Created global preset: ${preset.name}`)
      createdCount++
    }
  }

  console.log('')
  console.log(`✨ Seeding complete!`)
  console.log(`   Created: ${createdCount} presets`)
  console.log(`   Skipped: ${skippedCount} presets`)
  console.log('')
}

seedPresets()
  .catch((error) => {
    console.error('❌ Seed error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
