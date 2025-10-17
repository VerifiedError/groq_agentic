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
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border bg-background shadow-2xl rounded-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 rounded-md p-1.5 hover:bg-accent transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col">
          {/* Header with Status Indicator and Label */}
          <div className="p-6 pb-4 border-b">
            <div className="flex items-start gap-4">
              {/* Status Indicator Dot */}
              <div className="flex items-center pt-1">
                <div
                  className={`h-3 w-3 rounded-full transition-colors ${
                    localSettings.enabled
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                      : 'bg-gray-400 dark:bg-gray-600'
                  }`}
                  title={localSettings.enabled ? 'Model Enabled' : 'Model Disabled'}
                />
              </div>

              {/* Label Input */}
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={localSettings.label}
                  onChange={(e) => setLocalSettings({ ...localSettings, label: e.target.value })}
                  placeholder="Model Label"
                  className="w-full px-4 py-3 text-lg font-semibold border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <p className="text-sm text-muted-foreground">Custom name for this model instance</p>
              </div>

              {/* Enable/Disable Toggle */}
              <div className="flex items-center pt-2">
                <div
                  className={`relative h-6 w-11 rounded-full cursor-pointer transition-all ${
                    localSettings.enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => setLocalSettings({ ...localSettings, enabled: !localSettings.enabled })}
                >
                  <span
                    className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                      localSettings.enabled ? 'translate-x-[21px]' : 'translate-x-[2px]'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Settings Content */}
          <div className="p-6 space-y-6">
            {/* Model Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                Model
              </label>
              <div className="px-4 py-3 text-sm border rounded-lg bg-muted/50 font-medium">
                {currentModel?.displayName || modelId}
              </div>
              <p className="text-xs text-muted-foreground">The underlying AI model being used</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Configuration Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Configuration</h3>

              {/* Enable Streaming */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Power className="h-5 w-5 text-primary" />
                  <div>
                    <label className="text-sm font-medium text-foreground cursor-pointer">Enable Streaming</label>
                    <p className="text-xs text-muted-foreground">Stream responses in real-time</p>
                  </div>
                </div>
                <div className={`relative h-6 w-11 rounded-full transition-colors bg-primary`}>
                  <span className="absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-md translate-x-[21px]" />
                </div>
              </div>

              {/* Enable Reasoning */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <div>
                    <label className="text-sm font-medium text-foreground cursor-pointer">Enable Reasoning</label>
                    <p className="text-xs text-muted-foreground">Show model's thinking process</p>
                  </div>
                </div>
                <div
                  className={`relative h-6 w-11 rounded-full cursor-pointer transition-all ${
                    localSettings.reasoning ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => setLocalSettings({ ...localSettings, reasoning: !localSettings.reasoning })}
                >
                  <span
                    className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                      localSettings.reasoning ? 'translate-x-[21px]' : 'translate-x-[2px]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* System Prompt Section */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-foreground">System Prompt</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Define the model's behavior and personality
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setUseCustomPrompt(false)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    !useCustomPrompt
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-input hover:bg-accent'
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => setUseCustomPrompt(true)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    useCustomPrompt
                      ? 'bg-primary text-primary-foreground shadow-sm'
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
                  className="w-full px-4 py-3 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
                />
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Sampling Parameters */}
            <details className="group border rounded-lg overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3 bg-accent/30 hover:bg-accent/50 transition-colors">
                <div>
                  <span className="text-sm font-semibold text-foreground">Sampling Parameters</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Fine-tune model behavior</p>
                </div>
                <svg
                  className="h-5 w-5 transition-transform group-open:rotate-90 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </summary>
              <div className="p-4 space-y-5 bg-accent/10">
                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium text-foreground">Temperature</label>
                      <p className="text-xs text-muted-foreground">Randomness (0=focused, 2=creative)</p>
                    </div>
                    <input
                      type="number"
                      value={localSettings.temperature}
                      onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
                      min="0"
                      max="2"
                      step="0.1"
                      className="w-20 px-3 py-1.5 text-sm text-right border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <input
                    type="range"
                    value={localSettings.temperature}
                    onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
                    min="0"
                    max="2"
                    step="0.1"
                    className="w-full accent-primary"
                  />
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium text-foreground">Max Tokens</label>
                      <p className="text-xs text-muted-foreground">Maximum response length</p>
                    </div>
                    <input
                      type="number"
                      value={localSettings.maxTokens}
                      onChange={(e) => setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })}
                      min="1"
                      max="32000"
                      step="100"
                      className="w-24 px-3 py-1.5 text-sm text-right border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <input
                    type="range"
                    value={localSettings.maxTokens}
                    onChange={(e) => setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })}
                    min="1"
                    max="8000"
                    step="100"
                    className="w-full accent-primary"
                  />
                </div>

                {/* Top P */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium text-foreground">Top P</label>
                      <p className="text-xs text-muted-foreground">Nucleus sampling threshold</p>
                    </div>
                    <input
                      type="number"
                      value={localSettings.topP}
                      onChange={(e) => setLocalSettings({ ...localSettings, topP: parseFloat(e.target.value) })}
                      min="0"
                      max="1"
                      step="0.1"
                      className="w-20 px-3 py-1.5 text-sm text-right border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <input
                    type="range"
                    value={localSettings.topP}
                    onChange={(e) => setLocalSettings({ ...localSettings, topP: parseFloat(e.target.value) })}
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-6 pt-4 border-t bg-accent/5">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm"
              >
                Save Changes
              </button>
              <button
                onClick={handleApplyToAll}
                className="px-4 py-3 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all"
              >
                Apply to All
              </button>
              <button
                onClick={onReset}
                className="px-4 py-3 text-sm font-medium border border-input rounded-lg hover:bg-accent transition-all"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  onRemove()
                  onClose()
                }}
                className="px-4 py-3 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
