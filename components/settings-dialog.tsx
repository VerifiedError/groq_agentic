'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Key, User, Mail, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SettingsData {
  user: {
    id: number
    email: string
    name: string | null
  }
  hasApiKey: boolean
  apiKeyPreview: string | null
}

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  // Fetch settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      const data: SettingsData = await response.json()
      setSettings(data)
      setName(data.user.name || '')
      setApiKey('') // Don't populate API key field for security
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updateData: any = {}

      // Only include changed fields
      if (name !== (settings?.user.name || '')) {
        updateData.name = name
      }

      if (apiKey.trim()) {
        // Validate API key format
        if (!apiKey.startsWith('gsk_')) {
          toast.error('Invalid API key format. Groq API keys start with "gsk_"')
          setIsSaving(false)
          return
        }
        if (apiKey.length < 20) {
          toast.error('API key seems too short. Please check and try again.')
          setIsSaving(false)
          return
        }
        updateData.apiKey = apiKey
      }

      // Don't send request if nothing changed
      if (Object.keys(updateData).length === 0) {
        toast.info('No changes to save')
        setIsSaving(false)
        return
      }

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update settings')
      }

      const data: SettingsData = await response.json()
      setSettings(data)
      setApiKey('') // Clear API key input after save
      toast.success('Settings updated successfully')

      // Close dialog after successful save
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  const handleClearApiKey = async () => {
    if (!confirm('Are you sure you want to remove your API key? The app will fall back to the global API key.')) {
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: '' }),
      })

      if (!response.ok) {
        throw new Error('Failed to clear API key')
      }

      const data: SettingsData = await response.json()
      setSettings(data)
      setApiKey('')
      toast.success('API key removed')
    } catch (error) {
      console.error('Failed to clear API key:', error)
      toast.error('Failed to clear API key')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* User Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Account
                </h3>

                <div className="space-y-3">
                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      <Mail className="w-4 h-4 inline mr-1.5" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings?.user.email || ''}
                      disabled
                      className="w-full px-3 py-2 bg-muted/50 border rounded-md text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      <User className="w-4 h-4 inline mr-1.5" />
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Your name"
                      className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  API Configuration
                </h3>

                <div className="space-y-3">
                  {/* Current API Key Status */}
                  {settings?.hasApiKey && (
                    <div className="p-3 bg-muted/50 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Current API Key</p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {settings.apiKeyPreview}
                          </p>
                        </div>
                        <button
                          onClick={handleClearApiKey}
                          disabled={isSaving}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* API Key Input */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      <Key className="w-4 h-4 inline mr-1.5" />
                      {settings?.hasApiKey ? 'Update API Key' : 'Groq API Key'}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="gsk_..."
                        className="w-full px-3 py-2 pr-10 bg-background border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Get your API key from{' '}
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        console.groq.com/keys
                      </a>
                      . Your key is stored securely and used for all AI requests.
                    </p>
                    {!settings?.hasApiKey && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5">
                        ⚠️ No API key set. Using global environment key.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50",
              isSaving && "cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
