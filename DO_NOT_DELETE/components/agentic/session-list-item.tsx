'use client'

import { useState } from 'react'
import { MessageSquare, DollarSign, MoreVertical, Trash2, Edit2, Check, X } from 'lucide-react'
import { AgenticSession } from '@/stores/agentic-session-store'
import useAgenticSessionStore from '@/stores/agentic-session-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SessionListItemProps {
  session: AgenticSession
  isActive: boolean
  onClick: () => void
}

export function SessionListItem({ session, isActive, onClick }: SessionListItemProps) {
  const { updateSessionTitle, deleteSessionById } = useAgenticSessionStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(session.title)
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== session.title) {
      await updateSessionTitle(session.id, editedTitle.trim())
      toast.success('Session renamed')
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedTitle(session.title)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteSessionById(session.id)
      toast.success('Session deleted')
    } catch (error) {
      toast.error('Failed to delete session')
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  const formattedCost = session.totalCost > 0 ? `$${session.totalCost.toFixed(4)}` : '$0'
  const messageCount = session._count?.messages ?? session.messageCount

  return (
    <div
      className={cn(
        'group relative rounded-lg p-3 cursor-pointer transition-all',
        'hover:bg-accent',
        isActive && 'bg-accent border-l-2 border-primary',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
      onClick={() => !isEditing && onClick()}
    >
      {/* Session Content */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            // Edit Mode
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                className="flex-1 px-2 py-1 text-sm bg-background border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-green-600 hover:bg-green-600/10 rounded"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-muted-foreground hover:bg-accent rounded"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // View Mode
            <>
              <div className="font-medium text-sm truncate mb-1">{session.title}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{messageCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>{formattedCost}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions Menu */}
        {!isEditing && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                'p-1 rounded transition-opacity',
                'opacity-0 group-hover:opacity-100',
                showMenu && 'opacity-100 bg-accent'
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 w-40 bg-popover border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-t-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Badge */}
      <div className="mt-2 text-xs text-muted-foreground truncate">
        {session.model}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(false)
          }}
        />
      )}
    </div>
  )
}
