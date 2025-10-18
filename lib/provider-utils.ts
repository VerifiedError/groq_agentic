/**
 * AI Provider Types and Utilities
 *
 * This module defines AI provider types and utilities for detecting
 * and managing different AI service providers (Groq, OpenAI, etc.)
 */

export type AIProvider =
  | 'auto'         // Auto-detect from model ID
  | 'groq'         // Groq (default for this app)
  | 'openrouter'   // OpenRouter
  | 'openai'       // OpenAI
  | 'anthropic'    // Anthropic
  | 'google'       // Google (Gemini)
  | 'mistral'      // Mistral AI
  | 'cohere'       // Cohere

export interface ProviderOption {
  value: AIProvider
  label: string
  description: string
  icon?: string
  color?: string // Badge color
}

/**
 * Available AI provider options with metadata
 */
export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Automatically detect from model ID',
    icon: '🔍',
    color: 'bg-gray-500'
  },
  {
    value: 'groq',
    label: 'Groq',
    description: 'Groq LPU inference',
    icon: '⚡',
    color: 'bg-orange-500'
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    description: 'OpenRouter unified API',
    icon: '🌐',
    color: 'bg-blue-500'
  },
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'OpenAI GPT models',
    icon: '🤖',
    color: 'bg-green-500'
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    description: 'Claude models',
    icon: '🧠',
    color: 'bg-purple-500'
  },
  {
    value: 'google',
    label: 'Google',
    description: 'Gemini models',
    icon: '🔵',
    color: 'bg-red-500'
  },
  {
    value: 'mistral',
    label: 'Mistral',
    description: 'Mistral AI models',
    icon: '🌪️',
    color: 'bg-indigo-500'
  },
  {
    value: 'cohere',
    label: 'Cohere',
    description: 'Cohere models',
    icon: '🔷',
    color: 'bg-teal-500'
  }
]

/**
 * Get provider option by value
 */
export function getProviderOption(provider: AIProvider): ProviderOption | undefined {
  return PROVIDER_OPTIONS.find(opt => opt.value === provider)
}

/**
 * Detect AI provider from model ID
 *
 * Examples:
 * - "groq/compound" → "groq"
 * - "llama-3.3-70b-versatile" → "groq" (default)
 * - "openai/gpt-4" → "openai"
 * - "anthropic/claude-3-opus" → "anthropic"
 */
export function detectProvider(modelId: string): AIProvider {
  const id = modelId.toLowerCase()

  // Explicit provider prefixes
  if (id.startsWith('groq/')) return 'groq'
  if (id.startsWith('openrouter/')) return 'openrouter'
  if (id.startsWith('openai/')) return 'openai'
  if (id.startsWith('anthropic/')) return 'anthropic'
  if (id.startsWith('google/')) return 'google'
  if (id.startsWith('mistral/')) return 'mistral'
  if (id.startsWith('cohere/')) return 'cohere'

  // Model-specific detection patterns
  if (id.includes('gpt-') || id.includes('o1-')) return 'openai'
  if (id.includes('claude-')) return 'anthropic'
  if (id.includes('gemini-') || id.includes('gemma-')) return 'google'
  if (id.includes('mistral-')) return 'mistral'
  if (id.includes('command-') || id.includes('coral-')) return 'cohere'

  // Groq-specific model families (default for this app)
  if (
    id.includes('llama') ||
    id.includes('mixtral') ||
    id.includes('whisper') ||
    id.includes('distil-whisper') ||
    id.includes('llava') ||
    id.includes('compound')
  ) {
    return 'groq'
  }

  // Default to Groq (since this is primarily a Groq app)
  return 'groq'
}

/**
 * Get display name for provider
 */
export function getProviderDisplayName(provider: AIProvider): string {
  const option = getProviderOption(provider)
  return option?.label || provider
}

/**
 * Get provider badge color
 */
export function getProviderColor(provider: AIProvider): string {
  const option = getProviderOption(provider)
  return option?.color || 'bg-gray-500'
}

/**
 * Get provider icon
 */
export function getProviderIcon(provider: AIProvider): string {
  const option = getProviderOption(provider)
  return option?.icon || '🤖'
}

/**
 * Filter models by provider
 */
export function filterModelsByProvider(
  models: Array<{ id: string }>,
  provider: AIProvider
): Array<{ id: string }> {
  if (provider === 'auto') {
    return models // Return all models in auto mode
  }

  return models.filter(model => {
    const detectedProvider = detectProvider(model.id)
    return detectedProvider === provider
  })
}

/**
 * Validate if a model ID belongs to a specific provider
 */
export function isProviderModel(modelId: string, provider: AIProvider): boolean {
  if (provider === 'auto') return true
  return detectProvider(modelId) === provider
}
