import Groq from 'groq-sdk'

// Re-export client-safe utilities from groq-utils
export {
  GROQ_PRICING,
  type GroqModelName,
  isGroqModel,
  isVisionModel,
  calculateGroqCost,
} from './groq-utils'

if (!process.env.GROQ_API_KEY) {
  console.warn('[Groq] Missing GROQ_API_KEY environment variable. Groq models will not be available.')
}

// Use official Groq SDK instead of OpenAI SDK
// This properly exposes Groq-specific fields like executed_tools
// NOTE: This groq instance is SERVER-SIDE ONLY
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

/**
 * Create a Groq client with a custom API key (for user-specific keys)
 */
export function createGroqClient(apiKey: string): Groq {
  return new Groq({
    apiKey,
  })
}
