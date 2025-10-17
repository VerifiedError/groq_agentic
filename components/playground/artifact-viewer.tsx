'use client'

import { useState } from 'react'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  SandpackConsole,
} from '@codesandbox/sandpack-react'
import {
  X,
  Play,
  Download,
  Copy,
  Trash2,
  Maximize2,
  Minimize2,
  Code,
  Eye,
  Terminal,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ArtifactType } from '@/lib/artifact-templates'

interface ArtifactViewerProps {
  artifact: {
    id?: string
    type: ArtifactType
    title: string
    description?: string
    files: Record<string, string>
    dependencies?: Record<string, string>
  }
  onClose: () => void
  onSave?: (files: Record<string, string>) => void
  onDelete?: () => void
}

export function ArtifactViewer({
  artifact,
  onClose,
  onSave,
  onDelete,
}: ArtifactViewerProps) {
  const [showConsole, setShowConsole] = useState(false)
  const [showFileTree, setShowFileTree] = useState(true)
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Determine Sandpack template based on artifact type
  const getTemplate = () => {
    switch (artifact.type) {
      case 'react':
      case 'react-game-3d':
      case 'react-game-2d':
        return 'react'
      case 'vanilla-js':
        return 'vanilla'
      case 'html':
        return 'static'
      default:
        return 'react'
    }
  }

  // Prepare files for Sandpack
  const sandpackFiles = { ...artifact.files }

  // Prepare custom setup with dependencies
  const customSetup = artifact.dependencies
    ? {
        dependencies: artifact.dependencies,
      }
    : undefined

  const handleDownload = () => {
    const zip = Object.entries(sandpackFiles)
      .map(([filename, content]) => {
        return `// ${filename}\n${content}\n\n`
      })
      .join('\n' + '='.repeat(80) + '\n')

    const blob = new Blob([zip], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title.toLowerCase().replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Project downloaded')
  }

  const handleCopy = () => {
    const allCode = Object.entries(sandpackFiles)
      .map(([filename, content]) => `// ${filename}\n${content}`)
      .join('\n\n')
    navigator.clipboard.writeText(allCode)
    toast.success('Code copied to clipboard')
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this artifact?')) {
      onDelete?.()
      toast.success('Artifact deleted')
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background',
        isFullscreen ? 'p-0' : 'p-4'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold">{artifact.title}</h2>
            {artifact.description && (
              <p className="text-sm text-muted-foreground">
                {artifact.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <button
              onClick={() => setViewMode('code')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'code'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
              title="Code only"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'split'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
              title="Split view"
            >
              <div className="flex gap-0.5">
                <div className="h-4 w-1.5 bg-current rounded" />
                <div className="h-4 w-1.5 bg-current rounded" />
              </div>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'preview'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
              title="Preview only"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          {/* Console Toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              showConsole
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            )}
            title="Toggle console"
          >
            <Terminal className="h-4 w-4" />
          </button>

          {/* File Tree Toggle */}
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              showFileTree ? 'bg-accent' : 'hover:bg-accent'
            )}
            title="Toggle file tree"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M3 12h18M3 17h18"
              />
            </svg>
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg border hover:bg-accent transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* Actions */}
          <div className="h-6 w-px bg-border mx-2" />

          <button
            onClick={handleCopy}
            className="p-2 rounded-lg border hover:bg-accent transition-colors"
            title="Copy code"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-lg border hover:bg-accent transition-colors"
            title="Download project"
          >
            <Download className="h-4 w-4" />
          </button>

          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg border hover:bg-destructive hover:text-destructive-foreground transition-colors"
              title="Delete artifact"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

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

      {/* Sandpack IDE */}
      <div className="h-[calc(100vh-4rem-2rem)] overflow-hidden">
        <SandpackProvider
          template={getTemplate()}
          files={sandpackFiles}
          customSetup={customSetup}
          theme="dark"
          options={{
            externalResources: [
              'https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js',
            ],
          }}
        >
          <SandpackLayout
            style={{
              height: '100%',
              border: 'none',
            }}
          >
            {/* File Tree */}
            {showFileTree && (
              <div style={{ width: '200px', borderRight: '1px solid hsl(var(--border))' }}>
                <SandpackFileExplorer />
              </div>
            )}

            {/* Code Editor */}
            {(viewMode === 'code' || viewMode === 'split') && (
              <SandpackCodeEditor
                style={{
                  height: showConsole ? 'calc(100% - 200px)' : '100%',
                }}
                showTabs
                showLineNumbers
                showInlineErrors
                wrapContent
              />
            )}

            {/* Preview */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <SandpackPreview
                style={{
                  height: showConsole ? 'calc(100% - 200px)' : '100%',
                }}
                showOpenInCodeSandbox={false}
                showRefreshButton
              />
            )}

            {/* Console (at bottom if enabled) */}
            {showConsole && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '200px',
                borderTop: '1px solid hsl(var(--border))',
              }}>
                <SandpackConsole />
              </div>
            )}
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  )
}
