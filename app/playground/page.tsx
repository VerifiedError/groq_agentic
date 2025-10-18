'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Image as ImageIcon,
  Monitor,
  Layout,
  Grid3x3,
  Box,
  Settings,
  Paperclip,
  Wand2,
  Globe,
  ArrowUp,
  Menu,
  PenSquare,
  Plus,
  Command,
  Search,
  MoreVertical,
  Loader2,
  Star,
  Sliders,
  MoreHorizontal,
  RefreshCw,
  ArrowUpDown,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { ArtifactViewer } from '@/components/playground/artifact-viewer'
import { ArtifactButton } from '@/components/playground/artifact-button'
import { ArtifactCard } from '@/components/playground/artifact-card'
import { WorkspaceIDE } from '@/components/playground/workspace-ide'
import { ReasoningDisplay } from '@/components/agentic/reasoning-display'
import { extractThinkTags } from '@/lib/reasoning-parser'
import { ModelSettingsPopover } from '@/components/playground/model-settings-popover'
import { ModelSettingsModal } from '@/components/playground/model-settings-modal'
import { ArtifactTemplate, ArtifactType } from '@/lib/artifact-templates'
import { extractArtifactsFromResponse } from '@/lib/code-detector'
import { parseArtifactResponse } from '@/lib/artifact-parser'
import { ARTIFACT_GENERATION_SYSTEM_PROMPT } from '@/lib/artifact-system-prompts'
import { detectProvider, getProviderIcon, getProviderColor } from '@/lib/provider-utils'

interface Model {
  id: string
  displayName: string
  contextWindow: number
  inputPricing: number
  outputPricing: number
  isVision: boolean
  isActive: boolean
}

interface ModelResponse {
  modelId: string
  content: string
  reasoning?: string // Model reasoning/thinking process (for reasoning models)
  cost?: number
  toolCalls?: any[]
  audioData?: string // Base64 audio data for TTS models
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string // Model reasoning/thinking process
  cost?: number
  timestamp: Date
  responses?: ModelResponse[] // For multi-model assistant messages
  artifactIds?: string[] // Associated artifact IDs
}

interface Artifact {
  id: string
  type: ArtifactType
  title: string
  description?: string
  files: Record<string, string>
  dependencies?: Record<string, string>
  createdAt: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  model: string
  sessionPrompt: string
  artifacts: Artifact[]
  createdAt: Date
  updatedAt: Date
}

