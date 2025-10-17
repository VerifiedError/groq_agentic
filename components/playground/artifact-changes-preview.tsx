'use client'

import { useState } from 'react'
import { Check, X, File, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileChange {
  path: string
  oldContent: string
  newContent: string
  action: 'modified' | 'created' | 'deleted'
}

interface ArtifactChangesPreviewProps {
  changes: FileChange[]
  onApply: () => void
  onReject: () => void
  isOpen: boolean
}

export function ArtifactChangesPreview({
  changes,
  onApply,
  onReject,
  isOpen,
}: ArtifactChangesPreviewProps) {
  const [selectedFile, setSelectedFile] = useState(0)

  if (!isOpen || changes.length === 0) return null

  const currentChange = changes[selectedFile]

  // Generate simple line-by-line diff
  const generateDiff = (oldContent: string, newContent: string) => {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const maxLines = Math.max(oldLines.length, newLines.length)
    const diff: Array<{ type: 'same' | 'removed' | 'added'; content: string; lineNumber?: number }> = []

    // Simple diff: compare line by line
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine === newLine) {
        diff.push({ type: 'same', content: oldLine || '', lineNumber: i + 1 })
      } else {
        if (oldLine !== undefined) {
          diff.push({ type: 'removed', content: oldLine, lineNumber: i + 1 })
        }
        if (newLine !== undefined) {
          diff.push({ type: 'added', content: newLine, lineNumber: i + 1 })
        }
      }
    }

    return diff
  }

  const diff =
    currentChange.action === 'modified'
      ? generateDiff(currentChange.oldContent, currentChange.newContent)
      : []

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg max-w-5xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Review Code Changes</h2>
            <span className="text-sm text-muted-foreground">
              ({changes.length} file{changes.length !== 1 ? 's' : ''} changed)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReject}
              className="px-4 py-2 rounded-lg border hover:bg-accent transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={onApply}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Apply Changes
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* File List Sidebar */}
          <div className="w-64 border-r overflow-y-auto">
            <div className="p-2 space-y-1">
              {changes.map((change, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedFile(index)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm',
                    selectedFile === index
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <File className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 truncate">
                    <div className="truncate">{change.path}</div>
                    <div
                      className={cn(
                        'text-xs',
                        selectedFile === index
                          ? 'opacity-80'
                          : 'text-muted-foreground'
                      )}
                    >
                      {change.action === 'modified' && 'Modified'}
                      {change.action === 'created' && 'Created'}
                      {change.action === 'deleted' && 'Deleted'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Diff View */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1">
                  {currentChange.path}
                </h3>
                <div
                  className={cn(
                    'text-xs px-2 py-1 rounded inline-block',
                    currentChange.action === 'modified' &&
                      'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
                    currentChange.action === 'created' &&
                      'bg-green-500/20 text-green-700 dark:text-green-400',
                    currentChange.action === 'deleted' &&
                      'bg-red-500/20 text-red-700 dark:text-red-400'
                  )}
                >
                  {currentChange.action}
                </div>
              </div>

              {/* Show diff for modified files */}
              {currentChange.action === 'modified' && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-card">
                    {diff.map((line, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex font-mono text-xs',
                          line.type === 'removed' &&
                            'bg-red-500/10 text-red-700 dark:text-red-400',
                          line.type === 'added' &&
                            'bg-green-500/10 text-green-700 dark:text-green-400'
                        )}
                      >
                        <div className="w-12 flex-shrink-0 text-right px-2 py-1 text-muted-foreground border-r select-none">
                          {line.lineNumber}
                        </div>
                        <div className="w-6 flex-shrink-0 text-center py-1 select-none">
                          {line.type === 'removed' && '-'}
                          {line.type === 'added' && '+'}
                        </div>
                        <div className="flex-1 px-2 py-1 overflow-x-auto">
                          {line.content || ' '}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show full content for created files */}
              {currentChange.action === 'created' && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-green-500/10">
                    <pre className="p-4 overflow-x-auto">
                      <code className="text-xs font-mono">
                        {currentChange.newContent}
                      </code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Show deleted content */}
              {currentChange.action === 'deleted' && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-red-500/10">
                    <pre className="p-4 overflow-x-auto">
                      <code className="text-xs font-mono line-through opacity-60">
                        {currentChange.oldContent}
                      </code>
                    </pre>
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
