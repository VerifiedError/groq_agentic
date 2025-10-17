'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { ArtifactChangesPreview } from './artifact-changes-preview'

interface ArtifactChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ArtifactChatProps {
  artifactId: string
  artifactTitle: string
  currentFiles: Record<string, string>
  onApplyChanges?: (files: Record<string, string>) => void
  onClose?: () => void
  isOpen: boolean
}

export function ArtifactChat({
  artifactId,
  artifactTitle,
  currentFiles,
  onApplyChanges,
  onClose,
  isOpen
}: ArtifactChatProps) {
  const [messages, setMessages] = useState<ArtifactChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [pendingChanges, setPendingChanges] = useState<Record<string, string> | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`artifact-chat-${artifactId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })))
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }, [artifactId])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`artifact-chat-${artifactId}`, JSON.stringify(messages))
    }
  }, [messages, artifactId])

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: ArtifactChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)
    setStreamingContent('')

    try {
      const response = await fetch(`/api/artifacts/${artifactId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          files: currentFiles,
          history: messages
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
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
                  // Save assistant message
                  const assistantMessage: ArtifactChatMessage = {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date()
                  }
                  setMessages(prev => [...prev, assistantMessage])
                  setStreamingContent('')

                  // Check if there are file changes to apply
                  if (data.fileChanges && onApplyChanges) {
                    setPendingChanges(data.fileChanges)
                    setShowPreview(true)
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
      const errorMessage: ArtifactChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyChanges = () => {
    if (pendingChanges && onApplyChanges) {
      onApplyChanges(pendingChanges)
      setPendingChanges(null)
      setShowPreview(false)
    }
  }

  const handleRejectChanges = () => {
    setPendingChanges(null)
    setShowPreview(false)
  }

  // Convert pending changes to FileChange format for preview
  const fileChanges = pendingChanges
    ? Object.entries(pendingChanges).map(([path, newContent]) => ({
        path,
        oldContent: currentFiles[path] || '',
        newContent,
        action: (currentFiles[path] ? 'modified' : 'created') as 'modified' | 'created',
      }))
    : []

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Ask me to modify {artifactTitle}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ask me to modify your code</p>
            <p className="text-xs mt-1">For example: "Add a dark mode toggle" or "Fix the layout on mobile"</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg p-3',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border'
              )}
            >
              <div className="prose dark:prose-invert max-w-none text-sm">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-card border">
              <div className="prose dark:prose-invert max-w-none text-sm">
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Generating...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary">
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
              placeholder="Ask me to modify the code..."
              className="w-full bg-transparent px-3 py-2 resize-none focus:outline-none text-sm"
              rows={1}
              disabled={isGenerating}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all flex-shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Changes Preview Modal */}
      <ArtifactChangesPreview
        changes={fileChanges}
        onApply={handleApplyChanges}
        onReject={handleRejectChanges}
        isOpen={showPreview}
      />
    </div>
  )
}
