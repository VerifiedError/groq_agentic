'use client'

import { useState } from 'react'
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatToolName, formatToolCost } from '@/lib/utils/groq-tool-costs'

interface ToolCostBreakdown {
  tool: string
  action?: string
  count?: number
  duration?: number
  cost: number
}

interface MessageCostBadgeProps {
  cost: number
  inputTokens: number
  outputTokens: number
  cachedTokens?: number
  toolCalls?: string | null
  className?: string
  showDetails?: boolean
}

export function MessageCostBadge({
  cost,
  inputTokens,
  outputTokens,
  cachedTokens = 0,
  toolCalls,
  className,
  showDetails = false,
}: MessageCostBadgeProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Don't show badge if cost is 0 (e.g., for user messages)
  if (cost === 0) return null

  const formattedCost = cost < 0.0001 ? '<$0.0001' : `$${cost.toFixed(4)}`

  // Parse tool calls to get breakdown
  let toolBreakdown: ToolCostBreakdown[] = []
  try {
    if (toolCalls) {
      const parsed = typeof toolCalls === 'string' ? JSON.parse(toolCalls) : toolCalls
      console.log('[MessageCostBadge] Parsed toolCalls:', parsed)
      toolBreakdown = parsed.breakdown || []
      console.log('[MessageCostBadge] Tool breakdown:', toolBreakdown)
    }
  } catch (e) {
    console.error('[MessageCostBadge] Failed to parse toolCalls:', e)
  }

  const hasToolCosts = toolBreakdown.length > 0
  const cacheHitRate = cachedTokens > 0 && inputTokens > 0
    ? ((cachedTokens / inputTokens) * 100).toFixed(1)
    : null

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      {/* Main Badge */}
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer',
          'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20',
          hasToolCosts && 'hover:bg-green-500/20'
        )}
        onClick={() => hasToolCosts && setShowBreakdown(!showBreakdown)}
        title={
          showDetails
            ? `Input: ${inputTokens} tokens, Output: ${outputTokens} tokens${cachedTokens > 0 ? `, Cached: ${cachedTokens} (${cacheHitRate}% hit rate)` : ''}${hasToolCosts ? ' (click for tool breakdown)' : ''}`
            : undefined
        }
      >
        <DollarSign className="w-3 h-3" />
        <span className="font-medium">{formattedCost}</span>
        {showDetails && (
          <span className="text-muted-foreground">
            ({inputTokens + outputTokens} tokens{cachedTokens > 0 ? `, ${cacheHitRate}% cached` : ''})
          </span>
        )}
        {hasToolCosts && (
          showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </div>

      {/* Tool Cost Breakdown */}
      {hasToolCosts && showBreakdown && (
        <div className="mt-1 p-2 bg-muted/50 border rounded text-xs space-y-1">
          <div className="font-medium text-muted-foreground mb-1">Cost Breakdown:</div>
          {toolBreakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <span className="text-foreground">{formatToolName(item.tool, item.action)}</span>
              <div className="flex items-center gap-2">
                {item.count !== undefined && (
                  <span className="text-muted-foreground">{item.count}x</span>
                )}
                {item.duration !== undefined && (
                  <span className="text-muted-foreground">{item.duration.toFixed(1)}s</span>
                )}
                <span className="font-mono text-green-700 dark:text-green-400">
                  {formatToolCost(item.cost)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
