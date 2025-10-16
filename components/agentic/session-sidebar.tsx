'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, X, Loader2, MessageSquare, DollarSign } from 'lucide-react'
import useAgenticSessionStore from '@/stores/agentic-session-store'
import { SessionListItem } from './session-list-item'
import { NewSessionButton } from './new-session-button'
import { cn } from '@/lib/utils'

interface SessionSidebarProps {
  className?: string
}

export function SessionSidebar({ className }: SessionSidebarProps) {
  const {
    sessions,
    activeSessionId,
    isLoading,
    error,
    fetchSessions,
    setActiveSession,
  } = useAgenticSessionStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)

  // Load sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Filter sessions based on search query
  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate total stats
  const totalCost = sessions.reduce((sum, s) => sum + s.totalCost, 0)
  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0)

  return (
    <div className={cn('flex flex-col h-full bg-card border-r', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Agentic Sessions</h2>
          <NewSessionButton
            onSessionCreated={() => {
              fetchSessions()
            }}
          />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="w-full pl-9 pr-9 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {sessions.length > 0 && (
        <div className="px-4 py-3 bg-muted/50 border-b">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{totalMessages} messages</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>${totalCost.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && sessions.length === 0 ? (
          // Loading State
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            </div>
          </div>
        ) : error ? (
          // Error State
          <div className="flex items-center justify-center py-12 px-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-sm text-destructive mb-2">Failed to load sessions</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <button
                onClick={() => fetchSessions()}
                className="mt-4 text-xs text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          // Empty State
          <div className="flex items-center justify-center py-12 px-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              {searchQuery ? (
                <>
                  <p className="text-sm font-medium mb-1">No sessions found</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different search term
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">No sessions yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first agentic session to get started
                  </p>
                  <NewSessionButton
                    variant="default"
                    onSessionCreated={() => {
                      fetchSessions()
                    }}
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          // Session List
          <div className="p-2 space-y-1">
            {filteredSessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onClick={() => setActiveSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
