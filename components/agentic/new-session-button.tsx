'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Brain, Sparkles, Loader2, Eye, Zap, RefreshCw } from 'lucide-react'
import useAgenticSessionStore from '@/stores/agentic-session-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Model {
  id: string
  displayName: string
  contextWindow: number
  inputPricing: number
  outputPricing: number
  isVision: boolean
  isActive: boolean
}

const FALLBACK_MODELS = [
  {
    id: 'groq/compound',
    name: 'Groq Compound',
    description: 'Production agentic system with web search, code execution, and browser automation',
    icon: Brain,
    speed: 'Fast',
    features: ['Web Search', 'Code Execution', 'Browser Automation'],
    category: 'Agentic',
  },
  {
    id: 'groq/compound-mini',
    name: 'Groq Compound Mini',
    description: 'Lightweight agentic system for faster responses',
    icon: Sparkles,
    speed: 'Very Fast',
    features: ['Web Search', 'Code Execution'],
    category: 'Agentic',
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout (17B)',
    description: 'Fast vision-capable model for image understanding and analysis',
    icon: Eye,
    speed: 'Fast',
    features: ['Vision', 'Image Analysis', 'Text Generation'],
    category: 'Vision',
    pricing: '$0.11 / $0.34 per 1M tokens',
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick (17B)',
    description: 'Advanced vision model with enhanced understanding capabilities',
    icon: Eye,
    speed: 'Fast',
    features: ['Vision', 'Image Analysis', 'Advanced Understanding'],
    category: 'Vision',
    pricing: '$0.20 / $0.60 per 1M tokens',
  },
  {
    id: 'llama-3.2-11b-vision-preview',
    name: 'Llama 3.2 Vision 11B',
    description: 'Efficient vision model for image understanding',
    icon: Eye,
    speed: 'Fast',
    features: ['Vision', 'Image Analysis', 'Text Generation'],
    category: 'Vision',
    pricing: '$0.18 / $0.18 per 1M tokens',
  },
  {
    id: 'llama-3.2-90b-vision-preview',
    name: 'Llama 3.2 Vision 90B',
    description: 'High-performance vision model with superior understanding',
    icon: Eye,
    speed: 'Moderate',
    features: ['Vision', 'Advanced Image Analysis', 'Complex Understanding'],
    category: 'Vision',
    pricing: '$0.90 / $0.90 per 1M tokens',
  },
  {
    id: 'llava-v1.5-7b-4096-preview',
    name: 'LLaVA v1.5 7B',
    description: 'Free vision model for basic image understanding',
    icon: Eye,
    speed: 'Fast',
    features: ['Vision', 'Image Analysis', 'Free'],
    category: 'Vision',
    pricing: 'Free',
  },
]

interface NewSessionButtonProps {
  variant?: 'icon' | 'default'
  onSessionCreated?: () => void
}

export function NewSessionButton({ variant = 'icon', onSessionCreated }: NewSessionButtonProps) {
  const { createSession } = useAgenticSessionStore()
  const [showModal, setShowModal] = useState(false)
  const [selectedModel, setSelectedModel] = useState('groq/compound')
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch models from API
  const fetchModels = async () => {
    try {
      setIsLoadingModels(true)
      const response = await fetch('/api/models')
      if (!response.ok) throw new Error('Failed to fetch models')

      const data = await response.json()
      setModels(data.models || [])

      // Set default selection to first model if not set
      if (data.models && data.models.length > 0 && !selectedModel) {
        setSelectedModel(data.models[0].id)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
      toast.error('Failed to load models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  // Refresh models from Groq API
  const handleRefreshModels = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/models/refresh', { method: 'POST' })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to refresh models')
      }

      const data = await response.json()
      toast.success(`Successfully synced ${data.count} models from Groq`)

      // Reload models
      await fetchModels()
    } catch (error: any) {
      console.error('Error refreshing models:', error)
      toast.error(error.message || 'Failed to refresh models')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Load models on mount
  useEffect(() => {
    fetchModels()
  }, [])

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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshModels}
                  disabled={isRefreshing}
                  className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh models from Groq API"
                >
                  <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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

                {isLoadingModels ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">No models available</p>
                    <button
                      onClick={handleRefreshModels}
                      className="text-primary hover:underline"
                    >
                      Refresh models from Groq API
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Agentic Models Section */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Agentic Models</h3>
                      <div className="grid gap-3">
                        {models.filter(m => !m.isVision).map((model) => {
                          const fallbackModel = FALLBACK_MODELS.find(f => f.id === model.id)
                          const Icon = fallbackModel?.icon || Brain
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
                                  <h3 className="font-semibold">{model.displayName}</h3>
                                  {fallbackModel?.speed && (
                                    <span
                                      className={cn(
                                        'text-xs px-2 py-0.5 rounded-full',
                                        isSelected
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground'
                                      )}
                                    >
                                      {fallbackModel.speed}
                                    </span>
                                  )}
                                </div>
                                {fallbackModel?.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {fallbackModel.description}
                                  </p>
                                )}
                                {fallbackModel?.features && (
                                  <div className="flex flex-wrap gap-2">
                                    {fallbackModel.features.map((feature) => (
                                      <span
                                        key={feature}
                                        className="text-xs px-2 py-1 bg-muted rounded"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {model.contextWindow && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Context: {(model.contextWindow / 1000).toFixed(0)}K tokens
                                  </p>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Vision Models Section */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Vision Models (Image Upload Support)</h3>
                      <div className="grid gap-3">
                        {models.filter(m => m.isVision).map((model) => {
                          const fallbackModel = FALLBACK_MODELS.find(f => f.id === model.id)
                          const Icon = fallbackModel?.icon || Eye
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
                                  <h3 className="font-semibold">{model.displayName}</h3>
                                  {fallbackModel?.speed && (
                                    <span
                                      className={cn(
                                        'text-xs px-2 py-0.5 rounded-full',
                                        isSelected
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground'
                                      )}
                                    >
                                      {fallbackModel.speed}
                                    </span>
                                  )}
                                </div>
                                {fallbackModel?.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {fallbackModel.description}
                                  </p>
                                )}
                                {fallbackModel?.features && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {fallbackModel.features.map((feature) => (
                                      <span
                                        key={feature}
                                        className="text-xs px-2 py-1 bg-muted rounded"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {model.inputPricing > 0 || model.outputPricing > 0
                                    ? `$${model.inputPricing} / $${model.outputPricing} per 1M tokens`
                                    : 'Free'
                                  }
                                </p>
                                {model.contextWindow && (
                                  <p className="text-xs text-muted-foreground">
                                    Context: {(model.contextWindow / 1000).toFixed(0)}K tokens
                                  </p>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
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
