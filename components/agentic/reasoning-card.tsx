'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ReasoningSection } from '@/lib/reasoning-parser'
import { highlightReasoningText, formatReasoningText, type HighlightedSegment } from '@/lib/reasoning-highlighter'

interface ReasoningCardProps {
  section: ReasoningSection
  isStreaming?: boolean
  defaultExpanded?: boolean
  className?: string
  animationDelay?: number
}

/**
 * Individual reasoning step card component
 * Displays a single section of the reasoning process with collapsible content
 */
export function ReasoningCard({
  section,
  isStreaming = false,
  defaultExpanded = true,
  className,
  animationDelay = 0,
}: ReasoningCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Format and highlight the content
  const formattedContent = formatReasoningText(section.content)
  const highlightedSegments = highlightReasoningText(formattedContent)

  // Get type-specific styling
  const typeStyles = getTypeStyles(section.type)

  // Determine if this card is actively streaming (incomplete)
  const isActivelyStreaming = isStreaming && !section.isComplete

  return (
    <div
      className={cn(
        'reasoning-card rounded-lg border transition-all duration-300',
        'hover:shadow-md',
        isActivelyStreaming && 'reasoning-card-streaming shadow-lg',
        section.isComplete && 'reasoning-card-complete',
        className
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Card Header - Clickable toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3',
          'hover:bg-muted/30 transition-colors',
          'rounded-t-lg',
          isExpanded && 'border-b'
        )}
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform" />
          )}
        </div>

        {/* Step Number Badge (if applicable) */}
        {section.stepNumber !== undefined && (
          <div className={cn(
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
            typeStyles.badgeClass
          )}>
            {section.stepNumber}
          </div>
        )}

        {/* Section Title */}
        <div className="flex-1 text-left">
          <span className={cn(
            'text-sm font-medium',
            typeStyles.titleClass
          )}>
            {section.title}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex-shrink-0">
          {isActivelyStreaming ? (
            <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
          ) : section.isComplete ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : null}
        </div>
      </button>

      {/* Card Content - Expandable */}
      {isExpanded && (
        <div className={cn(
          'px-4 py-3 bg-card/50',
          'reasoning-card-content',
          isActivelyStreaming && 'reasoning-card-content-streaming'
        )}>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-muted-foreground leading-relaxed m-0">
              {highlightedSegments.map((segment, idx) => (
                <span
                  key={idx}
                  className={getSegmentClassName(segment.type)}
                >
                  {segment.text}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* Streaming Progress Bar */}
      {isActivelyStreaming && (
        <div className="h-1 bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse-progress" />
        </div>
      )}
    </div>
  )
}

/**
 * Get styling classes based on section type
 */
function getTypeStyles(type: ReasoningSection['type']): {
  badgeClass: string
  titleClass: string
} {
  switch (type) {
    case 'question':
      return {
        badgeClass: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
        titleClass: 'text-blue-700 dark:text-blue-300',
      }
    case 'analysis':
      return {
        badgeClass: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
        titleClass: 'text-purple-700 dark:text-purple-300',
      }
    case 'consideration':
      return {
        badgeClass: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
        titleClass: 'text-yellow-700 dark:text-yellow-300',
      }
    case 'conclusion':
      return {
        badgeClass: 'bg-green-500/20 text-green-600 dark:text-green-400',
        titleClass: 'text-green-700 dark:text-green-300',
      }
    case 'step':
    default:
      return {
        badgeClass: 'bg-primary/20 text-primary',
        titleClass: 'text-foreground',
      }
  }
}

/**
 * Get className for highlighted text segment
 */
function getSegmentClassName(type: HighlightedSegment['type']): string {
  switch (type) {
    case 'technical':
      return 'font-semibold text-purple-600 dark:text-purple-400'
    case 'keyword':
      return 'font-medium text-blue-600 dark:text-blue-400'
    case 'emphasis':
      return 'font-semibold text-foreground'
    case 'question':
      return 'text-orange-600 dark:text-orange-400'
    case 'normal':
    default:
      return ''
  }
}

/**
 * Skeleton loader for reasoning card while streaming starts
 */
export function ReasoningCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'reasoning-card rounded-lg border bg-card/50',
      'animate-pulse',
      className
    )}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-4 h-4 bg-muted rounded" />
        <div className="w-6 h-6 bg-muted rounded-full" />
        <div className="flex-1 h-4 bg-muted rounded" />
        <div className="w-4 h-4 bg-muted rounded-full" />
      </div>
    </div>
  )
}
