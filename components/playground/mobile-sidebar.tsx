'use client'

import { useEffect, useRef } from 'react'
import { X, Search, PenSquare, MoreVertical, Trash2 } from 'lucide-react'
import { Z_INDEX, SIDEBAR_WIDTH } from '@/lib/breakpoints'

interface ChatSession {
  id: string
  title: string
  messages: any[]
  createdAt: Date
  updatedAt: Date
}

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  sessions: ChatSession[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onDeleteChat: (id: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function MobileSidebar({
  isOpen,
  onClose,
  sessions,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  searchQuery,
  onSearchChange,
}: MobileSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const startX = useRef<number>(0)
  const currentX = useRef<number>(0)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Swipe to close gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current

    // Only allow swiping left (negative diff)
    if (diff < 0 && sidebarRef.current) {
      sidebarRef.current.style.transform = `translateX(${diff}px)`
    }
  }

  const handleTouchEnd = () => {
    const diff = currentX.current - startX.current

    // If swiped more than 100px left, close the sidebar
    if (diff < -100) {
      onClose()
    }

    // Reset transform
    if (sidebarRef.current) {
      sidebarRef.current.style.transform = ''
    }
  }

  // Group sessions by date
  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const groups: Record<string, ChatSession[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      Older: [],
    }

    sessions.forEach((session) => {
      const sessionDate = new Date(session.updatedAt)
      if (sessionDate >= today) {
        groups.Today.push(session)
      } else if (sessionDate >= yesterday) {
        groups.Yesterday.push(session)
      } else if (sessionDate >= lastWeek) {
        groups['Previous 7 Days'].push(session)
      } else if (sessionDate >= lastMonth) {
        groups['Previous 30 Days'].push(session)
      } else {
        groups.Older.push(session)
      }
    })

    return groups
  }

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedSessions = groupSessionsByDate(filteredSessions)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
        style={{ zIndex: Z_INDEX.backdrop }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        ref={sidebarRef}
        className="fixed inset-y-0 left-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-transform duration-300 ease-in-out md:hidden"
        style={{
          width: SIDEBAR_WIDTH.mobile,
          zIndex: Z_INDEX.drawer,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-label="Chat history"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Chats
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={() => {
                onNewChat()
                onClose()
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              style={{ minHeight: 48 }} // Touch target
            >
              <PenSquare className="h-5 w-5" />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {Object.entries(groupedSessions).map(([group, groupSessions]) => {
              if (groupSessions.length === 0) return null

              return (
                <div key={group} className="mb-6">
                  <h3 className="px-2 mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {groupSessions.map((session) => (
                      <div key={session.id} className="relative group">
                        <button
                          onClick={() => {
                            onSelectChat(session.id)
                            onClose()
                          }}
                          className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                            activeChatId === session.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                          }`}
                          style={{ minHeight: 48 }} // Touch target
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="flex-1 text-sm font-medium truncate">
                              {session.title}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (window.confirm('Delete this chat?')) {
                                  onDeleteChat(session.id)
                                }
                              }}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-opacity"
                              aria-label="Delete chat"
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            {session.messages.length} messages
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {filteredSessions.length === 0 && (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
