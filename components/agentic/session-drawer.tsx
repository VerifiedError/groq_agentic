'use client'

import { useState, useMemo } from 'react'
import { X, Plus, Trash2, MessageSquare, Search } from 'lucide-react'
import { useSessionStore } from '@/stores/agentic-session-store'
import { formatDistanceToNow } from 'date-fns'

interface SessionDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function SessionDrawer({ isOpen, onClose }: SessionDrawerProps) {
  const {
    sessions,
    currentSessionId,
    setCurrentSession,
    createSession,
    deleteSession,
  } = useSessionStore()

  const [searchQuery, setSearchQuery] = useState('')

  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId)
    onClose()
  }

  const handleNewSession = () => {
    createSession('llama-3.3-70b-versatile')
    onClose()
  }

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (confirm('Delete this session?')) {
      deleteSession(sessionId)
    }
  }

  // Filter sessions based on search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions

    const query = searchQuery.toLowerCase()
    return sessions.filter((session) =>
      session.name.toLowerCase().includes(query) ||
      session.model.toLowerCase().includes(query) ||
      session.messages.some((msg) => msg.content.toLowerCase().includes(query))
    )
  }, [sessions, searchQuery])

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const today = new Date()
    const sessionDate = new Date(session.createdAt)

    let group: string
    if (sessionDate.toDateString() === today.toDateString()) {
      group = 'Today'
    } else if (sessionDate.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString()) {
      group = 'Yesterday'
    } else if (sessionDate > new Date(today.setDate(today.getDate() - 7))) {
      group = 'Last 7 Days'
    } else {
      group = 'Older'
    }

    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(session)
    return groups
  }, {} as Record<string, typeof sessions>)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-background border-r shadow-xl z-50 flex flex-col h-[100dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">Chat Sessions</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-4 border-b flex-shrink-0">
          <button
            onClick={handleNewSession}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedSessions).map(([group, groupSessions]) => (
            <div key={group} className="mb-4">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                {group}
              </div>
              <div className="space-y-1 px-2">
                {groupSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      session.id === currentSessionId
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.messages.length} messages • {session.model}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No sessions yet. Create your first chat!
              </p>
            </div>
          )}

          {searchQuery && filteredSessions.length === 0 && sessions.length > 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No sessions found matching "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t bg-muted/30 flex-shrink-0">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Total Sessions:</span>
              <span className="font-medium">{sessions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Cost:</span>
              <span className="font-medium">
                ${sessions.reduce((sum, s) => sum + s.totalCost, 0).toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
