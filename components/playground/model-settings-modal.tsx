'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { X, Power, Lightbulb, Check, Loader2 } from 'lucide-react'
import { PresetDropdown } from './preset-dropdown'
import { encode } from 'gpt-tokenizer'

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
    chatMemory: number
    formattingRules: string
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialMount = useRef(true)
  const settingsRef = useRef(localSettings)

  // Update ref when localSettings changes
  useEffect(() => {
    settingsRef.current = localSettings
  }, [localSettings])

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const currentModel = models.find(m => m.id === modelId)

  // Calculate token count for formatting rules
  const formattingRulesTokens = useMemo(() => {
    if (!localSettings.formattingRules?.trim()) return 0
    try {
      return encode(localSettings.formattingRules).length
    } catch {
      // Fallback: approximate 4 chars = 1 token
      return Math.ceil(localSettings.formattingRules.length / 4)
    }
  }, [localSettings.formattingRules])

  // Debounced auto-save function (stable reference)
  const debouncedSave = useCallback(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set status to saving
    setSaveStatus('saving')

    // Create new timeout for 500ms
    saveTimeoutRef.current = setTimeout(() => {
      onSave(settingsRef.current)
      setSaveStatus('saved')

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    }, 500)
  }, [onSave])

  // Auto-save when settings change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    debouncedSave()

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [localSettings, debouncedSave])

  const handleApplyToAll = () => {
    onApplyToAll(localSettings)
    onClose()
  }

  const handleLoadPreset = (config: any) => {
    setLocalSettings({
      ...localSettings,
      temperature: config.temperature ?? localSettings.temperature,
      maxTokens: config.maxTokens ?? localSettings.maxTokens,
      topP: config.topP ?? localSettings.topP,
    })
  }

  const handleSavePreset = async (name: string, description?: string) => {
    const config = {
      temperature: localSettings.temperature,
      maxTokens: localSettings.maxTokens,
      topP: localSettings.topP,
      frequencyPenalty: 0,
      presencePenalty: 0,
    }

    const response = await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        config: JSON.stringify(config),
        isDefault: false,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save preset')
    }
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border bg-background shadow-2xl rounded-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Save Status Indicator */}
        {saveStatus !== 'idle' && (
          <div className="absolute top-6 right-16 flex items-center gap-2 text-sm text-muted-foreground z-10">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Saved</span>
              </>
            )}
          </div>
        )}

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
            {/* Preset Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                Preset
              </label>
              <PresetDropdown
                currentSettings={{
                  temperature: localSettings.temperature,
                  maxTokens: localSettings.maxTokens,
                  topP: localSettings.topP,
                  frequencyPenalty: 0,
                  presencePenalty: 0,
                }}
                onLoadPreset={handleLoadPreset}
                onSavePreset={handleSavePreset}
              />
              <p className="text-xs text-muted-foreground">Load or save configuration presets</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

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

            {/* Formatting Rules Section */}
            <details className="group border rounded-lg overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3 bg-accent/30 hover:bg-accent/50 transition-colors">
                <div>
                  <span className="text-sm font-semibold text-foreground">Formatting Rules</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define output formatting guidelines • ~{formattingRulesTokens} tokens
                  </p>
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
              <div className="p-4 space-y-3 bg-accent/10">
                <textarea
                  value={localSettings.formattingRules}
                  onChange={(e) => setLocalSettings({ ...localSettings, formattingRules: e.target.value })}
                  placeholder="Example:&#10;- Always format code blocks with syntax highlighting&#10;- Use bullet points for lists&#10;- Keep responses under 500 words&#10;- Include examples when explaining concepts"
                  rows={6}
                  className="w-full px-4 py-3 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all font-mono"
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    These rules will be prepended to the system prompt
                  </span>
                  <span className="font-medium text-primary">
                    ~{formattingRulesTokens} tokens
                  </span>
                </div>
              </div>
            </details>

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

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Chat Memory */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-foreground">Chat Memory</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Number of previous messages to include in context
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={localSettings.chatMemory}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value >= 0 && value <= 50) {
                      setLocalSettings({ ...localSettings, chatMemory: value })
                    }
                  }}
                  min="0"
                  max="50"
                  step="1"
                  className="w-24 px-4 py-2.5 text-sm text-center border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      const newValue = Math.min(50, localSettings.chatMemory + 1)
                      setLocalSettings({ ...localSettings, chatMemory: newValue })
                    }}
                    className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      const newValue = Math.max(0, localSettings.chatMemory - 1)
                      setLocalSettings({ ...localSettings, chatMemory: newValue })
                    }}
                    className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                  >
                    −
                  </button>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  {localSettings.chatMemory === 0 && 'No context (stateless)'}
                  {localSettings.chatMemory === 1 && '1 message'}
                  {localSettings.chatMemory > 1 && `${localSettings.chatMemory} messages`}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-6 pt-4 border-t bg-accent/5">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleApplyToAll}
                className="flex-1 px-4 py-3 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all"
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
