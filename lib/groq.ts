import Groq from 'groq-sdk'

if (!process.env.GROQ_API_KEY) {
  console.warn('[Groq] Missing GROQ_API_KEY environment variable. Groq models will not be available.')
}

// Use official Groq SDK instead of OpenAI SDK
// This properly exposes Groq-specific fields like executed_tools
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export const GROQ_PRICING = {
  'groq/compound': {
    input: 0,
    output: 0,
  },
  'groq/compound-mini': {
    input: 0,
    output: 0,
  },
  'llama-3.1-8b-instant': {
    input: 0.05,
    output: 0.08,
  },
  'llama-3.3-70b-versatile': {
    input: 0.59,
    output: 0.79,
  },
  'meta-llama/llama-guard-4-12b': {
    input: 0.2,
    output: 0.2,
  },
  'meta-llama/llama-4-maverick-17b-128e-instruct': {
    input: 0.2,
    output: 0.6,
  },
  'meta-llama/llama-4-scout-17b-16e-instruct': {
    input: 0.11,
    output: 0.34,
  },
  'meta-llama/llama-prompt-guard-2-22m': {
    input: 0.03,
    output: 0.03,
  },
  'meta-llama/llama-prompt-guard-2-86m': {
    input: 0.04,
    output: 0.04,
  },
  'moonshotai/kimi-k2-instruct-0905': {
    input: 1.0,
    output: 3.0,
  },
  'playai-tts': {
    input: 50.0,
    output: 0,
  },
  'playai-tts-arabic': {
    input: 50.0,
    output: 0,
  },
  'qwen/qwen3-32b': {
    input: 0.29,
    output: 0.59,
  },
  'whisper-large-v3': {
    input: 0,
    output: 0,
  },
  'whisper-large-v3-turbo': {
    input: 0,
    output: 0,
  },
  'openai/gpt-oss-120b': {
    input: 0.15,
    output: 0.75,
  },
  'openai/gpt-oss-20b': {
    input: 0.1,
    output: 0.5,
  },
  // Vision Models
  'llama-3.2-11b-vision-preview': {
    input: 0.18,
    output: 0.18,
  },
  'llama-3.2-90b-vision-preview': {
    input: 0.9,
    output: 0.9,
  },
  'llava-v1.5-7b-4096-preview': {
    input: 0,
    output: 0,
  },
} as const

export type GroqModelName = keyof typeof GROQ_PRICING

// Vision-capable models
const VISION_MODELS = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.2-11b-vision-preview',
  'llama-3.2-90b-vision-preview',
  'llava-v1.5-7b-4096-preview',
] as const

export function isGroqModel(model: string): boolean {
  return model.startsWith('groq/') || model in GROQ_PRICING
}

export function isVisionModel(model: string): boolean {
  return VISION_MODELS.includes(model as any)
}

export function calculateGroqCost(
  model: GroqModelName,
  promptTokens: number,
  completionTokens: number
): {
  inputCost: number
  outputCost: number
  totalCost: number
} {
  const pricing = GROQ_PRICING[model]

  if (!pricing) {
    console.warn(`[Groq] Unknown model "${model}". Defaulting cost to 0.`)
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
    }
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input
  const outputCost = (completionTokens / 1_000_000) * pricing.output
  const totalCost = inputCost + outputCost

  return {
    inputCost,
    outputCost,
    totalCost,
  }
}
