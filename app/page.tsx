'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Send,
  Loader2,
  Bot,
  User,
  Menu,
  Settings,
  Plus,
  RefreshCw,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { ReasoningDisplay } from '@/components/agentic/reasoning-display'
import { extractThinkTags } from '@/lib/reasoning-parser'
import { ModelSettingsModal } from '@/components/playground/model-settings-modal'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { isAdmin } from '@/lib/admin-utils'
import { APP_VERSION, APP_NAME } from '@/lib/version'

interface Model {
  id: string
  displayName: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingReasoning, setStreamingReasoning] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile')
  const [settings, setSettings] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    webSearch: false,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Redirect if not authenticated
  // IMPORTANT: Wait for session to fully load before checking
  // This prevents race condition where we redirect before session cookie is read
  useEffect(() => {
    // Don't do anything while session is still loading
    if (status === 'loading') return

    // Only redirect if we're definitively unauthenticated after loading completes
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

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

  const handleNewChat = () => {
    if (messages.length > 0 && confirm('Start a new chat? Current conversation will be cleared.')) {
      setMessages([])
      setInput('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingContent('')
    setStreamingReasoning('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          topP: settings.topP,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let fullReasoning = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6))

            if (data.error) {
              toast.error(data.error)
              continue
            }

            if (data.content) {
              fullContent += data.content
              const { cleanContent, extractedReasoning } = extractThinkTags(fullContent)
              setStreamingContent(cleanContent)
              setStreamingReasoning(extractedReasoning)
            }

            if (data.done) {
              const { cleanContent, extractedReasoning } = extractThinkTags(fullContent)
              const assistantMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: cleanContent,
                reasoning: extractedReasoning,
              }
              setMessages((prev) => [...prev, assistantMessage])
              setStreamingContent('')
              setStreamingReasoning('')
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 border-b bg-card/50 backdrop-blur-sm safe-top">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{APP_NAME}</h1>
            <span className="text-xs text-muted-foreground">{APP_VERSION}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin(session) && (
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="Admin Dashboard"
              >
                <Shield className="h-5 w-5 text-purple-500" />
              </button>
            )}
            <button
              onClick={handleNewChat}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-30 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{APP_NAME}</h1>
              <span className="text-sm text-muted-foreground">{APP_VERSION}</span>
            </div>
            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin(session) && (
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="px-4 py-2 border border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden pt-[60px] lg:pt-[72px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6">
            {messages.length === 0 && !streamingContent ? (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full text-center py-12 md:py-20 px-4">
                <div className="p-3 md:p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 mb-4 md:mb-6">
                  <Bot className="h-10 md:h-12 w-10 md:w-12 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">Start a Conversation</h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-md">
                  Ask me anything and I'll help you with code, answers, and creative tasks.
                </p>
              </div>
            ) : (
              // Messages List
              <div className="space-y-4 md:space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 md:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Assistant Avatar */}
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="flex flex-col gap-1.5 md:gap-2 max-w-[85%] md:max-w-[80%]">
                      <div
                        className={`rounded-lg p-3 md:p-4 text-sm md:text-base ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-card border'
                        }`}
                      >
                        {message.role === 'assistant' && message.reasoning && (
                          <ReasoningDisplay reasoning={message.reasoning} className="mb-3" />
                        )}
                        <div className={`prose dark:prose-invert max-w-none ${message.role === 'user' && 'prose-invert'}`}>
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    {/* User Avatar */}
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming Message */}
                {streamingContent && (
                  <div className="flex gap-2 md:gap-4 justify-start">
                    <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    <div className="max-w-[85%] md:max-w-[80%] rounded-lg p-3 md:p-4 text-sm md:text-base bg-card border">
                      {streamingReasoning && (
                        <ReasoningDisplay
                          reasoning={streamingReasoning}
                          isStreaming={true}
                          className="mb-3"
                          defaultExpanded
                        />
                      )}
                      <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Generating response...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t bg-card/50 backdrop-blur-sm safe-bottom">
          <div className="max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-4">
            <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 resize-none rounded-lg border bg-background px-3 md:px-4 py-2.5 md:py-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] md:min-h-[52px] max-h-[160px] md:max-h-[200px]"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 md:px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 self-end min-h-[44px] flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <ModelSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Admin Dashboard */}
      <AdminDashboard
        isOpen={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
      />
    </div>
  )
}
