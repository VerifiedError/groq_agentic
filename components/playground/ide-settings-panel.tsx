'use client'

import { X, Layout, Palette, Type, Settings2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LayoutSettings,
  LayoutPreset,
  EditorTheme,
  getPresetInfo,
  getThemeInfo,
  resetToDefaults,
} from '@/lib/ide-layout-settings'

interface IDESettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: LayoutSettings
  onSettingsChange: (settings: LayoutSettings) => void
}

export function IDESettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: IDESettingsPanelProps) {
  if (!isOpen) return null

  const updateSetting = <K extends keyof LayoutSettings>(
    key: K,
    value: LayoutSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  const handlePresetClick = (preset: LayoutPreset) => {
    // Apply preset by manually setting values
    const presets = {
      'balanced': {
        layout: preset,
        editorWidth: 50,
        previewWidth: 50,
        showFileTree: true,
        showConsole: false,
      },
      'code-focus': {
        layout: preset,
        editorWidth: 70,
        previewWidth: 30,
        showFileTree: true,
        showConsole: true,
      },
      'preview-focus': {
        layout: preset,
        editorWidth: 30,
        previewWidth: 70,
        showFileTree: false,
        showConsole: false,
      },
      'fullstack': {
        layout: preset,
        editorWidth: 50,
        previewWidth: 50,
        showFileTree: true,
        showConsole: true,
      },
    }

    onSettingsChange({ ...settings, ...presets[preset] })
  }

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      onSettingsChange(resetToDefaults())
    }
  }

  const presets: LayoutPreset[] = ['balanced', 'code-focus', 'preview-focus', 'fullstack']
  const themes: EditorTheme[] = ['dark', 'light', 'github-dark', 'github-light', 'monokai', 'dracula']

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings2 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">IDE Settings</h2>
              <p className="text-sm text-muted-foreground">Customize your coding environment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Layout Presets */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Layout className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Layout Presets</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Quick layouts for different workflows
            </p>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => {
                const info = getPresetInfo(preset)
                const isActive = settings.layout === preset

                return (
                  <button
                    key={preset}
                    onClick={() => handlePresetClick(preset)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      isActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <span className="font-semibold">{info.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Editor Theme */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Editor Theme</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => {
                const info = getThemeInfo(theme)
                const isActive = settings.theme === theme

                return (
                  <button
                    key={theme}
                    onClick={() => updateSetting('theme', theme)}
                    className={cn(
                      'p-3 rounded-lg border transition-all text-left',
                      isActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    )}
                  >
                    <div className="font-medium text-sm">{info.name}</div>
                    <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Editor Preferences */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Editor Preferences</h3>
            </div>
            <div className="space-y-4">
              {/* Font Size */}
              <div>
                <label className="text-sm font-medium flex items-center justify-between mb-2">
                  <span>Font Size</span>
                  <span className="text-primary">{settings.fontSize}px</span>
                </label>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                  className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>12px</span>
                  <span>20px</span>
                </div>
              </div>

              {/* Tab Size */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tab Size</label>
                <div className="flex gap-2">
                  {[2, 4].map((size) => (
                    <button
                      key={size}
                      onClick={() => updateSetting('tabSize', size)}
                      className={cn(
                        'flex-1 p-2 rounded-lg border transition-all',
                        settings.tabSize === size
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {size} spaces
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <span className="text-sm font-medium">Line Wrapping</span>
                  <input
                    type="checkbox"
                    checked={settings.lineWrap}
                    onChange={(e) => updateSetting('lineWrap', e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <span className="text-sm font-medium">Line Numbers</span>
                  <input
                    type="checkbox"
                    checked={settings.lineNumbers}
                    onChange={(e) => updateSetting('lineNumbers', e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <span className="text-sm font-medium">Minimap</span>
                  <input
                    type="checkbox"
                    checked={settings.minimap}
                    onChange={(e) => updateSetting('minimap', e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Panel Visibility */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Panel Visibility</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <span className="text-sm font-medium">File Tree</span>
                <input
                  type="checkbox"
                  checked={settings.showFileTree}
                  onChange={(e) => updateSetting('showFileTree', e.target.checked)}
                  className="w-5 h-5 rounded border-border"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <span className="text-sm font-medium">Console</span>
                <input
                  type="checkbox"
                  checked={settings.showConsole}
                  onChange={(e) => updateSetting('showConsole', e.target.checked)}
                  className="w-5 h-5 rounded border-border"
                />
              </label>
            </div>
          </section>

          {/* Panel Sizes */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Panel Sizes</h3>
            <div className="space-y-4">
              {/* Editor/Preview Split */}
              <div>
                <label className="text-sm font-medium flex items-center justify-between mb-2">
                  <span>Code / Preview Split</span>
                  <span className="text-primary">{settings.editorWidth}% / {settings.previewWidth}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.editorWidth}
                  onChange={(e) => {
                    const editorWidth = Number(e.target.value)
                    updateSetting('editorWidth', editorWidth)
                    updateSetting('previewWidth', 100 - editorWidth)
                  }}
                  className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Preview Only</span>
                  <span>Code Only</span>
                </div>
              </div>

              {/* Console Height */}
              {settings.showConsole && (
                <div>
                  <label className="text-sm font-medium flex items-center justify-between mb-2">
                    <span>Console Height</span>
                    <span className="text-primary">{settings.consoleHeight}px</span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="400"
                    value={settings.consoleHeight}
                    onChange={(e) => updateSetting('consoleHeight', Number(e.target.value))}
                    className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>100px</span>
                    <span>400px</span>
                  </div>
                </div>
              )}

              {/* File Tree Width */}
              {settings.showFileTree && (
                <div>
                  <label className="text-sm font-medium flex items-center justify-between mb-2">
                    <span>File Tree Width</span>
                    <span className="text-primary">{settings.fileTreeWidth}px</span>
                  </label>
                  <input
                    type="range"
                    min="150"
                    max="350"
                    value={settings.fileTreeWidth}
                    onChange={(e) => updateSetting('fileTreeWidth', Number(e.target.value))}
                    className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>150px</span>
                    <span>350px</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
