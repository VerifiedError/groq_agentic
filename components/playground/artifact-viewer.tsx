'use client'

import { useState, useEffect } from 'react'
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
  Download,
  Copy,
  Trash2,
  MessageSquare,
  Undo2,
  Redo2,
  History,
  Settings,
  ChevronDown,
  Layout as LayoutIcon,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ArtifactType } from '@/lib/artifact-templates'
import { ArtifactChat } from './artifact-chat'
import { ArtifactVersionHistory } from './artifact-version-history'
import { IDESettingsPanel } from './ide-settings-panel'
import {
  initializeVersionHistory,
  addVersion,
  undo,
  redo,
  goToVersion,
  getVersionState,
  clearVersionHistory,
} from '@/lib/artifact-version-history'
import {
  loadLayoutSettings,
  saveLayoutSettings,
  LayoutSettings,
  LayoutPreset,
  getSandpackTheme,
  getPanelVisibility,
  getPresetInfo,
} from '@/lib/ide-layout-settings'

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
  // Layout settings
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(loadLayoutSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)

  // Version control
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versionState, setVersionState] = useState({
    canUndo: false,
    canRedo: false,
    currentIndex: 0,
    totalVersions: 0,
    currentVersion: null
  })

  // File state
  const [currentFiles, setCurrentFiles] = useState(artifact.files)

  // Initialize version history
  useEffect(() => {
    if (artifact.id) {
      initializeVersionHistory(artifact.id, artifact.files, 'Initial version')
      updateVersionState()
    }
  }, [artifact.id])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      // Redo: Ctrl/Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        handleRedo()
      }
      // Settings: Ctrl/Cmd+,
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        setShowSettings(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [artifact.id])

  // Auto-save settings when changed
  useEffect(() => {
    saveLayoutSettings(layoutSettings)
  }, [layoutSettings])

  const updateVersionState = () => {
    if (artifact.id) {
      const state = getVersionState(artifact.id)
      setVersionState(state)
    }
  }

  const handleSettingsChange = (newSettings: LayoutSettings) => {
    setLayoutSettings(newSettings)
  }

  const handleLayoutPreset = (preset: LayoutPreset) => {
    const presets = {
      'balanced': {
        ...layoutSettings,
        layout: preset,
        editorWidth: 50,
        previewWidth: 50,
        showFileTree: true,
        showConsole: false,
      },
      'code-focus': {
        ...layoutSettings,
        layout: preset,
        editorWidth: 70,
        previewWidth: 30,
        showFileTree: true,
        showConsole: true,
      },
      'preview-focus': {
        ...layoutSettings,
        layout: preset,
        editorWidth: 30,
        previewWidth: 70,
        showFileTree: false,
        showConsole: false,
      },
      'fullstack': {
        ...layoutSettings,
        layout: preset,
        editorWidth: 50,
        previewWidth: 50,
        showFileTree: true,
        showConsole: true,
      },
    }

    setLayoutSettings(presets[preset])
    setShowLayoutMenu(false)
  }

  const handleDownload = () => {
    const zip = Object.entries(currentFiles)
      .map(([filename, content]) => `// ${filename}\n${content}\n\n`)
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
    const allCode = Object.entries(currentFiles)
      .map(([filename, content]) => `// ${filename}\n${content}`)
      .join('\n\n')
    navigator.clipboard.writeText(allCode)
    toast.success('Code copied to clipboard')
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this artifact?')) {
      if (artifact.id) {
        clearVersionHistory(artifact.id)
      }
      onDelete?.()
      toast.success('Artifact deleted')
    }
  }

  const handleApplyChanges = (newFiles: Record<string, string>) => {
    setCurrentFiles(newFiles)
    onSave?.(newFiles)

    if (artifact.id) {
      addVersion(artifact.id, newFiles, 'AI modification', 'chat-edit')
      updateVersionState()
    }

    toast.success('Changes applied successfully')
  }

  const handleUndo = () => {
    if (!artifact.id) return

    const previousFiles = undo(artifact.id)
    if (previousFiles) {
      setCurrentFiles(previousFiles)
      onSave?.(previousFiles)
      updateVersionState()
      toast.success('Undone to previous version')
    } else {
      toast.info('No more versions to undo')
    }
  }

  const handleRedo = () => {
    if (!artifact.id) return

    const nextFiles = redo(artifact.id)
    if (nextFiles) {
      setCurrentFiles(nextFiles)
      onSave?.(nextFiles)
      updateVersionState()
      toast.success('Redone to next version')
    } else {
      toast.info('No more versions to redo')
    }
  }

  const handleGoToVersion = (versionIndex: number) => {
    if (!artifact.id) return

    const versionFiles = goToVersion(artifact.id, versionIndex)
    if (versionFiles) {
      setCurrentFiles(versionFiles)
      onSave?.(versionFiles)
      updateVersionState()
      toast.success(`Restored to version ${versionIndex + 1}`)
    }
  }

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

  const sandpackFiles = { ...currentFiles }
  const customSetup = artifact.dependencies ? { dependencies: artifact.dependencies } : undefined
  const panelVisibility = getPanelVisibility(layoutSettings)
  const sandpackTheme = getSandpackTheme(layoutSettings.theme)

  const presets: LayoutPreset[] = ['balanced', 'code-focus', 'preview-focus', 'fullstack']

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2.5 gap-4">
        {/* Left: Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0">
            <h2 className="text-base font-semibold truncate">{artifact.title}</h2>
            {artifact.description && (
              <p className="text-xs text-muted-foreground truncate">{artifact.description}</p>
            )}
          </div>
        </div>

        {/* Center: Layout & Tools */}
        <div className="flex items-center gap-2">
          {/* Layout Menu */}
          <div className="relative">
            <button
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-accent transition-colors"
            >
              <LayoutIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Layout</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showLayoutMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLayoutMenu(false)}
                />
                <div className="absolute top-full mt-1 right-0 z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-[200px]">
                  {presets.map((preset) => {
                    const info = getPresetInfo(preset)
                    const isActive = layoutSettings.layout === preset

                    return (
                      <button
                        key={preset}
                        onClick={() => handleLayoutPreset(preset)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        )}
                      >
                        <span>{info.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{info.name}</div>
                          <div className="text-xs opacity-80">{info.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Tools Menu */}
          <div className="relative">
            <button
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-accent transition-colors"
            >
              <Wrench className="h-4 w-4" />
              <span className="text-sm font-medium">Tools</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showToolsMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowToolsMenu(false)}
                />
                <div className="absolute top-full mt-1 right-0 z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-[180px]">
                  <button
                    onClick={() => {
                      setLayoutSettings({ ...layoutSettings, showFileTree: !layoutSettings.showFileTree })
                      setShowToolsMenu(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-sm"
                  >
                    <span>File Tree</span>
                    <input
                      type="checkbox"
                      checked={layoutSettings.showFileTree}
                      onChange={() => {}}
                      className="w-4 h-4 rounded"
                    />
                  </button>
                  <button
                    onClick={() => {
                      setLayoutSettings({ ...layoutSettings, showConsole: !layoutSettings.showConsole })
                      setShowToolsMenu(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-sm"
                  >
                    <span>Console</span>
                    <input
                      type="checkbox"
                      checked={layoutSettings.showConsole}
                      onChange={() => {}}
                      className="w-4 h-4 rounded"
                    />
                  </button>
                  <button
                    onClick={() => {
                      setLayoutSettings({ ...layoutSettings, showChat: !layoutSettings.showChat })
                      setShowToolsMenu(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-sm"
                  >
                    <span>AI Chat</span>
                    <input
                      type="checkbox"
                      checked={layoutSettings.showChat}
                      onChange={() => {}}
                      className="w-4 h-4 rounded"
                    />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Version Controls */}
          {artifact.id && (
            <>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={!versionState.canUndo}
                  className={cn(
                    'p-2 rounded-lg border transition-colors',
                    versionState.canUndo
                      ? 'hover:bg-accent'
                      : 'opacity-50 cursor-not-allowed'
                  )}
                  title="Undo (Ctrl/Cmd+Z)"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!versionState.canRedo}
                  className={cn(
                    'p-2 rounded-lg border transition-colors',
                    versionState.canRedo
                      ? 'hover:bg-accent'
                      : 'opacity-50 cursor-not-allowed'
                  )}
                  title="Redo (Ctrl/Cmd+Shift+Z)"
                >
                  <Redo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowVersionHistory(true)}
                  className="p-2 rounded-lg border hover:bg-accent transition-colors"
                  title={`Version history (${versionState.totalVersions} versions)`}
                >
                  <History className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {/* Settings */}
          <div className="h-6 w-px bg-border" />
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg border hover:bg-accent transition-colors"
            title="Settings (Ctrl/Cmd+,)"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
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
          <div className="h-6 w-px bg-border" />
          <button
            onClick={onClose}
            className="p-2 rounded-lg border hover:bg-accent transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* IDE Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Code Area */}
        <div className="flex-1 overflow-hidden">
          <SandpackProvider
            template={getTemplate()}
            files={sandpackFiles}
            customSetup={customSetup}
            theme={sandpackTheme}
            options={{
              externalResources: [
                'https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js',
              ],
            }}
          >
            <SandpackLayout style={{ height: '100%', border: 'none' }}>
              {/* File Tree */}
              {panelVisibility.showFileTree && (
                <div style={{ width: `${layoutSettings.fileTreeWidth}px`, borderRight: '1px solid hsl(var(--border))' }}>
                  <SandpackFileExplorer />
                </div>
              )}

              {/* Editor */}
              {panelVisibility.showCode && layoutSettings.editorWidth > 0 && (
                <div style={{ flex: layoutSettings.editorWidth }}>
                  <SandpackCodeEditor
                    style={{
                      height: layoutSettings.showConsole
                        ? `calc(100% - ${layoutSettings.consoleHeight}px)`
                        : '100%',
                    }}
                    showTabs
                    showLineNumbers={layoutSettings.lineNumbers}
                    showInlineErrors
                    wrapContent={layoutSettings.lineWrap}
                  />
                  {layoutSettings.showConsole && (
                    <div style={{
                      height: `${layoutSettings.consoleHeight}px`,
                      borderTop: '1px solid hsl(var(--border))',
                    }}>
                      <SandpackConsole />
                    </div>
                  )}
                </div>
              )}

              {/* Preview */}
              {panelVisibility.showPreview && layoutSettings.previewWidth > 0 && (
                <div style={{ flex: layoutSettings.previewWidth }}>
                  <SandpackPreview
                    style={{ height: '100%' }}
                    showOpenInCodeSandbox={false}
                    showRefreshButton
                  />
                </div>
              )}
            </SandpackLayout>
          </SandpackProvider>
        </div>

        {/* AI Chat Panel */}
        {layoutSettings.showChat && artifact.id && (
          <div
            className="border-l bg-card"
            style={{ width: `${layoutSettings.chatWidth}px` }}
          >
            <ArtifactChat
              artifactId={artifact.id}
              artifactTitle={artifact.title}
              currentFiles={currentFiles}
              onApplyChanges={handleApplyChanges}
              onClose={() => setLayoutSettings({ ...layoutSettings, showChat: false })}
              isOpen={layoutSettings.showChat}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {artifact.id && (
        <ArtifactVersionHistory
          artifactId={artifact.id}
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          onSelectVersion={handleGoToVersion}
          currentIndex={versionState.currentIndex}
        />
      )}

      <IDESettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={layoutSettings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}
