'use client'

import { useState, useEffect } from 'react'
import { X, Power, Lightbulb } from 'lucide-react'

interface Model {
  id: string
  displayName: string
}

interface ModelSettingsModalProps {
  modelId: string
  models: Model[]
  settings: {
    enabled: boolean
    reasoning: boolean
    temperature: number
    maxTokens: number
    topP: number
    systemPrompt: string
    label: string
  }
  onSave: (settings: any) => void
  onApplyToAll: (settings: any) => void
  onReset: () => void
  onRemove: () => void
  onClose: () => void
}

export function ModelSettingsModal({
  modelId,
  models,
  settings,
  onSave,
  onApplyToAll,
  onReset,
  onRemove,
  onClose
}: ModelSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [useCustomPrompt, setUseCustomPrompt] = useState(!!settings.systemPrompt)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const currentModel = models.find(m => m.id === modelId)

  const handleSave = () => {
    onSave(localSettings)
    onClose()
  }

  const handleApplyToAll = () => {
    onApplyToAll(localSettings)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto border bg-background p-6 shadow-lg rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {/* Model Name */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={localSettings.label}
              onChange={(e) => setLocalSettings({ ...localSettings, label: e.target.value })}
              placeholder="Model Label"
              className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div
              className={`relative h-[21px] w-[42px] rounded-full cursor-pointer transition-colors ${
                localSettings.enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => setLocalSettings({ ...localSettings, enabled: !localSettings.enabled })}
            >
              <span
                className={`absolute top-[2px] h-[17px] w-[17px] rounded-full bg-white transition-transform ${
                  localSettings.enabled ? 'translate-x-[21px]' : 'translate-x-[2px]'
                }`}
              />
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Model</label>
            <div className="px-3 py-2 text-sm border rounded-lg bg-muted/50">
              {currentModel?.displayName || modelId}
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Enable Streaming */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Power className="h-4 w-4" />
              Enable Streaming
            </label>
            <div
              className={`relative h-[21px] w-[42px] rounded-full cursor-pointer transition-colors bg-primary`}
            >
              <span className="absolute top-[2px] h-[17px] w-[17px] rounded-full bg-white translate-x-[21px]" />
            </div>
          </div>

          {/* Enable Reasoning */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Enable Reasoning
            </label>
            <div
              className={`relative h-[21px] w-[42px] rounded-full cursor-pointer transition-colors ${
                localSettings.reasoning ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => setLocalSettings({ ...localSettings, reasoning: !localSettings.reasoning })}
            >
              <span
                className={`absolute top-[2px] h-[17px] w-[17px] rounded-full bg-white transition-transform ${
                  localSettings.reasoning ? 'translate-x-[21px]' : 'translate-x-[2px]'
                }`}
              />
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* System Prompt */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">System Prompt</label>
            <p className="text-xs text-muted-foreground -mt-1">
              Use default system prompt or choose custom.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setUseCustomPrompt(false)}
                className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                  !useCustomPrompt
                    ? 'bg-secondary text-secondary-foreground'
                    : 'border border-input hover:bg-accent'
                }`}
              >
                Default
              </button>
              <button
                onClick={() => setUseCustomPrompt(true)}
                className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                  useCustomPrompt
                    ? 'bg-secondary text-secondary-foreground'
                    : 'border border-input hover:bg-accent'
                }`}
              >
                Custom
              </button>
            </div>
            {useCustomPrompt && (
              <textarea
                value={localSettings.systemPrompt}
                onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
                placeholder="Enter custom system prompt..."
                rows={4}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            )}
          </div>

          {/* Sampling Parameters */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer py-2 text-sm font-medium text-muted-foreground hover:underline">
              Sampling Parameters
              <svg
                className="h-4 w-4 transition-transform group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </summary>
            <div className="flex flex-col gap-4 pt-2">
              {/* Temperature */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <label className="text-muted-foreground">Temperature</label>
                  <input
                    type="number"
                    value={localSettings.temperature}
                    onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
                    min="0"
                    max="2"
                    step="0.1"
                    className="w-16 px-2 py-1 text-xs text-right border rounded bg-background"
                  />
                </div>
                <input
                  type="range"
                  value={localSettings.temperature}
                  onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full"
                />
              </div>

              {/* Max Tokens */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <label className="text-muted-foreground">Max Tokens</label>
                  <input
                    type="number"
                    value={localSettings.maxTokens}
                    onChange={(e) => setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })}
                    min="1"
                    max="32000"
                    step="100"
                    className="w-20 px-2 py-1 text-xs text-right border rounded bg-background"
                  />
                </div>
                <input
                  type="range"
                  value={localSettings.maxTokens}
                  onChange={(e) => setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })}
                  min="1"
                  max="8000"
                  step="100"
                  className="w-full"
                />
              </div>

              {/* Top P */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <label className="text-muted-foreground">Top P</label>
                  <input
                    type="number"
                    value={localSettings.topP}
                    onChange={(e) => setLocalSettings({ ...localSettings, topP: parseFloat(e.target.value) })}
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-16 px-2 py-1 text-xs text-right border rounded bg-background"
                  />
                </div>
                <input
                  type="range"
                  value={localSettings.topP}
                  onChange={(e) => setLocalSettings({ ...localSettings, topP: parseFloat(e.target.value) })}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full"
                />
              </div>
            </div>
          </details>

          <div className="h-px bg-border/50" />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 md:flex-row">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleApplyToAll}
              className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Apply to All
            </button>
            <button
              onClick={onReset}
              className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => {
                onRemove()
                onClose()
              }}
              className="px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
