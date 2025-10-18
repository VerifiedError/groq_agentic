'use client'

import { useState } from 'react'
import { X, Users, BarChart3, Boxes, Settings as SettingsIcon } from 'lucide-react'
import { UserManagementTab } from './user-management-tab'
import { SystemStatsTab } from './system-stats-tab'
import { ModelManagementTab} from './model-management-tab'

interface AdminDashboardProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'users' | 'stats' | 'models'

export function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('stats')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                System management and statistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            System Stats
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'models'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Model Management
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'stats' && <SystemStatsTab />}
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'models' && <ModelManagementTab />}
        </div>
      </div>
    </div>
  )
}
