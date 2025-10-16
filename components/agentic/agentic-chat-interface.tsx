'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Sparkles, Brain, Terminal, Code2, Globe } from 'lucide-react'
import { useAgenticChat } from '@/contexts/agentic-chat-context'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
// Slash command support removed temporarily for debugging

const AGENTIC_MODELS = [
  {
    id: 'groq/compound',
    name: 'Groq Compound',
    description: 'Production agentic system with web search, code execution, and browser automation',
    icon: Brain
  },
  {
    id: 'groq/compound-mini',
    name: 'Groq Compound Mini',
    description: 'Lightweight agentic system for faster responses',
    icon: Sparkles
  },
]

export function AgenticChatInterface() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { messages, addMessage, clearMessages, isLoading, setIsLoading, selectedModel, setSelectedModel } = useAgenticChat()
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<number | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Slash command support disabled for now

  // Redirect if not authenticated
  useEffect(() => {
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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  // Create a new chat session on mount
  useEffect(() => {
    const createChat = async () => {
      try {
        console.log('[Agentic Chat] Creating chat session...')
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Agentic Chat' }),
        })

        console.log('[Agentic Chat] Response status:', res.status)

        if (res.ok) {
          const data = await res.json()
          console.log('[Agentic Chat] Chat created:', data)
          setChatId(data.id)
        } else {
          const error = await res.text()
          console.error('[Agentic Chat] Failed to create chat:', error)
          toast.error('Failed to initialize chat session')
        }
      } catch (error) {
        console.error('[Agentic Chat] Error creating chat:', error)
        toast.error('Failed to initialize chat')
      }
    }

    if (status === 'authenticated' && !chatId) {
      createChat()
    }
  }, [status, chatId])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    // If chatId is not ready, create it now and retry
    if (!chatId) {
      console.log('[Agentic Chat] No chat ID, creating one...')
      try {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Agentic Chat' }),
        })

        if (res.ok) {
          const data = await res.json()
          setChatId(data.id)
          // Retry submission with new chatId
          setTimeout(() => handleSubmit(e), 100)
          return
        }
      } catch (error) {
        console.error('[Agentic Chat] Failed to create chat on submit:', error)
        toast.error('Failed to initialize chat. Please refresh the page.')
        return
      }
    }

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    }

    addMessage(userMessage)
    const currentInput = input
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)
    setStreamingContent('')

    try {
      console.log('[Agentic Chat] Sending message:', { chatId, model: selectedModel })
      const response = await fetch('/api/agentic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: currentInput,
          model: selectedModel,
          settings: {
            temperature: 0.7,
            maxTokens: 8192,
            topP: 1.0,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get response')
      }

      // Handle streaming response
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
                  console.log('[Agentic Chat] Stream completed')
                  addMessage({
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date(),
                  })
                  setStreamingContent('')
                  setIsStreaming(false)
                }

                if (data.error) {
                  throw new Error(data.error)
                }
              } catch (e) {
                // Ignore JSON parse errors for incomplete chunks
                if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                  console.error('[Agentic Chat] Parse error:', e)
                }
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('[Agentic Chat] Error:', error)
      toast.error(error.message || 'Failed to send message')
      setStreamingContent('')
      setIsStreaming(false)
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Agentic AI</h1>
                <p className="text-sm text-muted-foreground">Powered by Groq Compound with built-in tools</p>
              </div>
            </div>

            {/* Model Selector */}
            <div className="flex items-center gap-2">
              {AGENTIC_MODELS.map((model) => {
                const Icon = model.icon
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`
                      px-4 py-2 rounded-lg border transition-all flex items-center gap-2
                      ${selectedModel === model.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-accent border-border'
                      }
                    `}
                    title={model.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{model.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Capabilities */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span>Web Search</span>
            </div>
            <div className="flex items-center gap-1">
              <Code2 className="h-3 w-3" />
              <span>Code Execution</span>
            </div>
            <div className="flex items-center gap-1">
              <Terminal className="h-3 w-3" />
              <span>Browser Automation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-600/10 mb-4">
                <Brain className="h-12 w-12 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Agentic AI</h2>
              <p className="text-muted-foreground max-w-md">
                This AI assistant has advanced capabilities including web search, code execution, and browser automation.
                Ask me anything and I'll use the right tools to help you.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="p-4 rounded-lg border bg-card text-left">
                  <Globe className="h-5 w-5 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-1">Web Search</h3>
                  <p className="text-sm text-muted-foreground">Get real-time information from the web</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-left">
                  <Code2 className="h-5 w-5 text-green-500 mb-2" />
                  <h3 className="font-semibold mb-1">Code Execution</h3>
                  <p className="text-sm text-muted-foreground">Run Python and JavaScript code</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-left">
                  <Terminal className="h-5 w-5 text-orange-500 mb-2" />
                  <h3 className="font-semibold mb-1">Browser Automation</h3>
                  <p className="text-sm text-muted-foreground">Automate web interactions and scraping</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-left">
                  <Brain className="h-5 w-5 text-purple-500 mb-2" />
                  <h3 className="font-semibold mb-1">Intelligent Reasoning</h3>
                  <p className="text-sm text-muted-foreground">Multi-step problem solving</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-full bg-primary">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {isStreaming && streamingContent && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="max-w-[80%] rounded-lg p-4 bg-card border">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        },
                      }}
                    >
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && !isStreaming && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="Ask anything... I have access to web search, code execution, and browser automation."
                className="w-full resize-none rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] max-h-[200px]"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>

          {!chatId && status === 'authenticated' && (
            <p className="text-xs text-muted-foreground mt-2">
              Initializing chat session...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
