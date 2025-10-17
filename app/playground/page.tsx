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
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

interface Model {
  id: string
  displayName: string
  contextWindow: number
  inputPricing: number
  outputPricing: number
  isVision: boolean
  isActive: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  cost?: number
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  model: string
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
  const [selectedModel, setSelectedModel] = useState('')
  const [isLoadingModels, setIsLoadingModels] = useState(true)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [temperature, setTemperature] = useState(1)
  const [maxTokens, setMaxTokens] = useState(1024)
  const [topP, setTopP] = useState(1)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Load models
  useEffect(() => {
    if (status === 'authenticated') {
      fetchModels()
    }
  }, [status])

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

  // Load active chat messages
  useEffect(() => {
    if (activeChatId) {
      const activeChat = chatSessions.find(s => s.id === activeChatId)
      if (activeChat) {
        setMessages(activeChat.messages)
        setSelectedModel(activeChat.model)
      }
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

  const fetchModels = async () => {
    try {
      setIsLoadingModels(true)
      const response = await fetch('/api/models')
      const data = await response.json()
      setModels(data.models || [])
      if (data.models?.length > 0 && !selectedModel) {
        setSelectedModel(data.models[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      toast.error('Failed to load models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const createNewChat = () => {
    // Ensure we have a model selected
    const modelToUse = selectedModel || models[0]?.id || ''

    const newChat: ChatSession = {
      id: `chat-${Date.now()}`,
      title: 'Untitled Chat',
      messages: [],
      model: modelToUse,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setChatSessions(prev => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setMessages([])
    setInput('')
    setStreamingContent('')

    // Set the model if not already set
    if (!selectedModel && modelToUse) {
      setSelectedModel(modelToUse)
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating || !selectedModel) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'user', content: input.trim() }
          ],
          temperature,
          maxTokens,
          topP
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

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
                  setStreamingContent(accumulatedContent)
                }
                if (data.done) {
                  const assistantMessage: Message = {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: accumulatedContent,
                    cost: data.cost || 0,
                    timestamp: new Date()
                  }
                  setMessages(prev => [...prev, assistantMessage])
                  setStreamingContent('')

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
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to generate response')
      setStreamingContent('')
    } finally {
      setIsGenerating(false)
    }
  }

  const quickActions = [
    { icon: ImageIcon, label: 'Image' },
    { icon: Monitor, label: 'Interactive App' },
    { icon: Layout, label: 'Landing Page' },
    { icon: Grid3x3, label: '2D Game' },
    { icon: Box, label: '3D Game' }
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`flex flex-shrink-0 flex-col bg-background border-r transition-all duration-200 ease-in-out ${
          sidebarExpanded ? 'w-64' : 'w-[54px]'
        }`}
      >
        <div className="flex h-full w-full flex-col gap-2 p-2">
          {/* Sidebar buttons */}
          <div className="flex w-full flex-col items-stretch gap-0">
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
                          <button
                            onClick={() => setActiveChatId(chat.id)}
                            className="flex-1 text-left truncate text-sm"
                          >
                            {chat.title}
                          </button>
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded"
                            aria-label="Chat actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center gap-2 p-4 border-b">
          <button
            onClick={() => {/* Open model selector */}}
            className="inline-flex items-center justify-center gap-2 px-3 h-9 rounded-md border bg-background shadow-sm hover:bg-accent transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Model</span>
            <span className="hidden md:flex items-center gap-0.5 text-xs">
              <kbd className="h-4 px-1 rounded border bg-muted">⌘</kbd>
              <kbd className="h-4 px-1 rounded border bg-muted">K</kbd>
            </span>
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`rounded-lg p-4 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border'
                }`}>
                  <ReactMarkdown className="prose dark:prose-invert max-w-none">
                    {message.content}
                  </ReactMarkdown>
                  {message.cost !== undefined && message.cost > 0 && (
                    <div className="mt-2 text-xs opacity-70">
                      Cost: ${message.cost.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingContent && (
              <div className="flex gap-3 justify-start">
                <div className="rounded-lg p-4 max-w-[80%] bg-card border">
                  <ReactMarkdown className="prose dark:prose-invert max-w-none">
                    {streamingContent}
                  </ReactMarkdown>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Generating...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl overflow-hidden p-2 border bg-card shadow-lg">
              {/* Quick actions */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="inline-flex items-center gap-2 px-3 h-8 rounded-full border bg-background shadow-sm hover:bg-accent transition-colors text-xs font-medium whitespace-nowrap"
                  >
                    <action.icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="rounded-lg bg-background border focus-within:bg-accent transition-colors">
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
                  className="w-full bg-transparent px-2 py-2 resize-none focus:outline-none text-sm"
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
                    className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                    aria-label="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <button
                    className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button
                    className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                    aria-label="Drawing"
                  >
                    <Wand2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className="inline-flex items-center gap-2 px-3 h-9 rounded-md hover:bg-accent transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="text-sm">Web search</span>
                    <div className={`w-10 h-5 rounded-full transition-colors ${webSearchEnabled ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`h-4 w-4 rounded-full bg-white shadow transform transition-transform m-0.5 ${webSearchEnabled ? 'translate-x-5' : ''}`} />
                    </div>
                  </button>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isGenerating}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
