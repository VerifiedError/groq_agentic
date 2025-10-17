'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronRight, Brain, Sparkles, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseReasoning, mergeReasoningUpdates, type ParsedReasoning } from '@/lib/reasoning-parser'
import { ReasoningCard, ReasoningCardSkeleton } from './reasoning-card'
import { extractKeyConcepts } from '@/lib/reasoning-highlighter'

interface ReasoningDisplayProps {
  reasoning: string
  isStreaming?: boolean
  className?: string
  defaultExpanded?: boolean
  onReasoningComplete?: () => void
}

/**
 * Enhanced reasoning display component with structured card-based layout
 * Replaces the old ThinkingDisplay with Google Gemini-style UI
 */
export function ReasoningDisplay({
  reasoning,
  isStreaming = false,
  className,
  defaultExpanded = false,
  onReasoningComplete,
}: ReasoningDisplayProps) {
  const [isGlobalExpanded, setIsGlobalExpanded] = useState(defaultExpanded)
  const [parsedReasoning, setParsedReasoning] = useState<ParsedReasoning>({
    sections: [],
    totalSteps: 0,
    isComplete: !isStreaming,
  })

  // Parse reasoning whenever it changes
  useEffect(() => {
    if (!reasoning || reasoning.trim().length === 0) {
      setParsedReasoning({
        sections: [],
        totalSteps: 0,
        isComplete: !isStreaming,
      })
      return
    }

    // Parse the reasoning into structured sections
    const parsed = parseReasoning(reasoning, isStreaming)
    setParsedReasoning(prev => mergeReasoningUpdates(prev, reasoning, isStreaming))

    // Call completion callback when streaming finishes
    if (!isStreaming && parsed.isComplete && onReasoningComplete) {
      onReasoningComplete()
    }
  }, [reasoning, isStreaming, onReasoningComplete])

  // Extract key concepts for header
  const keyConcepts = useMemo(() => {
    if (!reasoning) return []
    return extractKeyConcepts(reasoning)
  }, [reasoning])

  // Don't render if no reasoning
  if (!reasoning || reasoning.trim().length === 0) {
    return null
  }

  // Calculate total cards (including skeleton for streaming)
  const totalCards = parsedReasoning.sections.length + (isStreaming && !parsedReasoning.isComplete ? 1 : 0)

  return (
    <div className={cn(
      'reasoning-display my-3 rounded-xl border bg-gradient-to-br from-muted/30 to-muted/10',
      'shadow-sm transition-all duration-300',
      isStreaming && 'shadow-md border-purple-500/30',
      className
    )}>
      {/* Global Header */}
      <button
        onClick={() => setIsGlobalExpanded(!isGlobalExpanded)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3',
          'hover:bg-muted/50 transition-colors',
          'rounded-t-xl'
        )}
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0">
          {isGlobalExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Brain Icon */}
        <Brain className={cn(
          'w-5 h-5',
          isStreaming ? 'text-purple-500 animate-pulse' : 'text-purple-500'
        )} />

        {/* Title */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Model Thinking
            </span>
            {parsedReasoning.totalSteps > 0 && (
              <span className="text-xs text-muted-foreground">
                ({parsedReasoning.totalSteps} {parsedReasoning.totalSteps === 1 ? 'step' : 'steps'})
              </span>
            )}
          </div>

          {/* Key concepts badge */}
          {keyConcepts.length > 0 && !isGlobalExpanded && (
            <div className="flex items-center gap-1.5 mt-1">
              {keyConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <>
              <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </>
          ) : (
            <Sparkles className="w-4 h-4 text-purple-400" />
          )}
        </div>
      </button>

      {/* Reasoning Cards */}
      {isGlobalExpanded && (
        <div className="border-t bg-card/30 p-3 space-y-2 rounded-b-xl">
          {parsedReasoning.sections.length === 0 && !isStreaming ? (
            // Empty state (shouldn't normally happen)
            <div className="text-center py-4 text-sm text-muted-foreground">
              No reasoning steps detected
            </div>
          ) : (
            <>
              {/* Existing reasoning cards */}
              {parsedReasoning.sections.map((section, idx) => (
                <ReasoningCard
                  key={section.id}
                  section={section}
                  isStreaming={isStreaming && idx === parsedReasoning.sections.length - 1}
                  defaultExpanded={isStreaming ? idx === parsedReasoning.sections.length - 1 : false}
                  animationDelay={idx * 100}
                  className="reasoning-card-animate"
                />
              ))}

              {/* Skeleton loader for next card while streaming */}
              {isStreaming && !parsedReasoning.isComplete && (
                <ReasoningCardSkeleton className="reasoning-card-animate" />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact reasoning preview for collapsed messages
 * Shows just the first sentence or key concept
 */
export function ReasoningPreview({ reasoning, className }: { reasoning: string; className?: string }) {
  const keyConcepts = useMemo(() => extractKeyConcepts(reasoning), [reasoning])
  const firstSentence = reasoning.split(/[.!?]/)[0].trim()
  const preview = firstSentence.length > 80 ? firstSentence.substring(0, 80) + '...' : firstSentence

  if (!reasoning || reasoning.trim().length === 0) {
    return null
  }

  return (
    <div className={cn(
      'reasoning-preview flex items-center gap-2 px-3 py-2',
      'rounded-lg border bg-muted/20',
      'text-xs text-muted-foreground',
      className
    )}>
      <Brain className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
      <span className="flex-1 truncate">{preview}</span>
      {keyConcepts.length > 0 && (
        <div className="flex gap-1">
          {keyConcepts.slice(0, 2).map((concept, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400"
            >
              {concept}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
