'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Brain, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThinkingDisplayProps {
  thinking: string
  className?: string
  defaultExpanded?: boolean
}

/**
 * Component to display model reasoning/thinking process
 * Shows in a collapsible section with syntax highlighting
 */
export function ThinkingDisplay({ thinking, className, defaultExpanded = false }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (!thinking || thinking.trim().length === 0) {
    return null
  }

  return (
    <div className={cn('my-2 rounded-lg border bg-muted/30', className)}>
      {/* Header - Clickable toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <Brain className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium text-muted-foreground">
          Model Thinking
        </span>
        <Sparkles className="w-3 h-3 text-purple-400 ml-auto" />
      </button>

      {/* Thinking content */}
      {isExpanded && (
        <div className="border-t bg-card/50">
          <div className="p-3 max-h-96 overflow-y-auto">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {thinking}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Extract thinking/reasoning content from model response
 * Supports various formats:
 * - <think>...</think> tags
 * - <reasoning>...</reasoning> tags
 * - Chain-of-thought markers
 */
export function extractThinking(content: string): { thinking: string; cleanContent: string } {
  // Pattern 1: <think>...</think> tags
  const thinkTagMatch = content.match(/<think>([\s\S]*?)<\/think>/i)
  if (thinkTagMatch) {
    return {
      thinking: thinkTagMatch[1].trim(),
      cleanContent: content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    }
  }

  // Pattern 2: <reasoning>...</reasoning> tags
  const reasoningTagMatch = content.match(/<reasoning>([\s\S]*?)<\/reasoning>/i)
  if (reasoningTagMatch) {
    return {
      thinking: reasoningTagMatch[1].trim(),
      cleanContent: content.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim()
    }
  }

  // Pattern 3: Markdown code blocks labeled as "thinking" or "reasoning"
  const codeBlockMatch = content.match(/```(?:thinking|reasoning)\n([\s\S]*?)```/)
  if (codeBlockMatch) {
    return {
      thinking: codeBlockMatch[1].trim(),
      cleanContent: content.replace(/```(?:thinking|reasoning)\n[\s\S]*?```/g, '').trim()
    }
  }

  // Pattern 4: Lines starting with "Thinking:" or "Reasoning:"
  const lines = content.split('\n')
  const thinkingLines: string[] = []
  const contentLines: string[] = []
  let inThinkingBlock = false

  for (const line of lines) {
    if (line.match(/^(Thinking|Reasoning):/i)) {
      inThinkingBlock = true
      thinkingLines.push(line.replace(/^(Thinking|Reasoning):\s*/i, ''))
    } else if (inThinkingBlock && line.trim() === '') {
      inThinkingBlock = false
      contentLines.push(line)
    } else if (inThinkingBlock) {
      thinkingLines.push(line)
    } else {
      contentLines.push(line)
    }
  }

  if (thinkingLines.length > 0) {
    return {
      thinking: thinkingLines.join('\n').trim(),
      cleanContent: contentLines.join('\n').trim()
    }
  }

  // No thinking content found
  return {
    thinking: '',
    cleanContent: content
  }
}
