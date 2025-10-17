'use client'

import { useState } from 'react'
import { X, Star, Trash2, Edit2, Check } from 'lucide-react'

interface Preset {
  id: string
  name: string
  description?: string
  config: string
  isGlobal: boolean
  isDefault: boolean
}

interface PresetManagerModalProps {
  presets: Preset[]
  onClose: () => void
  onUpdate: () => void
}

export function PresetManagerModal({
  presets,
  onClose,
  onUpdate,
}: PresetManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const userPresets = presets.filter(p => !p.isGlobal)

  const handleStartEdit = (preset: Preset) => {
    setEditingId(preset.id)
    setEditName(preset.name)
    setEditDescription(preset.description || '')
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to update preset')

      setEditingId(null)
      onUpdate()
    } catch (error) {
      console.error('Error updating preset:', error)
      alert('Failed to update preset')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return

    try {
      setIsDeleting(id)
      const response = await fetch(`/api/presets/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete preset')

      onUpdate()
    } catch (error) {
      console.error('Error deleting preset:', error)
      alert('Failed to delete preset')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (!response.ok) throw new Error('Failed to set default preset')

      onUpdate()
    } catch (error) {
      console.error('Error setting default preset:', error)
      alert('Failed to set default preset')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[800] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border bg-background shadow-2xl rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-background">
          <div>
            <h2 className="text-xl font-bold">Manage Presets</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Edit, delete, or set default presets
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Global Presets (Read-Only) */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Global Presets (Read-Only)
            </h3>
            <div className="space-y-2">
              {presets
                .filter(p => p.isGlobal)
                .map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-3 p-4 border rounded-lg bg-accent/10"
                  >
                    <Star
                      className={`h-5 w-5 flex-shrink-0 ${
                        preset.isDefault ? 'text-amber-500' : 'text-muted-foreground'
                      }`}
                      fill={preset.isDefault ? 'currentColor' : 'none'}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{preset.name}</div>
                      {preset.description && (
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {preset.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* User Presets */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              My Presets
            </h3>
            {userPresets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No custom presets yet</p>
                <p className="text-xs mt-1">
                  Save your current settings as a preset to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {userPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    {/* Default Star */}
                    <button
                      onClick={() => handleSetDefault(preset.id)}
                      className="mt-0.5 hover:scale-110 transition-transform"
                      title={preset.isDefault ? 'Default preset' : 'Set as default'}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          preset.isDefault ? 'text-amber-500' : 'text-muted-foreground'
                        }`}
                        fill={preset.isDefault ? 'currentColor' : 'none'}
                      />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {editingId === preset.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Preset name"
                            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(preset.id)}
                              className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-accent transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium">{preset.name}</div>
                          {preset.description && (
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {preset.description}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    {editingId !== preset.id && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(preset)}
                          className="p-2 rounded-md hover:bg-accent transition-colors"
                          title="Edit preset"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(preset.id)}
                          disabled={isDeleting === preset.id}
                          className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                          title="Delete preset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t bg-background">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
