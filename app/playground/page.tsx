'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Play, Trash2, Copy, Loader2, Settings2 } from 'lucide-react'
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
  role: 'system' | 'user' | 'assistant'
  content: string
}

export default function PlaygroundPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Models
  const [models, setModels] = useState<Model[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [selectedModel, setSelectedModel] = useState('')

  // Input
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [showParams, setShowParams] = useState(false)

  // Parameters
  const [temperature, setTemperature] = useState(1)
  const [maxTokens, setMaxTokens] = useState(1024)
  const [topP, setTopP] = useState(1)
  const [stop, setStop] = useState('')

  // Output
  const [output, setOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [usage, setUsage] = useState<any>(null)
  const [cost, setCost] = useState<number | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true)
        const response = await fetch('/api/models')
        if (!response.ok) throw new Error('Failed to fetch models')

        const data = await response.json()
        setModels(data.models || [])

        // Set default model
        if (data.models && data.models.length > 0) {
          setSelectedModel(data.models[0].id)
        }
      } catch (error) {
        console.error('Error fetching models:', error)
        toast.error('Failed to load models')
      } finally {
        setIsLoadingModels(false)
      }
    }

    if (status === 'authenticated') {
      fetchModels()
    }
  }, [status])

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (!selectedModel) {
      toast.error('Please select a model')
      return
    }

    setIsGenerating(true)
    setOutput('')
    setUsage(null)
    setCost(null)

    try {
      // Build messages array
      const messages: Message[] = []
      if (systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt.trim() })
      }
      messages.push({ role: 'user', content: userPrompt.trim() })

      // Parse stop sequences
      const stopSequences = stop
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      const response = await fetch('/api/playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature,
          maxTokens,
          topP,
          stop: stopSequences.length > 0 ? stopSequences : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate response')
      }

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.error) {
                throw new Error(data.error)
              }

              if (data.content) {
                setOutput((prev) => prev + data.content)
              }

              if (data.done) {
                if (data.usage) {
                  setUsage(data.usage)
                }
                if (data.cost !== undefined) {
                  setCost(typeof data.cost === 'number' ? data.cost : parseFloat(data.cost) || 0)
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      toast.success('Response generated')
    } catch (error: any) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Failed to generate response')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClear = () => {
    setUserPrompt('')
    setOutput('')
    setUsage(null)
    setCost(null)
  }

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output)
    toast.success('Output copied to clipboard')
  }

  if (status === 'loading' || isLoadingModels) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Playground</h1>
              <p className="text-sm text-muted-foreground">
                Test Groq models with custom parameters
              </p>
            </div>

            {/* Model Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Model:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.displayName}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowParams(!showParams)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                title="Toggle parameters"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 py-6 h-full">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left: Input */}
            <div className="flex flex-col gap-4 h-full">
              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  System Prompt (Optional)
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a helpful assistant..."
                  className="w-full h-24 px-3 py-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* User Prompt */}
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium mb-2">
                  User Prompt
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Enter your prompt here..."
                  className="flex-1 w-full px-3 py-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Parameters Panel */}
              {showParams && (
                <div className="border rounded-lg p-4 space-y-3 bg-card">
                  <h3 className="text-sm font-semibold mb-3">Parameters</h3>

                  {/* Temperature */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm">Temperature</label>
                      <span className="text-sm text-muted-foreground">
                        {temperature}
                      </span>
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
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm">Max Tokens</label>
                      <span className="text-sm text-muted-foreground">
                        {maxTokens}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="32000"
                      step="100"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Top P */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm">Top P</label>
                      <span className="text-sm text-muted-foreground">
                        {topP}
                      </span>
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
                  </div>

                  {/* Stop Sequences */}
                  <div>
                    <label className="text-sm block mb-1">
                      Stop Sequences (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={stop}
                      onChange={(e) => setStop(e.target.value)}
                      placeholder="e.g., \n, END"
                      className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !userPrompt.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  disabled={isGenerating}
                  className="px-4 py-2 border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                  title="Clear"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Output */}
            <div className="flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Output</label>
                {output && (
                  <button
                    onClick={handleCopyOutput}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-accent transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                )}
              </div>

              {/* Output Display */}
              <div className="flex-1 p-4 bg-card border rounded-lg overflow-y-auto">
                {output ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{output}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Output will appear here...
                  </p>
                )}
              </div>

              {/* Stats */}
              {(usage || cost !== null) && (
                <div className="p-4 bg-card border rounded-lg">
                  <h3 className="text-sm font-semibold mb-2">Statistics</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {usage && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Input Tokens:</span>
                          <span className="ml-2 font-medium">
                            {usage.prompt_tokens?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Output Tokens:</span>
                          <span className="ml-2 font-medium">
                            {usage.completion_tokens?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Tokens:</span>
                          <span className="ml-2 font-medium">
                            {usage.total_tokens?.toLocaleString() || 0}
                          </span>
                        </div>
                        {usage.cached_tokens > 0 && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Cached Tokens:</span>
                              <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                                {usage.cached_tokens?.toLocaleString() || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cache Hit Rate:</span>
                              <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                                {((usage.cached_tokens / (usage.prompt_tokens || 1)) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {cost !== null && typeof cost === 'number' && (
                      <div>
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="ml-2 font-medium text-primary">
                          ${cost.toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
