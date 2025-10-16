'use client'

import { useState } from 'react'
import { Plus, X, Brain, Sparkles, Loader2 } from 'lucide-react'
import useAgenticSessionStore from '@/stores/agentic-session-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const AGENTIC_MODELS = [
  {
    id: 'groq/compound',
    name: 'Groq Compound',
    description: 'Production agentic system with web search, code execution, and browser automation',
    icon: Brain,
    speed: 'Fast',
    features: ['Web Search', 'Code Execution', 'Browser Automation'],
  },
  {
    id: 'groq/compound-mini',
    name: 'Groq Compound Mini',
    description: 'Lightweight agentic system for faster responses',
    icon: Sparkles,
    speed: 'Very Fast',
    features: ['Web Search', 'Code Execution'],
  },
]

interface NewSessionButtonProps {
  variant?: 'icon' | 'default'
  onSessionCreated?: () => void
}

export function NewSessionButton({ variant = 'icon', onSessionCreated }: NewSessionButtonProps) {
  const { createSession } = useAgenticSessionStore()
  const [showModal, setShowModal] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AGENTIC_MODELS[0].id)
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!selectedModel) {
      toast.error('Please select a model')
      return
    }

    setIsCreating(true)
    try {
      const session = await createSession({
        title: title.trim() || 'New Agentic Session',
        model: selectedModel,
      })

      if (session) {
        toast.success('Session created')
        setShowModal(false)
        setTitle('')
        onSessionCreated?.()
      } else {
        toast.error('Failed to create session')
      }
    } catch (error) {
      toast.error('Failed to create session')
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <>
      {/* Button */}
      {variant === 'icon' ? (
        <button
          onClick={() => setShowModal(true)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          title="New Session"
        >
          <Plus className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card border rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">New Agentic Session</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Session Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Session Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Research Project, Code Review, etc."
                  className="w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use default title
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Select Model
                </label>
                <div className="grid gap-3">
                  {AGENTIC_MODELS.map((model) => {
                    const Icon = model.icon
                    const isSelected = selectedModel === model.id

                    return (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={cn(
                          'flex items-start gap-4 p-4 border-2 rounded-lg text-left transition-all',
                          'hover:border-primary/50',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        )}
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            isSelected ? 'bg-primary/20 text-primary' : 'bg-muted'
                          )}
                        >
                          <Icon className="w-6 h-6" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{model.name}</h3>
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {model.speed}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {model.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {model.features.map((feature) => (
                              <span
                                key={feature}
                                className="text-xs px-2 py-1 bg-muted rounded"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                disabled={isCreating}
                className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
