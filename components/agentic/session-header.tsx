'use client'

import { DollarSign, MessageSquare, Brain, Sparkles, Settings } from 'lucide-react'
import useAgenticSessionStore from '@/stores/agentic-session-store'
import { cn } from '@/lib/utils'

interface SessionHeaderProps {
  className?: string
}

export function SessionHeader({ className }: SessionHeaderProps) {
  const { getActiveSession, messages } = useAgenticSessionStore()
  const activeSession = getActiveSession()

  if (!activeSession) {
    return (
      <div className={cn('p-4 border-b bg-card', className)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-muted-foreground">No Active Session</h1>
            <p className="text-sm text-muted-foreground">Create or select a session to get started</p>
          </div>
        </div>
      </div>
    )
  }

  const modelIcon = activeSession.model.includes('mini') ? Sparkles : Brain
  const ModelIcon = modelIcon

  return (
    <div className={cn('p-4 border-b bg-card', className)}>
      <div className="flex items-start justify-between gap-4">
        {/* Session Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-semibold truncate">{activeSession.title}</h1>
          </div>

          {/* Model Badge */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
              <ModelIcon className="w-3 h-3" />
              <span>{activeSession.model}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>{activeSession.messageCount} messages</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>${activeSession.totalCost.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cost Breakdown */}
          <div className="text-right text-xs">
            <div className="text-muted-foreground">Input: {activeSession.inputTokens.toLocaleString()} tokens</div>
            <div className="text-muted-foreground">Output: {activeSession.outputTokens.toLocaleString()} tokens</div>
          </div>
        </div>
      </div>
    </div>
  )
}
