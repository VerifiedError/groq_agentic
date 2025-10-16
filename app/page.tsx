'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Brain, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { isVisionModel } from '@/lib/groq-utils'
import useAgenticSessionStore from '@/stores/agentic-session-store'
import { SessionSidebar } from '@/components/agentic/session-sidebar'
import { SessionHeader } from '@/components/agentic/session-header'
import { MessageCostBadge } from '@/components/agentic/message-cost-badge'
import { VisionMessage } from '@/components/agentic/vision-message'

export default function AgenticPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const {
    activeSessionId,
    messages,
    isLoadingMessages,
    fetchSessions,
    fetchSessionMessages,
    setActiveSession,
    getActiveSession,
  } = useAgenticSessionStore()

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [attachments, setAttachments] = useState<Array<{ data: string; name: string; type: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Load sessions on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchSessions()
    }
  }, [status, fetchSessions])

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      fetchSessionMessages(activeSessionId)
    }
  }, [activeSessionId, fetchSessionMessages])

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Validate file count (max 5 total)
    if (attachments.length + files.length > 5) {
      toast.error('Maximum 5 images allowed per message')
      return
    }

    // Process each file
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

  const renderAttachments = (attachmentsJson: string | null) => {
    if (!attachmentsJson) return null

    try {
      const parsedAttachments = JSON.parse(attachmentsJson)
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {parsedAttachments.map((att: any, idx: number) => (
            <img
              key={idx}
              src={att.data}
              alt={att.name || `Image ${idx + 1}`}
              className="max-w-xs rounded-lg border"
            />
          ))}
        </div>
      )
    } catch (e) {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !activeSessionId) {
      if (!activeSessionId) {
        toast.error('Please create or select a session first')
      }
      return
    }

    const userMessage = input.trim()
    const messageAttachments = [...attachments]

    setInput('')
    setAttachments([])
    setIsLoading(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/agentic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          message: userMessage,
          attachments: messageAttachments,
          settings: { temperature: 0.7, maxTokens: 8192, topP: 1.0 },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get response')
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
                  console.log('[Agentic Page] Stream completed with usage:', data.usage)

                  // Reload messages to get the saved messages with cost data
                  await fetchSessionMessages(activeSessionId)
                  setStreamingContent('')

                  // Reload sessions to update the session stats in sidebar
                  await fetchSessions()
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('[Agentic] Error:', error)
      toast.error(error.message || 'Failed to send message')
      setStreamingContent('')
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
    <div className="flex h-screen overflow-hidden">
      {/* Session Sidebar */}
      <SessionSidebar className="w-80 flex-shrink-0" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Session Header */}
        <SessionHeader />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 && !streamingContent ? (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 mb-6">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {activeSessionId ? 'Start a Conversation' : 'No Session Selected'}
                </h2>
                <p className="text-muted-foreground max-w-md">
                  {activeSessionId
                    ? 'Ask me anything and I will use web search, code execution, and browser automation to help you.'
                    : 'Create or select a session to start chatting with the agentic AI.'}
                </p>
              </div>
            ) : (
              // Messages List
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Assistant Avatar */}
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div
                        className={cn(
                          'rounded-lg p-4',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-card border'
                        )}
                      >
                        <div
                          className={cn(
                            'prose dark:prose-invert max-w-none',
                            message.role === 'user' && 'prose-invert'
                          )}
                        >
                          {message.role === 'assistant' && getActiveSession() && isVisionModel(getActiveSession()!.model) ? (
                            <VisionMessage content={message.content} />
                          ) : (
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          )}
                        </div>
                        {/* Render image attachments */}
                        {message.attachments && renderAttachments(message.attachments)}
                      </div>

                      {/* Cost Badge for Assistant Messages */}
                      {message.role === 'assistant' && (
                        <MessageCostBadge
                          cost={message.cost}
                          inputTokens={message.inputTokens}
                          outputTokens={message.outputTokens}
                          toolCalls={message.toolCalls}
                          showDetails
                          className="self-start"
                        />
                      )}
                    </div>

                    {/* User Avatar */}
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming Message */}
                {streamingContent && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="max-w-[80%] rounded-lg p-4 bg-card border">
                      <div className="prose dark:prose-invert max-w-none">
                        {getActiveSession() && isVisionModel(getActiveSession()!.model) ? (
                          <VisionMessage content={streamingContent} />
                        ) : (
                          <ReactMarkdown>{streamingContent}</ReactMarkdown>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Generating response...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading Messages */}
                {isLoadingMessages && messages.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Image Preview Area */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={att.data}
                      alt={att.name}
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 rounded-b-lg truncate">
                      {att.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 flex items-end gap-2">
                {/* File upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !activeSessionId || attachments.length >= 5}
                  className="p-3 rounded-lg border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Upload images (max 5)"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

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
                  placeholder={activeSessionId ? 'Ask anything...' : 'Create or select a session to start...'}
                  className="flex-1 resize-none rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] max-h-[200px]"
                  rows={1}
                  disabled={isLoading || !activeSessionId}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !activeSessionId}
                className="px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 self-end"
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
    </div>
  )
}
