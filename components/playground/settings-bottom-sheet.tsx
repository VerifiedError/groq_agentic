'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Info } from 'lucide-react'
import { Z_INDEX, TOUCH_TARGET_SIZE } from '@/lib/breakpoints'

interface ModelSettings {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty?: number
  presencePenalty?: number
}

interface SettingsBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  settings: ModelSettings
  onSettingsChange: (settings: ModelSettings) => void
}

export function SettingsBottomSheet({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic')
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Drag to dismiss gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current

    // Only allow dragging down (positive diff)
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`
    }
  }

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current

    // If dragged more than 150px down, close the sheet
    if (diff > 150) {
      onClose()
    }

    // Reset transform and dragging state
    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
    setIsDragging(false)
  }

  const handleSettingChange = (key: keyof ModelSettings, value: number) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
        style={{ zIndex: Z_INDEX.backdrop }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 bg-white dark:bg-neutral-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out md:hidden"
        style={{
          zIndex: Z_INDEX.drawer,
          maxHeight: '80vh',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
        role="dialog"
        aria-label="Model settings"
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Model Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
            aria-label="Close settings"
          >
            <X className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === 'basic'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
            style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
          >
            Basic
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
            style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
          >
            Advanced
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(80vh - 180px)' }}>
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Temperature
                    <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      <Info className="h-4 w-4 text-neutral-400" />
                    </button>
                  </label>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {settings.temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
                />
                <div className="flex justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Max Tokens
                    <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      <Info className="h-4 w-4 text-neutral-400" />
                    </button>
                  </label>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {settings.maxTokens}
                  </span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={settings.maxTokens}
                  onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                  className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
                />
                <div className="flex justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>256</span>
                  <span>4096</span>
                </div>
              </div>

              {/* Top P */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Top P
                    <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      <Info className="h-4 w-4 text-neutral-400" />
                    </button>
                  </label>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {settings.topP.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.topP}
                  onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))}
                  className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
                />
                <div className="flex justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>Focused</span>
                  <span>Diverse</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Frequency Penalty */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Frequency Penalty
                    <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      <Info className="h-4 w-4 text-neutral-400" />
                    </button>
                  </label>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {(settings.frequencyPenalty || 0).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.frequencyPenalty || 0}
                  onChange={(e) => handleSettingChange('frequencyPenalty', parseFloat(e.target.value))}
                  className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
                />
              </div>

              {/* Presence Penalty */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Presence Penalty
                    <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      <Info className="h-4 w-4 text-neutral-400" />
                    </button>
                  </label>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {(settings.presencePenalty || 0).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.presencePenalty || 0}
                  onChange={(e) => handleSettingChange('presencePenalty', parseFloat(e.target.value))}
                  className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
                />
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Note:</strong> Advanced settings can significantly affect model output. Use with caution.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 px-6 py-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => {
              onSettingsChange({
                temperature: 0.7,
                maxTokens: 2048,
                topP: 0.9,
                frequencyPenalty: 0,
                presencePenalty: 0,
              })
            }}
            className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium transition-colors"
            style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  )
}
