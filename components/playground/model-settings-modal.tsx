'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

interface Model {
  id: string
  displayName: string
  isVision: boolean
  inputPricing: number
  outputPricing: number
}

interface ModelSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedModel: string
  onModelChange: (model: string) => void
  settings: {
    temperature: number
    maxTokens: number
    topP: number
    webSearch: boolean
  }
  onSettingsChange: (settings: any) => void
}

export function ModelSettingsModal({
  isOpen,
  onClose,
  selectedModel,
  onModelChange,
  settings,
  onSettingsChange
}: ModelSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [localModel, setLocalModel] = useState(selectedModel)
  const [models, setModels] = useState<Model[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  useEffect(() => {
    setLocalModel(selectedModel)
  }, [selectedModel])

  // Load models from API
  useEffect(() => {
    if (isOpen && models.length === 0) {
      loadModels()
    }
  }, [isOpen])

  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/models')
      if (!response.ok) throw new Error('Failed to fetch models')
      const data = await response.json()
      setModels(data.models || [])
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleSave = () => {
    onSettingsChange(localSettings)
    onModelChange(localModel)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md h-[85vh] h-[85dvh] flex flex-col border bg-background shadow-2xl rounded-xl transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-md p-1.5 hover:bg-accent transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header - Fixed */}
        <div className="p-6 pb-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold">Model Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Adjust AI model parameters</p>
        </div>

        {/* Main Settings Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Model Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">AI Model</label>
              <p className="text-xs text-muted-foreground mb-2">Select the model to use</p>
              {isLoadingModels ? (
                <div className="flex items-center justify-center gap-2 p-3 border rounded-md bg-accent/20">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading models...</span>
                </div>
              ) : (
                <select
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {models.length === 0 ? (
                    <option value={localModel}>{localModel}</option>
                  ) : (
                    models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.displayName} {model.isVision ? '🎨' : ''}
                        {' - $'}{model.inputPricing.toFixed(2)}/{model.outputPricing.toFixed(2)} per 1M
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

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
                  max="8000"
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

            {/* Web Search Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div>
                <label className="text-sm font-medium text-foreground cursor-pointer">Web Search</label>
                <p className="text-xs text-muted-foreground">Enable web search capabilities</p>
              </div>
              <div
                className={`relative h-6 w-11 rounded-full cursor-pointer transition-all ${
                  localSettings.webSearch ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                onClick={() => setLocalSettings({ ...localSettings, webSearch: !localSettings.webSearch })}
              >
                <span
                  className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                    localSettings.webSearch ? 'translate-x-[21px]' : 'translate-x-[2px]'
                  }`}
                />
              </div>
            </div>
        </div>

        {/* Action Buttons Footer - Fixed */}
        <div className="p-6 pt-4 border-t bg-accent/5 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium border border-input rounded-lg hover:bg-accent transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
