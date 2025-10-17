'use client'

import { useState, useEffect } from 'react'
import { X, Clock, Check, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ArtifactVersion,
  getAllVersions,
  formatVersionTime,
  getVersionState
} from '@/lib/artifact-version-history'

interface ArtifactVersionHistoryProps {
  artifactId: string
  isOpen: boolean
  onClose: () => void
  onSelectVersion: (versionIndex: number) => void
  currentIndex: number
}

export function ArtifactVersionHistory({
  artifactId,
  isOpen,
  onClose,
  onSelectVersion,
  currentIndex
}: ArtifactVersionHistoryProps) {
  const [versions, setVersions] = useState<ArtifactVersion[]>([])

  useEffect(() => {
    if (isOpen) {
      const allVersions = getAllVersions(artifactId)
      setVersions(allVersions)
    }
  }, [artifactId, isOpen, currentIndex])

  if (!isOpen) return null

  const getActionLabel = (action: ArtifactVersion['action']): string => {
    switch (action) {
      case 'initial':
        return 'Initial version'
      case 'chat-edit':
        return 'AI modification'
      case 'manual-edit':
        return 'Manual edit'
      case 'restored':
        return 'Restored version'
      default:
        return 'Modified'
    }
  }

  const getActionColor = (action: ArtifactVersion['action']): string => {
    switch (action) {
      case 'initial':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'chat-edit':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'manual-edit':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'restored':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Version History</h2>
            <span className="text-sm text-muted-foreground">
              ({versions.length} version{versions.length !== 1 ? 's' : ''})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto p-4">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No version history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => {
                const isCurrent = index === currentIndex
                const fileCount = Object.keys(version.files).length

                return (
                  <button
                    key={version.id}
                    onClick={() => {
                      onSelectVersion(index)
                      onClose()
                    }}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border transition-all',
                      isCurrent
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'hover:bg-accent hover:border-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Description */}
                        <div className="flex items-center gap-2 mb-2">
                          {isCurrent && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <p
                            className={cn(
                              'font-medium truncate',
                              isCurrent ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {version.description}
                          </p>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatVersionTime(version.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileCode className="h-3 w-3" />
                            {fileCount} file{fileCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Action Badge */}
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded border whitespace-nowrap',
                          getActionColor(version.action)
                        )}
                      >
                        {getActionLabel(version.action)}
                      </span>
                    </div>

                    {/* Version Number */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Version {index + 1} of {versions.length}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground text-center">
            Click any version to restore it. Current position:{' '}
            <span className="font-medium text-foreground">
              {currentIndex + 1} of {versions.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
