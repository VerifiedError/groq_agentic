'use client'

import { useState, useEffect, useRef } from 'react'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from '@codesandbox/sandpack-react'
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FilePlus,
  FileEdit,
  Trash2,
  Package,
  Brain,
  Play,
  Pause,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  AnyWorkspaceCommand,
  WorkspaceState,
  parseWorkspaceCommands,
  applyWorkspaceCommands,
} from '@/lib/workspace-protocol'

interface WorkspaceIDEProps {
  request: string
  onClose: () => void
  model?: string
}

export function WorkspaceIDE({ request, onClose, model = 'llama-3.3-70b-versatile' }: WorkspaceIDEProps) {
  const [isBuilding, setIsBuilding] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    files: {},
    dependencies: {},
    operations: [],
    isComplete: false,
  })
  const [currentThought, setCurrentThought] = useState<string>('')
  const [streamingText, setStreamingText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const operationsEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasStartedRef = useRef(false)

  // Auto-scroll operations log
  useEffect(() => {
    operationsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [workspaceState.operations])

  // Start building on mount (only once)
  useEffect(() => {
    if (!hasStartedRef.current && !isPaused) {
      hasStartedRef.current = true
      startBuilding()
    }
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const startBuilding = async () => {
    setIsBuilding(true)
    setError(null)

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/workspace/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, model }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to start workspace builder')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

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
                  accumulatedText += data.content
                  setStreamingText(accumulatedText)

                  // Parse commands from accumulated text
                  const commands = parseWorkspaceCommands(accumulatedText)

                  // Apply commands to state
                  setWorkspaceState((prev) => {
                    const newState = applyWorkspaceCommands(prev, commands.slice(prev.operations.length))

                    // Update current thought
                    const lastThought = commands
                      .reverse()
                      .find((cmd) => cmd.type === 'thought')
                    if (lastThought && lastThought.type === 'thought') {
                      setCurrentThought(lastThought.message)
                    }

                    return newState
                  })
                }

                if (data.done) {
                  setIsBuilding(false)
                  if (workspaceState.isComplete) {
                    toast.success('Workspace build complete!')
                  }
                }

                if (data.error) {
                  throw new Error(data.error)
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info('Build paused')
      } else {
        console.error('Build error:', error)
        setError(error.message || 'Failed to build workspace')
        toast.error('Build failed')
      }
      setIsBuilding(false)
    }
  }

  const handlePauseResume = () => {
    if (isBuilding) {
      abortControllerRef.current?.abort()
      setIsPaused(true)
      setIsBuilding(false)
    } else if (isPaused) {
      setIsPaused(false)
      hasStartedRef.current = false // Allow restart
      startBuilding()
    }
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'create-file':
        return <FilePlus className="h-4 w-4 text-green-500" />
      case 'edit-file':
        return <FileEdit className="h-4 w-4 text-blue-500" />
      case 'delete-file':
        return <Trash2 className="h-4 w-4 text-red-500" />
      case 'install-package':
        return <Package className="h-4 w-4 text-purple-500" />
      case 'thought':
        return <Brain className="h-4 w-4 text-yellow-500" />
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      default:
        return <FileCode className="h-4 w-4" />
    }
  }

  const getOperationDescription = (operation: AnyWorkspaceCommand): string => {
    switch (operation.type) {
      case 'create-file':
        return `Created ${operation.path}`
      case 'edit-file':
        return `Edited ${operation.path} (${operation.action})`
      case 'delete-file':
        return `Deleted ${operation.path}`
      case 'install-package':
        return `Installed ${operation.name}@${operation.version}`
      case 'thought':
        return operation.message
      case 'complete':
        return `✓ ${operation.summary}`
      default:
        return 'Unknown operation'
    }
  }

  // Prepare Sandpack files
  const sandpackFiles = { ...workspaceState.files }
  if (Object.keys(sandpackFiles).length === 0) {
    sandpackFiles['/App.tsx'] = '// Building...'
  }

  const sandpackDependencies = workspaceState.dependencies

  return (
    <div className="fixed inset-0 z-[500] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {isBuilding && <Loader2 className="h-4 w-4 animate-spin" />}
              {workspaceState.isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              Workspace Builder
            </h2>
            <p className="text-sm text-muted-foreground">{request}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause/Resume Button */}
          <button
            onClick={handlePauseResume}
            disabled={workspaceState.isComplete}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              workspaceState.isComplete
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-accent'
            )}
            title={isBuilding ? 'Pause' : 'Resume'}
          >
            {isBuilding ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>

          <div className="h-6 w-px bg-border mx-2" />

          <button
            onClick={onClose}
            className="p-2 rounded-lg border hover:bg-accent transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Operations Log */}
        <div className="w-96 border-r bg-card flex flex-col">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Agent Activity
            </h3>
            {currentThought && (
              <p className="text-xs text-muted-foreground mt-2 flex items-start gap-2">
                <Loader2 className="h-3 w-3 animate-spin mt-0.5 flex-shrink-0" />
                <span>{currentThought}</span>
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {workspaceState.operations.map((operation, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg text-sm',
                  operation.type === 'thought'
                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                    : operation.type === 'complete'
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-accent'
                )}
              >
                <div className="mt-0.5">{getOperationIcon(operation.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {operation.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="break-words">{getOperationDescription(operation)}</div>
                </div>
              </div>
            ))}

            {error && (
              <div className="flex items-start gap-2 p-2 rounded-lg text-sm bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <div ref={operationsEndRef} />
          </div>

          {/* Stats */}
          <div className="p-3 border-t bg-background">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Files</div>
                <div className="font-semibold">{Object.keys(workspaceState.files).length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Operations</div>
                <div className="font-semibold">{workspaceState.operations.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Code Editor and Preview */}
        <div className="flex-1 overflow-hidden">
          <SandpackProvider
            template="react"
            files={sandpackFiles}
            customSetup={
              Object.keys(sandpackDependencies).length > 0
                ? { dependencies: sandpackDependencies }
                : undefined
            }
            theme="dark"
            options={{
              externalResources: [
                'https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js',
              ],
            }}
          >
            <SandpackLayout style={{ height: '100%', border: 'none' }}>
              {/* File Explorer */}
              {Object.keys(sandpackFiles).length > 1 && (
                <div style={{ width: '200px', borderRight: '1px solid hsl(var(--border))' }}>
                  <SandpackFileExplorer />
                </div>
              )}

              {/* Code Editor */}
              <SandpackCodeEditor
                style={{ height: '100%' }}
                showTabs
                showLineNumbers
                showInlineErrors
                wrapContent
                readOnly
              />

              {/* Preview */}
              <SandpackPreview
                style={{ height: '100%' }}
                showOpenInCodeSandbox={false}
                showRefreshButton
              />
            </SandpackLayout>
          </SandpackProvider>
        </div>
      </div>
    </div>
  )
}
