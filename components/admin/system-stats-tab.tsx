'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Users, MessageSquare, Database, DollarSign, Activity } from 'lucide-react'
import { toast } from 'sonner'

interface SystemStats {
  users: {
    total: number
    active: number
    inactive: number
    admins: number
    recentLogins: number
  }
  sessions: {
    total: number
  }
  messages: {
    total: number
  }
  costs: {
    totalCost: number
    inputTokens: number
    outputTokens: number
    cachedTokens: number
  }
  models: {
    usage: Array<{ model: string; count: number }>
  }
  timestamp: string
}

export function SystemStatsTab() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-12">
        Failed to load statistics
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          System Overview
        </h3>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-500" />}
          title="Total Users"
          value={stats.users.total}
          subtitle={`${stats.users.active} active, ${stats.users.inactive} inactive`}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<Activity className="w-6 h-6 text-green-500" />}
          title="Recent Logins"
          value={stats.users.recentLogins}
          subtitle="Last 7 days"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          icon={<MessageSquare className="w-6 h-6 text-purple-500" />}
          title="Total Messages"
          value={stats.messages.total.toLocaleString()}
          subtitle={`${stats.sessions.total} sessions`}
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6 text-amber-500" />}
          title="Total Cost"
          value={`$${stats.costs.totalCost.toFixed(4)}`}
          subtitle={`${(stats.costs.inputTokens + stats.costs.outputTokens).toLocaleString()} tokens`}
          bgColor="bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      {/* Token Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Token Usage
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Input Tokens</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.costs.inputTokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Output Tokens</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.costs.outputTokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cached Tokens</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.costs.cachedTokens.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Model Usage */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Top Models (by session count)
        </h4>
        <div className="space-y-3">
          {stats.models.usage.length > 0 ? (
            stats.models.usage.map((model, index) => (
              <div key={model.model} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white font-mono">
                    {model.model}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {model.count} sessions
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No model usage data yet
            </p>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Last updated: {new Date(stats.timestamp).toLocaleString()}
      </p>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
  bgColor: string
}

function StatCard({ icon, title, value, subtitle, bgColor }: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">{icon}</div>
      </div>
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </h4>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  )
}