export default function PlaygroundChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Models
  const [models, setModels] = useState<Model[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [modelSearchQuery, setModelSearchQuery] = useState('')
  const [editingModelIndex, setEditingModelIndex] = useState<number | null>(null)
  const [favoriteModels, setFavoriteModels] = useState<string[]>([])
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<string | null>(null)
  const [modelSortBy, setModelSortBy] = useState<'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc' | 'context-asc' | 'context-desc' | 'recent' | 'favorites'>('favorites')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Model Settings
  const [modelSettings, setModelSettings] = useState<Record<string, {
    enabled: boolean
    reasoning: boolean
    temperature: number
    maxTokens: number
    topP: number
    chatMemory: number
    formattingRules: string
    systemPrompt: string
    label: string
    fileParserEngine: 'auto' | 'markdown' | 'pdf' | 'code' | 'json-yaml' | 'plain-text'
    provider: 'auto' | 'groq' | 'openrouter' | 'openai' | 'anthropic' | 'google' | 'mistral' | 'cohere'
  }>>({})
  const [openSettingsPopover, setOpenSettingsPopover] = useState<string | null>(null)
  const [openSettingsModal, setOpenSettingsModal] = useState<string | null>(null)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({})
  const [attachments, setAttachments] = useState<Array<{ data: string; name: string; type: string }>>([])

  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [temperature, setTemperature] = useState(1)
  const [maxTokens, setMaxTokens] = useState(1024)
  const [topP, setTopP] = useState(1)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)

  // Prompts
  const [systemPrompt, setSystemPrompt] = useState(ARTIFACT_GENERATION_SYSTEM_PROMPT)
  const [sessionPrompt, setSessionPrompt] = useState('')
  const [editingSessionPrompt, setEditingSessionPrompt] = useState(false)
  const [showSystemPromptSettings, setShowSystemPromptSettings] = useState(false)
  const [expandedSessionPromptEditor, setExpandedSessionPromptEditor] = useState(false)

  // Artifacts
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null)
  const [tempSessionPrompt, setTempSessionPrompt] = useState('')

  // Workspace Builder
  const [showWorkspaceBuilder, setShowWorkspaceBuilder] = useState(false)
  const [workspaceRequest, setWorkspaceRequest] = useState('')

  // Chat actions
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null)
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const modelPillsRef = useRef<HTMLDivElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Load models and favorites
  useEffect(() => {
    if (status === 'authenticated') {
      fetchModels()
      fetchFavorites()
      // Load sort preference
      const savedSort = localStorage.getItem('playground-model-sort')
      if (savedSort) {
        setModelSortBy(savedSort as typeof modelSortBy)
      }
    }
  }, [status])

  // Save sort preference
  useEffect(() => {
    localStorage.setItem('playground-model-sort', modelSortBy)
  }, [modelSortBy])

  // Load chat sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('playground-chat-sessions')
      if (saved) {
        const parsed = JSON.parse(saved)
        const sessions = parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          artifacts: s.artifacts || [], // Initialize empty artifacts for backward compatibility
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }))
        setChatSessions(sessions)
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error)
    }
  }, [])

  // Save chat sessions to localStorage
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('playground-chat-sessions', JSON.stringify(chatSessions))
    }
  }, [chatSessions])

  // Load/Save system prompt from/to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('playground-system-prompt')
    // Only use saved prompt if it exists and is not the old default
    if (saved && saved !== 'You are a helpful AI assistant.') {
      setSystemPrompt(saved)
    } else {
      // Use the new artifact generation prompt as default
      setSystemPrompt(ARTIFACT_GENERATION_SYSTEM_PROMPT)
      localStorage.setItem('playground-system-prompt', ARTIFACT_GENERATION_SYSTEM_PROMPT)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('playground-system-prompt', systemPrompt)
  }, [systemPrompt])

  // Load active chat messages and prompts
  useEffect(() => {
    if (activeChatId) {
      const activeChat = chatSessions.find(s => s.id === activeChatId)
      if (activeChat) {
        setMessages(activeChat.messages)
        setSelectedModels([activeChat.model])
        setSessionPrompt(activeChat.sessionPrompt || '')
        setArtifacts(activeChat.artifacts || [])
      }
    } else {
      setArtifacts([])
    }
  }, [activeChatId, chatSessions])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Click outside handler for model dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showModelDropdown &&
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node) &&
        modelPillsRef.current &&
        !modelPillsRef.current.contains(event.target as Node)
      ) {
        setShowModelDropdown(false)
        setModelSearchQuery('')
        setEditingModelIndex(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModelDropdown])

  // ESC key to close model dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModelDropdown) {
        setShowModelDropdown(false)
        setModelSearchQuery('')
        setEditingModelIndex(null)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showModelDropdown])

  const fetchModels = async () => {
    try {
      setIsLoadingModels(true)
      const response = await fetch('/api/models')
      const data = await response.json()
      setModels(data.models || [])
      if (data.models?.length > 0 && selectedModels.length === 0) {
        setSelectedModels([data.models[0].id])
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      toast.error('Failed to load models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const refreshModels = async () => {
    try {
      setIsLoadingModels(true)
      toast.info('Refreshing models from Groq API...')
      const response = await fetch('/api/models/refresh', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh models')
      }

      toast.success(`Refreshed ${data.count} models with pricing`)
      await fetchModels() // Reload the models list
    } catch (error: any) {
      console.error('Failed to refresh models:', error)
      toast.error(error.message || 'Failed to refresh models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/users/favorites')
      const data = await response.json()
      setFavoriteModels(data.favorites || [])
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    }
  }

  const toggleFavorite = async (modelId: string) => {
    try {
      setIsTogglingFavorite(modelId)
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      })
      const data = await response.json()

      if (data.success) {
        setFavoriteModels(data.favorites)
        toast.success(
          data.action === 'added'
            ? `Added to favorites`
            : `Removed from favorites`
        )
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      toast.error('Failed to update favorite')
    } finally {
      setIsTogglingFavorite(null)
    }
  }

  // Initialize default settings for a model
  const getDefaultModelSettings = (modelId: string) => ({
    enabled: true,
    reasoning: false,
    temperature: 1,
    maxTokens: 1024,
    topP: 1,
    chatMemory: 8,
    formattingRules: '',
    systemPrompt: '',
    label: models.find(m => m.id === modelId)?.displayName || modelId,
    fileParserEngine: 'auto' as const,
    provider: 'auto' as const
  })

  // Get settings for a model (or return defaults)
  const getModelSettings = (modelId: string) => {
    if (!modelSettings[modelId]) {
      const defaults = getDefaultModelSettings(modelId)
      setModelSettings(prev => ({ ...prev, [modelId]: defaults }))
      return defaults
    }
    return modelSettings[modelId]
  }

  // Update settings for a specific model
  const updateModelSettings = (modelId: string, settings: Partial<typeof modelSettings[string]>) => {
    setModelSettings(prev => ({
      ...prev,
      [modelId]: { ...getModelSettings(modelId), ...settings }
    }))
  }

  // Apply settings to all selected models
  const applySettingsToAll = (settings: Partial<typeof modelSettings[string]>) => {
    const updates: typeof modelSettings = {}
    selectedModels.forEach(modelId => {
      updates[modelId] = { ...getModelSettings(modelId), ...settings }
    })
    setModelSettings(prev => ({ ...prev, ...updates }))
    toast.success('Settings applied to all models')
  }

  // Reset settings for a model
  const resetModelSettings = (modelId: string) => {
    setModelSettings(prev => ({
      ...prev,
      [modelId]: getDefaultModelSettings(modelId)
    }))
    toast.success('Settings reset to defaults')
  }

  // Duplicate a model
  const duplicateModel = (modelId: string) => {
    setSelectedModels(prev => [...prev, modelId])
    // Copy settings to the new instance
    const settings = getModelSettings(modelId)
    const newKey = `${modelId}-${Date.now()}`
    setModelSettings(prev => ({
      ...prev,
      [newKey]: { ...settings, label: `${settings.label} (Copy)` }
    }))
    toast.success('Model duplicated')
  }

  // Filter and sort models based on search query and sort preference
  const filteredModels = models
    .filter(model =>
      model.displayName.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aIsFavorite = favoriteModels.includes(a.id)
      const bIsFavorite = favoriteModels.includes(b.id)

      // Calculate total cost (input + output) for cost sorting
      const aCost = a.inputPricing + a.outputPricing
      const bCost = b.inputPricing + b.outputPricing

      switch (modelSortBy) {
        case 'name-asc':
          return a.displayName.localeCompare(b.displayName)

        case 'name-desc':
          return b.displayName.localeCompare(a.displayName)

        case 'cost-asc':
          // Free models first, then by cost
          if (aCost === 0 && bCost !== 0) return -1
          if (aCost !== 0 && bCost === 0) return 1
          return aCost - bCost

        case 'cost-desc':
          return bCost - aCost

        case 'context-asc':
          return a.contextWindow - b.contextWindow

        case 'context-desc':
          return b.contextWindow - a.contextWindow

        case 'recent':
          // TODO: Implement recent usage tracking
          // For now, fall back to alphabetical
          return a.displayName.localeCompare(b.displayName)

        case 'favorites':
        default:
          // Favorites first, then alphabetically
          if (aIsFavorite && !bIsFavorite) return -1
          if (!aIsFavorite && bIsFavorite) return 1
          return a.displayName.localeCompare(b.displayName)
      }
    })

  // Handle model selection from dropdown
  const handleSelectModel = (modelId: string) => {
    if (editingModelIndex !== null) {
      // Replace the model at the editing index
      setSelectedModels(prev => {
        const newModels = [...prev]
        newModels[editingModelIndex] = modelId
        return newModels
      })
      toast.success(`Switched to ${models.find(m => m.id === modelId)?.displayName}`)
    } else {
      // Add new model
      if (!selectedModels.includes(modelId)) {
        setSelectedModels(prev => [...prev, modelId])
        toast.success(`Added ${models.find(m => m.id === modelId)?.displayName}`)
      }
    }
    setShowModelDropdown(false)
    setModelSearchQuery('')
    setEditingModelIndex(null)
  }

  const createNewChat = () => {
    // Ensure we have a model selected
    const modelToUse = selectedModels.length > 0 ? selectedModels[0] : models[0]?.id || ''

    const newChat: ChatSession = {
      id: `chat-${Date.now()}`,
      title: 'Untitled Chat',
      messages: [],
      model: modelToUse,
      sessionPrompt: '',
      artifacts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setChatSessions(prev => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setMessages([])
    setInput('')
    setStreamingContent({})
    setSessionPrompt('')

    // Set the model if not already set
    if (selectedModels.length === 0 && modelToUse) {
      setSelectedModels([modelToUse])
    }
  }

  const handleDeleteChat = (chatId: string) => {
    setChatSessions(prev => prev.filter(c => c.id !== chatId))
    if (activeChatId === chatId) {
      // If we're deleting the active chat, switch to the first remaining chat or create new
      const remaining = chatSessions.filter(c => c.id !== chatId)
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id)
        setMessages(remaining[0].messages)
        setSelectedModels([remaining[0].model])
      } else {
        createNewChat()
      }
    }
    setOpenMenuChatId(null)
    toast.success('Chat deleted')
  }

  const handleStartRename = (chat: ChatSession) => {
    setRenamingChatId(chat.id)
    setRenameValue(chat.title)
    setOpenMenuChatId(null)
  }

  const handleFinishRename = () => {
    if (!renamingChatId || !renameValue.trim()) {
      setRenamingChatId(null)
      return
    }
    setChatSessions(prev =>
      prev.map(chat =>
        chat.id === renamingChatId
          ? { ...chat, title: renameValue.trim(), updatedAt: new Date() }
          : chat
      )
    )
    setRenamingChatId(null)
    setRenameValue('')
    toast.success('Chat renamed')
  }

  const handleCancelRename = () => {
    setRenamingChatId(null)
    setRenameValue('')
  }

  const handleSessionPromptSave = (promptValue?: string) => {
    if (!activeChatId) return

    const promptToSave = promptValue !== undefined ? promptValue : sessionPrompt

    setChatSessions(prev =>
      prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, sessionPrompt: promptToSave, updatedAt: new Date() }
          : chat
      )
    )
    setEditingSessionPrompt(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Limit to 5 images total
    if (attachments.length + files.length > 5) {
      toast.error('Maximum 5 images per message')
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        continue
      }

      // Validate file size (4MB max for base64)
      if (file.size > 4 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 4MB)`)
        continue
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64Data = event.target?.result as string
        setAttachments(prev => [
          ...prev,
          {
            data: base64Data,
            name: file.name,
            type: file.type
          }
        ])
      }
      reader.readAsDataURL(file)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Artifact management
  const handleCreateArtifact = (template: ArtifactTemplate, customTitle?: string) => {
    const newArtifact: Artifact = {
      id: `artifact-${Date.now()}`,
      type: template.type,
      title: customTitle || template.title,
      description: template.description,
      files: template.files,
      dependencies: template.dependencies,
      createdAt: new Date()
    }

    setArtifacts(prev => [...prev, newArtifact])

    // Add to active chat session
    if (activeChatId) {
      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, artifacts: [...chat.artifacts, newArtifact], updatedAt: new Date() }
            : chat
        )
      )
    }

    // Open the artifact viewer
    setActiveArtifactId(newArtifact.id)
    toast.success(`Artifact "${newArtifact.title}" created`)
  }

  const handleDeleteArtifact = (artifactId: string) => {
    setArtifacts(prev => prev.filter(a => a.id !== artifactId))

    // Remove from active chat session
    if (activeChatId) {
      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, artifacts: chat.artifacts.filter(a => a.id !== artifactId), updatedAt: new Date() }
            : chat
        )
      )
    }

    setActiveArtifactId(null)
  }

  const handleSubmit = async () => {
    if ((!input.trim() && attachments.length === 0) || isGenerating || selectedModels.length === 0) return

    // Construct message content
    let messageContent: any = input.trim()
    if (attachments.length > 0) {
      // Multi-modal message with images
      messageContent = [
        { type: 'text', text: input.trim() || 'What\'s in this image?' },
        ...attachments.map(att => ({
          type: 'image_url',
          image_url: {
            url: att.data
          }
        }))
      ]
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim() || 'What\'s in this image?',
      timestamp: new Date()
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setAttachments([])
    setIsGenerating(true)
    setStreamingContent({})

    try {
      // Create response tracking
      const modelResponses: Record<string, { content: string; cost: number; toolCalls: any[] }> = {}

      // Start concurrent streams for all selected models
      const streamPromises = selectedModels.map(async (modelId) => {
        try {
          // Get model-specific settings
          const settings = getModelSettings(modelId)
          const { temperature: modelTemp, maxTokens: modelMaxTokens, topP: modelTopP, chatMemory, formattingRules } = settings

          // Construct messages array with system prompts
          const apiMessages: any[] = []

          // Add formatting rules first (if they exist)
          if (formattingRules.trim()) {
            apiMessages.push({ role: 'system', content: `[formatting_rules]\n${formattingRules}` })
          }

          // Add global system prompt if it exists
          if (systemPrompt.trim()) {
            apiMessages.push({ role: 'system', content: `[system_prompt]\n${systemPrompt}` })
          }

          // Add session-specific prompt if it exists
          if (sessionPrompt.trim()) {
            apiMessages.push({ role: 'system', content: `[user_prompt]\n${sessionPrompt}` })
          }

          // Add previous messages based on chatMemory setting
          if (chatMemory > 0) {
            // Get the last N messages (excluding the current user message we're about to add)
            const previousMessages = messages.slice(-chatMemory)
            previousMessages.forEach(msg => {
              // Add previous conversation history
              if (msg.responses) {
                // This is an assistant message with multiple model responses
                const modelResponse = msg.responses.find(r => r.modelId === modelId)
                if (modelResponse) {
                  apiMessages.push({ role: 'assistant', content: modelResponse.content })
                }
              } else {
                // This is a user message
                apiMessages.push({ role: msg.role, content: msg.content })
              }
            })
          }

          // Add the current user message
          apiMessages.push({ role: 'user', content: messageContent })

          const response = await fetch('/api/playground', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelId,
              messages: apiMessages,
              temperature: modelTemp,
              maxTokens: modelMaxTokens,
              topP: modelTopP
            })
          })

          if (!response.ok) {
            throw new Error(`Failed to generate response for ${modelId}`)
          }

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let accumulatedContent = ''
          let accumulatedReasoning = ''

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    if (data.content) {
                      accumulatedContent += data.content
                      setStreamingContent(prev => ({
                        ...prev,
                        [modelId]: accumulatedContent
                      }))
                    }
                    if (data.reasoning) {
                      accumulatedReasoning += data.reasoning
                    }
                    if (data.done) {
                      modelResponses[modelId] = {
                        content: accumulatedContent,
                        reasoning: accumulatedReasoning || data.reasoning || undefined,
                        cost: data.cost || 0,
                        toolCalls: [],
                        audioData: data.audioData // Store audio data if present
                      }
                    }
                  } catch (e) {
                    // Ignore parse errors
                  }
                }
              }
            }
          }
        } catch (error: any) {
          console.error(`Error streaming from ${modelId}:`, error)
          modelResponses[modelId] = {
            content: `Error: ${error.message}`,
            cost: 0,
            toolCalls: []
          }
        }
      })

      // Wait for all streams to complete
      await Promise.all(streamPromises)

      // Collect reasoning from all model responses
      const reasoningParts: string[] = []
      Object.values(modelResponses).forEach(r => {
        if (r.reasoning) {
          reasoningParts.push(r.reasoning)
        }
      })

      // Extract thinking from content (for models using <think> tags)
      const fullContent = Object.values(modelResponses).map(r => r.content).join('\n\n---\n\n')
      const { reasoning: contentThinking, cleanContent } = extractThinkTags(fullContent)

      // Combine reasoning field and extracted thinking
      const combinedReasoning = [...reasoningParts, contentThinking].filter(Boolean).join('\n\n---\n\n')

      // Create assistant message with all model responses
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: cleanContent || fullContent, // Use cleaned content if thinking was extracted
        thinking: combinedReasoning || undefined, // Store combined reasoning
        timestamp: new Date(),
        responses: selectedModels.map(modelId => ({
          modelId,
          content: modelResponses[modelId]?.content || '',
          reasoning: modelResponses[modelId]?.reasoning,
          cost: modelResponses[modelId]?.cost || 0,
          toolCalls: modelResponses[modelId]?.toolCalls || [],
          audioData: modelResponses[modelId]?.audioData
        }))
      }

      // Auto-detect code and create artifacts
      const createdArtifactIds: string[] = []
      // Use the fullContent from above (already defined on line 557)

      // Try structured parsing first (XML/JSON)
      const structuredArtifact = parseArtifactResponse(fullContent)
      let newArtifacts: Artifact[] = []

      if (structuredArtifact && structuredArtifact.type === 'creation' && structuredArtifact.creation) {
        // Structured artifact found
        const spec = structuredArtifact.creation
        const fileMap: Record<string, string> = {}
        spec.files.forEach(file => {
          fileMap[file.path] = file.content
        })

        const depsMap: Record<string, string> = {}
        spec.dependencies?.forEach(dep => {
          depsMap[dep.name] = dep.version
        })

        newArtifacts = [{
          id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type: spec.metadata.type as ArtifactType,
          title: spec.metadata.title,
          description: spec.metadata.description,
          files: fileMap,
          dependencies: spec.dependencies ? depsMap : undefined,
          createdAt: new Date()
        }]
      } else {
        // Fall back to markdown code block detection
        const detectedArtifacts = extractArtifactsFromResponse(fullContent)

        if (detectedArtifacts.length > 0) {
          newArtifacts = detectedArtifacts.map((detected) => ({
            id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            type: detected.type,
            title: detected.title,
            description: detected.description,
            files: detected.files,
            dependencies: detected.dependencies,
            createdAt: new Date()
          }))
        }
      }

      if (newArtifacts.length > 0) {

        // Add artifacts to state
        setArtifacts(prev => [...prev, ...newArtifacts])

        // Track artifact IDs
        createdArtifactIds.push(...newArtifacts.map(a => a.id))

        // Save to session
        if (activeChatId) {
          setChatSessions(prev =>
            prev.map(chat =>
              chat.id === activeChatId
                ? { ...chat, artifacts: [...chat.artifacts, ...newArtifacts], updatedAt: new Date() }
                : chat
            )
          )
        }

        // Show toast notification
        if (newArtifacts.length === 1) {
          toast.success(`Artifact detected: "${newArtifacts[0].title}"`)
        } else {
          toast.success(`${newArtifacts.length} artifacts detected`)
        }
      }

      // Add artifact IDs to assistant message
      if (createdArtifactIds.length > 0) {
        assistantMessage.artifactIds = createdArtifactIds
      }

      setMessages(prev => [...prev, assistantMessage])
      setStreamingContent({})

      // Update chat session
      if (activeChatId) {
        setChatSessions(prev => prev.map(chat =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage, assistantMessage],
                updatedAt: new Date(),
                title: chat.title === 'Untitled Chat'
                  ? input.trim().slice(0, 50)
                  : chat.title
              }
            : chat
        ))
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to generate response')
      setStreamingContent({})
    } finally {
      setIsGenerating(false)
    }
  }

  const quickActions = [
    { icon: ImageIcon, label: 'Image', prompt: 'Generate a detailed image of ' },
    { icon: Monitor, label: 'Interactive App', prompt: 'Create an interactive web application that ' },
    { icon: Layout, label: 'Landing Page', prompt: 'Design a modern landing page for ' },
    { icon: Grid3x3, label: '2D Game', prompt: 'Build a 2D game with ' },
    { icon: Box, label: '3D Game', prompt: 'Create a 3D game featuring ' }
  ]

  // Example prompts for OpenRouter-style carousel
  const examplePrompts = [
    { title: '9.9 vs 9.11', description: 'Which one is larger?' },
    { title: 'Strawberry Test', description: 'How many r\'s are in the word strawberry?' },
    { title: 'Poem Riddle', description: 'Compose a 12-line poem' },
    { title: 'Personal Finance', description: 'Draft up a portfolio management proposal' },
    { title: 'Anagram Challenge', description: 'Unscramble letters to form a word.' },
    { title: 'The Missing Dollar', description: 'A classic logic puzzle involving money.' }
  ]

  // Group chats by date
  const groupedChats = chatSessions.reduce((acc, chat) => {
    const now = new Date()
    const chatDate = new Date(chat.updatedAt)
    const diffDays = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24))

    let group = 'Older'
    if (diffDays === 0) group = 'Today'
    else if (diffDays <= 30) group = 'Previous 30 Days'

    if (!acc[group]) acc[group] = []
    acc[group].push(chat)
    return acc
  }, {} as Record<string, ChatSession[]>)

  const filteredChats = Object.entries(groupedChats).reduce((acc, [group, chats]) => {
    const filtered = chats.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filtered.length > 0) {
      acc[group] = filtered
    }
    return acc
  }, {} as Record<string, ChatSession[]>)

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  return (
    <>
    <div className="flex h-screen overflow-hidden bg-white dark:bg-neutral-950">
      {/* Sidebar */}
      <aside
        className={`flex flex-shrink-0 flex-col bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-200 ease-in-out ${
          sidebarExpanded ? 'w-[240px]' : 'w-[54px]'
        }`}
      >
        <div className="flex h-full w-full flex-col gap-2 p-2">
          {/* Sidebar buttons */}
          <div className="flex w-full gap-1">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9 shrink-0"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={createNewChat}
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9 shrink-0"
              aria-label="New Chat"
            >
              <PenSquare className="h-5 w-5" />
            </button>
          </div>

          {/* Expanded sidebar content */}
          {sidebarExpanded && (
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              {/* Chat history */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {Object.keys(filteredChats).length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-neutral-500">
                    No matching rooms
                  </div>
                ) : (
                  <>
                  {Object.entries(filteredChats).map(([group, chats]) => (
                  <div key={group} className="mb-4">
                    <h4 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground px-3 py-2">
                      {group}
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {chats.map(chat => (
                        <div
                          key={chat.id}
                          className={`group relative flex h-9 items-center rounded-lg transition-colors pl-3 ${
                            activeChatId === chat.id
                              ? 'bg-accent/80 dark:bg-accent text-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          {renamingChatId === chat.id ? (
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFinishRename()
                                if (e.key === 'Escape') handleCancelRename()
                              }}
                              onBlur={handleFinishRename}
                              className="flex-1 text-sm bg-background border rounded px-2 py-1 mr-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              autoFocus
                            />
                          ) : (
                            <>
                              <button
                                onClick={() => setActiveChatId(chat.id)}
                                className="flex-1 text-left truncate text-sm"
                              >
                                {chat.title}
                              </button>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded"
                                  aria-label="Chat actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {openMenuChatId === chat.id && (
                                  <div className="absolute right-0 top-full mt-1 w-32 bg-card border rounded-lg shadow-lg py-1 z-50">
                                    <button
                                      onClick={() => handleStartRename(chat)}
                                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={() => handleDeleteChat(chat.id)}
                                      className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-accent transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                </>
                )}
              </div>

              {/* System Prompt Settings */}
              <div className="flex-shrink-0 border-t pt-2">
                <button
                  onClick={() => setShowSystemPromptSettings(!showSystemPromptSettings)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  <span>System Prompt</span>
                  <Command className="h-3 w-3" />
                </button>
                {showSystemPromptSettings && (
                  <div className="px-2 py-2">
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Global system instructions for all chats..."
                      className="w-full text-xs bg-background border rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[4rem]"
                      rows={3}
                      style={{ maxHeight: '120px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 px-1">
                      Applied to all conversations automatically
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - Model Chips */}
        <div className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 relative">
          <div ref={modelPillsRef} className="flex flex-wrap items-center gap-2">
            {selectedModels.map((modelId, index) => {
              const model = models.find(m => m.id === modelId)
              const settings = getModelSettings(modelId)
              const showPopover = openSettingsPopover === modelId

              return (
                <div key={`${modelId}-${index}`} className="duration-200 animate-in fade-in relative">
                  <div
                    onClick={() => {
                      setEditingModelIndex(index)
                      setShowModelDropdown(true)
                      setModelSearchQuery('')
                    }}
                    className="relative flex h-9 items-center justify-between gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all shadow-sm px-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {/* Provider Badge */}
                      <span
                        className={`inline-flex items-center justify-center h-5 w-5 rounded text-xs ${getProviderColor(settings.provider === 'auto' ? detectProvider(modelId) : settings.provider)}`}
                        title={`Provider: ${settings.provider === 'auto' ? detectProvider(modelId) : settings.provider}`}
                      >
                        {getProviderIcon(settings.provider === 'auto' ? detectProvider(modelId) : settings.provider)}
                      </span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {settings.label || model?.displayName || modelId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Settings Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenSettingsPopover(showPopover ? null : modelId)
                        }}
                        className="inline-flex items-center justify-center rounded-md transition-colors h-6 w-6 hover:bg-slate-100 dark:hover:bg-slate-800 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 group"
                        aria-label="Model settings"
                      >
                        <MoreHorizontal className="h-4 w-4 group-hover:hidden" />
                        <Sliders className="h-4 w-4 hidden group-hover:block" />
                      </button>
                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedModels(prev => prev.filter(id => id !== modelId))
                        }}
                        className="inline-flex items-center justify-center rounded-md transition-colors h-5 w-5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-neutral-400 dark:text-neutral-500"
                        aria-label="Remove model"
                      >
                        <Plus className="h-3.5 w-3.5 rotate-45" />
                      </button>
                    </div>
                  </div>

                  {/* Settings Popover */}
                  {showPopover && (
                    <div className="absolute top-full mt-1 right-0 z-50">
                      <ModelSettingsPopover
                        modelId={modelId}
                        modelName={settings.label || model?.displayName || modelId}
                        settings={{
                          enabled: settings.enabled,
                          reasoning: settings.reasoning
                        }}
                        onToggleEnabled={() => {
                          updateModelSettings(modelId, { enabled: !settings.enabled })
                        }}
                        onToggleReasoning={() => {
                          updateModelSettings(modelId, { reasoning: !settings.reasoning })
                        }}
                        onDuplicate={() => {
                          duplicateModel(modelId)
                          setOpenSettingsPopover(null)
                        }}
                        onAdvancedSettings={() => {
                          setOpenSettingsModal(modelId)
                          setOpenSettingsPopover(null)
                        }}
                        onRemove={() => {
                          setSelectedModels(prev => prev.filter(id => id !== modelId))
                          setOpenSettingsPopover(null)
                        }}
                        onClose={() => setOpenSettingsPopover(null)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            <button
              onClick={() => {
                setEditingModelIndex(null)
                setShowModelDropdown(true)
                setModelSearchQuery('')
              }}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all shadow-sm h-9 w-9"
              type="button"
              aria-label="Add Model"
            >
              <Plus className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div className="ml-2">
              <ArtifactButton onCreateArtifact={handleCreateArtifact} />
            </div>
          </div>

          {/* Model Dropdown */}
          {showModelDropdown && (
            <div
              ref={modelDropdownRef}
              className="absolute top-full left-4 right-4 mt-2 max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl z-50 overflow-hidden"
            >
              {/* Search Bar with Refresh and Sort Buttons */}
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search models..."
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center justify-center h-9 w-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      title="Sort models"
                    >
                      <ArrowUpDown className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                    {showSortDropdown && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl z-[60] py-1">
                        {[
                          { value: 'favorites', label: 'Favorites First', icon: '⭐' },
                          { value: 'name-asc', label: 'Name (A-Z)', icon: '🔤' },
                          { value: 'name-desc', label: 'Name (Z-A)', icon: '🔡' },
                          { value: 'cost-asc', label: 'Cost (Low to High)', icon: '💰' },
                          { value: 'cost-desc', label: 'Cost (High to Low)', icon: '💸' },
                          { value: 'context-asc', label: 'Context (Small)', icon: '📏' },
                          { value: 'context-desc', label: 'Context (Large)', icon: '📐' },
                          { value: 'recent', label: 'Recently Used', icon: '🕒' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setModelSortBy(option.value as typeof modelSortBy)
                              setShowSortDropdown(false)
                              toast.success(`Sorted by: ${option.label}`)
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
                          >
                            <span className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </span>
                            {modelSortBy === option.value && (
                              <Check className="h-4 w-4 text-purple-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={refreshModels}
                    disabled={isLoadingModels}
                    className="flex items-center justify-center h-9 w-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh models from Groq API"
                  >
                    <RefreshCw className={`h-4 w-4 text-neutral-600 dark:text-neutral-400 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Model List */}
              <div className="max-h-[400px] overflow-y-auto">
                {isLoadingModels ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                  </div>
                ) : filteredModels.length === 0 ? (
                  <div className="text-center py-8 text-sm text-neutral-500">
                    No models found
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredModels.map((model) => {
                      const isSelected = selectedModels.includes(model.id)
                      const isFavorite = favoriteModels.includes(model.id)
                      const isToggling = isTogglingFavorite === model.id

                      return (
                        <div
                          key={model.id}
                          className={`flex items-start gap-2 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                            isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                          }`}
                        >
                          {/* Star Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(model.id)
                            }}
                            disabled={isToggling}
                            className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform disabled:opacity-50"
                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                isFavorite
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-neutral-400 hover:text-yellow-400'
                              }`}
                            />
                          </button>

                          {/* Model Info */}
                          <button
                            onClick={() => handleSelectModel(model.id)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                  {model.displayName}
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                  {model.isVision && <span className="inline-flex items-center gap-1 mr-2">👁️ Vision</span>}
                                  Context: {model.contextWindow.toLocaleString()} tokens
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                  {model.inputPricing === 0 && model.outputPricing === 0
                                    ? 'Free'
                                    : `$${model.inputPricing.toFixed(2)} / $${model.outputPricing.toFixed(2)} per 1M tokens`
                                  }
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <div className="h-5 w-5 rounded-full bg-purple-600 flex items-center justify-center">
                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Session Prompt Section (Per-Chat) */}
        {activeChatId && (
          <div className="flex-shrink-0 border-b bg-muted/30">
            <div className="max-w-4xl mx-auto p-3">
              <div className="flex items-start gap-2">
                <div className="text-xs font-medium text-muted-foreground whitespace-nowrap pt-2">
                  Session:
                </div>
                <button
                  onClick={() => {
                    setTempSessionPrompt(sessionPrompt)
                    setExpandedSessionPromptEditor(true)
                  }}
                  className="flex-1 text-left text-xs bg-background border rounded-md px-2 py-1.5 hover:bg-accent transition-colors min-h-[2.5rem] focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sessionPrompt || (
                    <span className="text-muted-foreground">
                      Click to edit session-specific prompt...
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 dark:bg-neutral-900">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'user' ? (
                  <div className="flex gap-3 justify-end">
                    <div className="rounded-lg p-4 max-w-[80%] bg-muted border">
                      <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : message.responses && message.responses.length > 0 ? (
                  <div className="space-y-2">
                    <div className={`grid gap-3 ${selectedModels.length === 1 ? 'grid-cols-1' : selectedModels.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {message.responses.map((response) => {
                        const model = models.find(m => m.id === response.modelId)
                        return (
                          <div key={response.modelId} className="rounded-lg border bg-card">
                            <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
                              <span className="text-xs font-medium">{model?.displayName || response.modelId}</span>
                              {response.cost > 0 && (
                                <span className="text-xs text-muted-foreground">${response.cost.toFixed(6)}</span>
                              )}
                            </div>
                            <div className="p-3">
                              {response.audioData ? (
                                <div className="flex flex-col gap-2">
                                  <audio controls className="w-full">
                                    <source src={response.audioData} type="audio/mp3" />
                                    Your browser does not support the audio element.
                                  </audio>
                                  <p className="text-xs text-muted-foreground">
                                    Audio generated from text
                                  </p>
                                </div>
                              ) : (
                                <div className="prose dark:prose-invert max-w-none text-sm">
                                  <ReactMarkdown>
                                    {response.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Artifact Cards */}
                    {message.artifactIds && message.artifactIds.length > 0 && (
                      <div className="space-y-2">
                        {message.artifactIds.map((artifactId) => {
                          const artifact = artifacts.find(a => a.id === artifactId)
                          if (!artifact) return null
                          return (
                            <ArtifactCard
                              key={artifactId}
                              artifact={artifact}
                              onOpen={() => setActiveArtifactId(artifactId)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-3 justify-start">
                      <div className="rounded-lg p-4 max-w-[80%] bg-card border">
                        {/* Thinking Display */}
                        {message.thinking && (
                          <ReasoningDisplay reasoning={message.thinking} className="mb-3" />
                        )}

                        {/* Message Content */}
                        <div className="prose dark:prose-invert max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {/* Cost */}
                        {message.cost !== undefined && message.cost > 0 && (
                          <div className="mt-2 text-xs opacity-70">
                            Cost: ${message.cost.toFixed(6)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Artifact Cards */}
                    {message.artifactIds && message.artifactIds.length > 0 && (
                      <div className="space-y-2">
                        {message.artifactIds.map((artifactId) => {
                          const artifact = artifacts.find(a => a.id === artifactId)
                          if (!artifact) return null
                          return (
                            <ArtifactCard
                              key={artifactId}
                              artifact={artifact}
                              onOpen={() => setActiveArtifactId(artifactId)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Streaming messages */}
            {Object.keys(streamingContent).length > 0 && (
              <div className="space-y-2">
                <div className={`grid gap-3 ${selectedModels.length === 1 ? 'grid-cols-1' : selectedModels.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {selectedModels.map((modelId) => {
                    const model = models.find(m => m.id === modelId)
                    const content = streamingContent[modelId] || ''
                    return (
                      <div key={modelId} className="rounded-lg border bg-card">
                        {/* Model Header */}
                        <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
                          <span className="text-xs font-medium">{model?.displayName || modelId}</span>
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        </div>
                        {/* Model Response */}
                        <div className="p-3">
                          <div className="prose dark:prose-invert max-w-none text-sm">
                            <ReactMarkdown>
                              {content || '_Waiting for response..._'}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-neutral-950">
          <div className="max-w-3xl mx-auto">
            {/* Example Prompts Carousel (only show when no messages) */}
            {messages.length === 0 && (
              <div className="relative mb-4">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {examplePrompts.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(example.description)}
                      className="flex-shrink-0 group cursor-pointer"
                    >
                      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors min-w-[200px] max-w-[220px]">
                        <h3 className="font-semibold text-sm mb-1 text-neutral-900 dark:text-neutral-100">
                          {example.title}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                          {example.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl overflow-hidden p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg">
              {/* Quick actions */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      if (action.label === 'Interactive App') {
                        // Open workspace builder for Interactive App
                        setWorkspaceRequest('an interactive web application')
                        setShowWorkspaceBuilder(true)
                      } else {
                        setInput(action.prompt)
                        textareaRef.current?.focus()
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    <action.icon className="h-3.5 w-3.5" />
                    <span className="text-xs">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Attached Images Preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2 mb-2">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={att.data}
                        alt={att.name}
                        className="h-20 w-20 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => handleRemoveAttachment(idx)}
                        className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <Plus className="h-3 w-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus-within:border-neutral-300 dark:focus-within:border-neutral-600 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder="Start a new message..."
                  className="w-full bg-transparent px-3 py-2 resize-none focus:outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  rows={1}
                  style={{ maxHeight: '200px' }}
                  disabled={isGenerating}
                />
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
                    aria-label="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
                    aria-label="Drawing"
                  >
                    <Wand2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className="inline-flex items-center gap-2 px-2 h-8 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Web search</span>
                    <div className={`w-9 h-4 rounded-full transition-colors ${webSearchEnabled ? 'bg-purple-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                      <div className={`h-3 w-3 rounded-full bg-white shadow transform transition-transform m-0.5 ${webSearchEnabled ? 'translate-x-5' : ''}`} />
                    </div>
                  </button>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={(!input.trim() && attachments.length === 0) || isGenerating}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Model Selector Modal */}
      {showModelSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card border rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Select a Model</h2>
              <button
                onClick={() => setShowModelSelector(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {isLoadingModels ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No models available</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {models.map((model) => {
                    const isSelected = selectedModels.includes(model.id)
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          if (isSelected) {
                            // Remove from selection
                            setSelectedModels(prev => prev.filter(id => id !== model.id))
                            toast.info(`Removed ${model.displayName}`)
                          } else {
                            // Add to selection
                            setSelectedModels(prev => [...prev, model.id])
                            toast.success(`Added ${model.displayName}`)
                          }
                        }}
                        className={`flex items-start gap-3 p-3 rounded-md border transition-colors text-left ${
                          isSelected
                            ? 'bg-accent border-foreground/20 hover:bg-accent/80'
                            : 'bg-background hover:bg-accent'
                        }`}
                      >
                      <div className="flex-1">
                        <div className="font-medium">{model.displayName}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {model.isVision && <span className="inline-flex items-center gap-1 mr-2"><Plus className="h-3 w-3" />Vision</span>}
                          Context: {model.contextWindow.toLocaleString()} tokens
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {model.inputPricing === 0 && model.outputPricing === 0
                            ? 'Free'
                            : `$${model.inputPricing.toFixed(2)} / $${model.outputPricing.toFixed(2)} per 1M tokens`
                          }
                        </div>
                      </div>
                    </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Temperature</label>
                  <span className="text-sm text-muted-foreground">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Controls randomness. Lower is more focused, higher is more creative.
                </p>
              </div>

              {/* Max Tokens */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Max Tokens</label>
                  <span className="text-sm text-muted-foreground">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum length of the response.
                </p>
              </div>

              {/* Top P */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Top P</label>
                  <span className="text-sm text-muted-foreground">{topP}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Controls diversity via nucleus sampling.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <button
                onClick={() => {
                  setTemperature(1)
                  setMaxTokens(1024)
                  setTopP(1)
                }}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Session Prompt Editor */}
      {expandedSessionPromptEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-card border rounded-lg shadow-lg flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Session Prompt</h2>
              <button
                onClick={() => setExpandedSessionPromptEditor(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <textarea
                value={tempSessionPrompt}
                onChange={(e) => setTempSessionPrompt(e.target.value)}
                placeholder="Enter session-specific instructions for this chat...&#10;&#10;Examples:&#10;- Always respond in a specific tone or style&#10;- Focus on particular topics&#10;- Follow specific formatting rules"
                className="w-full min-h-[300px] bg-background border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                This prompt will be applied to all messages in this chat session, in addition to the global system prompt.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setExpandedSessionPromptEditor(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSessionPrompt(tempSessionPrompt)
                  handleSessionPromptSave(tempSessionPrompt)
                  setExpandedSessionPromptEditor(false)
                }}
                className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artifact Viewer */}
      {activeArtifactId && artifacts.find(a => a.id === activeArtifactId) && (
        <ArtifactViewer
          artifact={artifacts.find(a => a.id === activeArtifactId)!}
          onClose={() => setActiveArtifactId(null)}
          onDelete={() => handleDeleteArtifact(activeArtifactId)}
        />
      )}

      {/* Workspace Builder IDE */}
      {showWorkspaceBuilder && (
        <WorkspaceIDE
          request={workspaceRequest}
          onClose={() => setShowWorkspaceBuilder(false)}
          model={selectedModels[0]}
        />
      )}

      {/* Model Settings Modal */}
      {openSettingsModal && (
        <ModelSettingsModal
          modelId={openSettingsModal}
          models={models}
          settings={getModelSettings(openSettingsModal)}
          onSave={(newSettings) => {
            updateModelSettings(openSettingsModal, newSettings)
          }}
          onApplyToAll={(newSettings) => {
            applySettingsToAll(newSettings)
            toast.success('Settings applied to all models')
          }}
          onReset={() => {
            resetModelSettings(openSettingsModal)
            toast.success('Settings reset to defaults')
          }}
          onRemove={() => {
            setSelectedModels(prev => prev.filter(id => id !== openSettingsModal))
            setOpenSettingsModal(null)
            toast.success('Model removed from selection')
          }}
          onClose={() => setOpenSettingsModal(null)}
        />
      )}
    </>
  )
}
