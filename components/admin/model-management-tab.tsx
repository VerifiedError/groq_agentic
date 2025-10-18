'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Eye, EyeOff, Check, X as XIcon } from 'lucide-react'
import { toast } from 'sonner'

interface GroqModel {
  id: string
  displayName: string
  contextWindow: number
  inputPricing: number
  outputPricing: number
  isVision: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function ModelManagementTab() {
  const [models, setModels] = useState<GroqModel[]>([])
  const [loading, setLoading] = useState(true)

  const fetchModels = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/models')

      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }

      const data = await response.json()
      setModels(data.models)
    } catch (error) {
      console.error('Error fetching models:', error)
      toast.error('Failed to load models')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const handleToggleActive = async (modelId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update model')
      }

      toast.success(`Model ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchModels()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRefreshFromGroq = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/models/refresh', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to refresh models from Groq')
      }

      const data = await response.json()
      toast.success(`Refreshed ${data.syncedCount} models from Groq API`)
      fetchModels()
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh models')
    }
  }

  if (loading && models.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Model Management
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshFromGroq}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Sync from Groq API
          </button>
          <button
            onClick={fetchModels}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Model Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Context Window
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Input Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Output Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vision
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {models.map((model) => (
              <tr
                key={model.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-900/50 ${
                  !model.isActive ? 'opacity-50' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {model.displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {model.id}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {model.contextWindow.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  ${model.inputPricing.toFixed(2)}/1M
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  ${model.outputPricing.toFixed(2)}/1M
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {model.isVision ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <Eye className="w-3 h-3" />
                      Vision
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      <EyeOff className="w-3 h-3" />
                      Text
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(model.id, model.isActive)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      model.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {model.isActive ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <XIcon className="w-3 h-3" />
                    )}
                    {model.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleToggleActive(model.id, model.isActive)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    {model.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {models.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No models found. Click "Sync from Groq API" to load models.
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Showing {models.length} model{models.length !== 1 ? 's' : ''} •{' '}
        {models.filter((m) => m.isActive).length} active •{' '}
        {models.filter((m) => !m.isActive).length} inactive
      </p>
    </div>
  )
}
