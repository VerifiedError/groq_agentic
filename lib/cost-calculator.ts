/**
 * Cost Calculator Utility
 * Calculates token usage and costs for chat messages and sessions
 */

import { GROQ_PRICING, GroqModelName, calculateGroqCost } from './groq-utils'

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens?: number
}

export interface CostBreakdown {
  inputCost: number
  outputCost: number
  totalCost: number
  inputTokens: number
  outputTokens: number
  cachedTokens: number
}

/**
 * Estimates token count for a message (rough approximation)
 * Real token counts should come from API response
 * ~4 characters = 1 token for English text
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Calculates cost for a single message based on token usage
 */
export function calculateMessageCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
  cachedTokens: number = 0
): CostBreakdown {
  const groqCost = calculateGroqCost(model as GroqModelName, promptTokens, completionTokens)

  return {
    inputCost: groqCost.inputCost,
    outputCost: groqCost.outputCost,
    totalCost: groqCost.totalCost,
    inputTokens: promptTokens,
    outputTokens: completionTokens,
    cachedTokens,
  }
}

/**
 * Formats cost as a human-readable string
 * @param cost - Cost in dollars
 * @param decimals - Number of decimal places (default: 4)
 */
export function formatCost(cost: number, decimals: number = 4): string {
  if (cost === 0) return 'Free'
  if (cost < 0.0001) return '< $0.0001'
  return `$${cost.toFixed(decimals)}`
}

/**
 * Formats token count with commas
 */
export function formatTokens(tokens: number): string {
  return tokens.toLocaleString()
}

/**
 * Gets pricing information for a model
 */
export function getModelPricing(modelId: string): {
  input: number
  output: number
  exists: boolean
} {
  const pricing = GROQ_PRICING[modelId as GroqModelName]

  if (!pricing) {
    return {
      input: 0,
      output: 0,
      exists: false,
    }
  }

  return {
    input: pricing.input,
    output: pricing.output,
    exists: true,
  }
}

/**
 * Calculates total cost for a session from all messages
 */
export function calculateSessionCost(
  messages: Array<{
    cost?: number
    inputTokens?: number
    outputTokens?: number
    cachedTokens?: number
  }>
): {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCachedTokens: number
} {
  const totals = messages.reduce(
    (acc, msg) => ({
      totalCost: acc.totalCost + (msg.cost || 0),
      totalInputTokens: acc.totalInputTokens + (msg.inputTokens || 0),
      totalOutputTokens: acc.totalOutputTokens + (msg.outputTokens || 0),
      totalCachedTokens: acc.totalCachedTokens + (msg.cachedTokens || 0),
    }),
    {
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCachedTokens: 0,
    }
  )

  return totals
}
