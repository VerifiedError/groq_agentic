'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Settings, Star } from 'lucide-react'
import { PresetManagerModal } from './preset-manager-modal'

interface Preset {
  id: string
  name: string
  description?: string
  config: string
  isGlobal: boolean
  isDefault: boolean
}

interface PresetDropdownProps {
  currentSettings: {
    temperature: number
    maxTokens: number
    topP: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
  onLoadPreset: (config: any) => void
  onSavePreset: (name: string, description?: string) => Promise<void>
}

export function PresetDropdown({
  currentSettings,
  onLoadPreset,
  onSavePreset,
}: PresetDropdownProps) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch presets on mount
  useEffect(() => {
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/presets')
      if (!response.ok) throw new Error('Failed to fetch presets')
      const data = await response.json()
      setPresets(data.presets || [])

      // Auto-select default preset
      const defaultPreset = data.presets.find((p: Preset) => p.isDefault)
      if (defaultPreset) {
        setSelectedPreset(defaultPreset.id)
      }
    } catch (error) {
      console.error('Error fetching presets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadPreset = (preset: Preset) => {
    try {
      const config = JSON.parse(preset.config)
      onLoadPreset(config)
      setSelectedPreset(preset.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Error loading preset:', error)
    }
  }

  const handleSaveAsPreset = async () => {
    const name = prompt('Enter preset name:')
    if (!name) return

    const description = prompt('Enter description (optional):')

    try {
      await onSavePreset(name, description || undefined)
      await fetchPresets()
      setIsOpen(false)
    } catch (error) {
      console.error('Error saving preset:', error)
      alert('Failed to save preset')
    }
  }

  const selectedPresetObj = presets.find(p => p.id === selectedPreset)

  // Separate global and user presets
  const globalPresets = presets.filter(p => p.isGlobal)
  const userPresets = presets.filter(p => !p.isGlobal)

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm border rounded-lg bg-background hover:bg-accent/50 transition-all"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedPresetObj?.isDefault && (
              <Star className="h-4 w-4 text-amber-500 flex-shrink-0" fill="currentColor" />
            )}
            <span className="truncate">
              {isLoading
                ? 'Loading...'
                : selectedPresetObj?.name || 'Select Preset...'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 right-0 mt-2 border rounded-lg bg-background shadow-lg z-20 max-h-80 overflow-y-auto">
              {/* Global Presets */}
              {globalPresets.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
                    Global Presets
                  </div>
                  {globalPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleLoadPreset(preset)}
                      className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        {preset.isDefault && (
                          <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" fill="currentColor" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{preset.name}</span>
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded border border-blue-500/20 flex-shrink-0">
                              Default
                            </span>
                          </div>
                          {preset.description && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {preset.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* User Presets */}
              {userPresets.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
                    My Presets
                  </div>
                  {userPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleLoadPreset(preset)}
                      className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        {preset.isDefault && (
                          <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" fill="currentColor" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{preset.name}</div>
                          {preset.description && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {preset.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-2 border-t space-y-1">
                <button
                  onClick={handleSaveAsPreset}
                  className="w-full px-3 py-2 text-sm font-medium text-left hover:bg-accent/50 rounded transition-colors"
                >
                  Save as Preset...
                </button>
                <button
                  onClick={() => {
                    setIsManagerOpen(true)
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-left hover:bg-accent/50 rounded transition-colors flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Manage Presets
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preset Manager Modal */}
      {isManagerOpen && (
        <PresetManagerModal
          presets={presets}
          onClose={() => setIsManagerOpen(false)}
          onUpdate={fetchPresets}
        />
      )}
    </>
  )
}
