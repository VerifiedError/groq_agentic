'use client'

import { useState } from 'react'
import {
  Power,
  Lightbulb,
  Copy,
  Sliders,
  X
} from 'lucide-react'

interface ModelSettingsPopoverProps {
  modelId: string
  modelName: string
  settings: {
    enabled: boolean
    reasoning: boolean
  }
  onToggleEnabled: () => void
  onToggleReasoning: () => void
  onDuplicate: () => void
  onAdvancedSettings: () => void
  onRemove: () => void
  onClose: () => void
}

export function ModelSettingsPopover({
  modelId,
  modelName,
  settings,
  onToggleEnabled,
  onToggleReasoning,
  onDuplicate,
  onAdvancedSettings,
  onRemove,
  onClose
}: ModelSettingsPopoverProps) {
  return (
    <div data-settings-popover className="w-64 rounded-lg border bg-popover text-popover-foreground shadow-md p-2 flex flex-col gap-2">
      {/* Model Header */}
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{modelName}</div>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* Toggle: Enable */}
      <button
        onClick={onToggleEnabled}
        className="flex items-center justify-between px-3 py-2 hover:bg-accent rounded-md transition-colors text-sm"
      >
        <span className="flex items-center gap-2">
          <Power className="h-4 w-4" />
          Enable
        </span>
        <div
          className={`relative h-[21px] w-[42px] rounded-full transition-colors ${
            settings.enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-[2px] h-[17px] w-[17px] rounded-full bg-white transition-transform ${
              settings.enabled ? 'translate-x-[21px]' : 'translate-x-[2px]'
            }`}
          />
        </div>
      </button>

      {/* Toggle: Reasoning */}
      <button
        onClick={onToggleReasoning}
        className="flex items-center justify-between px-3 py-2 hover:bg-accent rounded-md transition-colors text-sm"
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Reasoning
        </span>
        <div
          className={`relative h-[21px] w-[42px] rounded-full transition-colors ${
            settings.reasoning ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-[2px] h-[17px] w-[17px] rounded-full bg-white transition-transform ${
              settings.reasoning ? 'translate-x-[21px]' : 'translate-x-[2px]'
            }`}
          />
        </div>
      </button>

      <div className="h-px bg-border/50" />

      {/* Duplicate Button */}
      <button
        onClick={onDuplicate}
        className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md transition-colors text-sm text-left"
      >
        <Copy className="h-4 w-4" />
        Duplicate
      </button>

      {/* Advanced Settings Button */}
      <button
        onClick={onAdvancedSettings}
        className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md transition-colors text-sm text-left"
      >
        <Sliders className="h-4 w-4" />
        Advanced Settings
      </button>

      <div className="h-px bg-border/50" />

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md transition-colors text-sm text-left"
      >
        <X className="h-4 w-4" />
        Remove
      </button>
    </div>
  )
}
