'use client'

import { formatCost, formatTokens } from '@/lib/cost-calculator'
import { DollarSign, Activity } from 'lucide-react'

interface MessageCostBadgeProps {
  cost?: number
  inputTokens?: number
  outputTokens?: number
  cachedTokens?: number
}

export function MessageCostBadge({
  cost,
  inputTokens,
  outputTokens,
  cachedTokens,
}: MessageCostBadgeProps) {
  // Don't show badge if no cost data
  if (cost === undefined && !inputTokens && !outputTokens) {
    return null
  }

  const totalTokens = (inputTokens || 0) + (outputTokens || 0)
  const hasCachedTokens = cachedTokens && cachedTokens > 0

  return (
    <div className="group relative inline-block">
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-xs cursor-help">
        {cost !== undefined && cost > 0 ? (
          <>
            <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="font-medium text-foreground">
              {formatCost(cost)}
            </span>
          </>
        ) : (
          <>
            <Activity className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-foreground">
              {formatTokens(totalTokens)} tokens
            </span>
          </>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
        <div className="space-y-1 text-xs">
          {cost !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-medium text-foreground">{formatCost(cost)}</span>
            </div>
          )}
          {inputTokens !== undefined && inputTokens > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Input:</span>
              <span className="font-medium text-foreground">{formatTokens(inputTokens)} tokens</span>
            </div>
          )}
          {outputTokens !== undefined && outputTokens > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Output:</span>
              <span className="font-medium text-foreground">{formatTokens(outputTokens)} tokens</span>
            </div>
          )}
          {hasCachedTokens && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Cached:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatTokens(cachedTokens)} tokens
              </span>
            </div>
          )}
          {totalTokens > 0 && (
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/50">
              <span className="text-muted-foreground font-medium">Total:</span>
              <span className="font-semibold text-foreground">{formatTokens(totalTokens)} tokens</span>
            </div>
          )}
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="border-4 border-transparent border-t-popover" />
        </div>
      </div>
    </div>
  )
}
