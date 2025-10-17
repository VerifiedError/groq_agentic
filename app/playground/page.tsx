'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Play, Trash2, Copy, Loader2, Settings2, ChevronDown, ChevronUp, BarChart3, Clock } from 'lucide-react'
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

interface RequestLog {
  id: string
  timestamp: Date
  model: string
  modelDisplayName: string
  prompt: string
  promptPreview: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  totalTokens: number
  cost: number
  cacheHitRate: number | null
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

  // Request history
  const [requestHistory, setRequestHistory] = useState<RequestLog[]>([])
  const [showHistory, setShowHistory] = useState(true)

  // Load request history and prompts from localStorage
  useEffect(() => {
    try {
      // Load request history
      const savedHistory = localStorage.getItem('playground-request-history')
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        // Convert timestamp strings back to Date objects
        const history = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }))
        setRequestHistory(history)
      }

      // Load saved prompts
      const savedSystemPrompt = localStorage.getItem('playground-system-prompt')
      if (savedSystemPrompt) {
        setSystemPrompt(savedSystemPrompt)
      }

      const savedUserPrompt = localStorage.getItem('playground-user-prompt')
      if (savedUserPrompt) {
        setUserPrompt(savedUserPrompt)
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
  }, [])

  // Save request history to localStorage
  useEffect(() => {
    if (requestHistory.length > 0) {
      try {
        localStorage.setItem('playground-request-history', JSON.stringify(requestHistory))
      } catch (error) {
        console.error('Failed to save request history:', error)
      }
    }
  }, [requestHistory])

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
                  const finalCost = typeof data.cost === 'number' ? data.cost : parseFloat(data.cost) || 0
                  setCost(finalCost)

                  // Save to request history
                  if (data.usage) {
                    const promptPreview = userPrompt.trim().substring(0, 100) + (userPrompt.trim().length > 100 ? '...' : '')
                    const cachedTokens = data.usage.cached_tokens || 0
                    const inputTokens = data.usage.prompt_tokens || 0
                    const cacheHitRate = cachedTokens > 0 && inputTokens > 0
                      ? (cachedTokens / inputTokens) * 100
                      : null

                    const selectedModelObj = models.find(m => m.id === selectedModel)

                    const newLog: RequestLog = {
                      id: Date.now().toString(),
                      timestamp: new Date(),
                      model: selectedModel,
                      modelDisplayName: selectedModelObj?.displayName || selectedModel,
                      prompt: userPrompt.trim(),
                      promptPreview,
                      inputTokens: data.usage.prompt_tokens || 0,
                      outputTokens: data.usage.completion_tokens || 0,
                      cachedTokens,
                      totalTokens: data.usage.total_tokens || 0,
                      cost: finalCost,
                      cacheHitRate,
                    }

                    setRequestHistory(prev => [newLog, ...prev].slice(0, 50)) // Keep last 50 requests
                  }
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

  const handleClearHistory = () => {
    setRequestHistory([])
    localStorage.removeItem('playground-request-history')
    toast.success('Request history cleared')
  }

  const handleSystemPromptBlur = () => {
    try {
      localStorage.setItem('playground-system-prompt', systemPrompt)
    } catch (error) {
      console.error('Failed to save system prompt:', error)
    }
  }

  const handleUserPromptBlur = () => {
    try {
      localStorage.setItem('playground-user-prompt', userPrompt)
    } catch (error) {
      console.error('Failed to save user prompt:', error)
    }
  }

  // Calculate overall statistics
  const overallStats = requestHistory.length > 0 ? {
    totalRequests: requestHistory.length,
    totalInputTokens: requestHistory.reduce((sum, log) => sum + log.inputTokens, 0),
    totalOutputTokens: requestHistory.reduce((sum, log) => sum + log.outputTokens, 0),
    totalCachedTokens: requestHistory.reduce((sum, log) => sum + log.cachedTokens, 0),
    totalCost: requestHistory.reduce((sum, log) => sum + log.cost, 0),
    avgCacheHitRate: requestHistory.filter(log => log.cacheHitRate !== null).length > 0
      ? requestHistory.filter(log => log.cacheHitRate !== null).reduce((sum, log) => sum + (log.cacheHitRate || 0), 0) / requestHistory.filter(log => log.cacheHitRate !== null).length
      : null
  } : null

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

        {/* Overall Usage Statistics */}
        {overallStats && (
          <div className="container mx-auto px-4 pt-2 pb-1">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-md border text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{overallStats.totalRequests} requests</span>
                </div>
                <div className="text-muted-foreground">|</div>
                <div>
                  <span className="text-muted-foreground">Tokens:</span>
                  <span className="ml-1.5 font-medium">{overallStats.totalInputTokens.toLocaleString()}↑ / {overallStats.totalOutputTokens.toLocaleString()}↓</span>
                  {overallStats.totalCachedTokens > 0 && (
                    <span className="ml-1.5 text-green-600 dark:text-green-400 font-medium">
                      ({overallStats.totalCachedTokens.toLocaleString()} cached)
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground">|</div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="ml-1.5 font-medium text-primary">${overallStats.totalCost.toFixed(4)}</span>
                </div>
                {overallStats.avgCacheHitRate !== null && (
                  <>
                    <div className="text-muted-foreground">|</div>
                    <div>
                      <span className="text-muted-foreground">Avg Cache:</span>
                      <span className="ml-1.5 font-medium text-green-600 dark:text-green-400">
                        {overallStats.avgCacheHitRate.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleClearHistory}
                className="text-xs px-2 py-1 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground"
                title="Clear history"
              >
                Clear
              </button>
            </div>
          </div>
        )}
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
                  onBlur={handleSystemPromptBlur}
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
                  onBlur={handleUserPromptBlur}
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

          {/* Request History */}
          {requestHistory.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Request History ({requestHistory.length})
                  {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showHistory && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Time</th>
                          <th className="text-left p-2 font-medium">Model</th>
                          <th className="text-left p-2 font-medium">Prompt</th>
                          <th className="text-right p-2 font-medium">In</th>
                          <th className="text-right p-2 font-medium">Out</th>
                          <th className="text-right p-2 font-medium">Cached</th>
                          <th className="text-right p-2 font-medium">Cache %</th>
                          <th className="text-right p-2 font-medium">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requestHistory.map((log) => (
                          <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-2 text-muted-foreground whitespace-nowrap">
                              {log.timestamp.toLocaleTimeString()}
                            </td>
                            <td className="p-2 text-muted-foreground whitespace-nowrap">
                              {log.modelDisplayName}
                            </td>
                            <td className="p-2 max-w-xs truncate" title={log.prompt}>
                              {log.promptPreview}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {log.inputTokens.toLocaleString()}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {log.outputTokens.toLocaleString()}
                            </td>
                            <td className="p-2 text-right font-mono text-green-600 dark:text-green-400">
                              {log.cachedTokens > 0 ? log.cachedTokens.toLocaleString() : '-'}
                            </td>
                            <td className="p-2 text-right font-mono text-green-600 dark:text-green-400">
                              {log.cacheHitRate !== null ? `${log.cacheHitRate.toFixed(1)}%` : '-'}
                            </td>
                            <td className="p-2 text-right font-mono text-primary">
                              ${log.cost.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
