'use client'

import { useState } from 'react'
import { Code, Play, Eye, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ArtifactType } from '@/lib/artifact-templates'

interface ArtifactCardProps {
  artifact: {
    id: string
    type: ArtifactType
    title: string
    description?: string
    files: Record<string, string>
  }
  onOpen: () => void
}

export function ArtifactCard({ artifact, onOpen }: ArtifactCardProps) {
  const fileCount = Object.keys(artifact.files).length
  const mainFile = Object.keys(artifact.files)[0]
  const preview = artifact.files[mainFile]?.slice(0, 200) || ''

  // Get icon based on artifact type
  const getTypeIcon = () => {
    switch (artifact.type) {
      case 'react':
      case 'react-game-3d':
      case 'react-game-2d':
        return '⚛️'
      case 'html':
        return '🌐'
      case 'vanilla-js':
        return '📜'
      default:
        return '💻'
    }
  }

  // Get type label
  const getTypeLabel = () => {
    switch (artifact.type) {
      case 'react':
        return 'React App'
      case 'react-game-3d':
        return '3D Game'
      case 'react-game-2d':
        return '2D Game'
      case 'html':
        return 'Web Page'
      case 'vanilla-js':
        return 'JavaScript'
      default:
        return 'Code'
    }
  }

  return (
    <div className="my-3 rounded-lg border bg-card overflow-hidden max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getTypeIcon()}</span>
          <div>
            <h3 className="font-semibold text-sm">{artifact.title}</h3>
            <p className="text-xs text-muted-foreground">
              {getTypeLabel()} • {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpen}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Open IDE
        </button>
      </div>

      {/* Code Preview */}
      <div className="p-3 bg-muted/10">
        <div className="relative">
          <div className="text-xs font-mono text-muted-foreground mb-1">
            {mainFile}
          </div>
          <pre className="text-xs font-mono bg-background rounded p-2 overflow-x-auto max-h-32 overflow-y-hidden">
            <code className="text-muted-foreground">{preview}...</code>
          </pre>
        </div>

        {artifact.description && (
          <p className="text-xs text-muted-foreground mt-2">
            {artifact.description}
          </p>
        )}
      </div>

      {/* Footer with file list */}
      {fileCount > 1 && (
        <div className="px-3 py-2 border-t bg-muted/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Files:</span>
            {Object.keys(artifact.files).map((filename) => (
              <span
                key={filename}
                className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono"
              >
                {filename.replace(/^\//, '')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
