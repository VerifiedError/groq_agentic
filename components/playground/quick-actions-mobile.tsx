'use client'

import { ImageIcon, Monitor, Layout, Grid3x3, Box } from 'lucide-react'
import { TOUCH_TARGET_SIZE } from '@/lib/breakpoints'

interface QuickAction {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}

interface QuickActionsMobileProps {
  onImageClick: () => void
  onInteractiveAppClick: () => void
  onLandingPageClick: () => void
  on2DGameClick: () => void
  on3DGameClick: () => void
}

export function QuickActionsMobile({
  onImageClick,
  onInteractiveAppClick,
  onLandingPageClick,
  on2DGameClick,
  on3DGameClick,
}: QuickActionsMobileProps) {
  const actions: QuickAction[] = [
    {
      id: 'image',
      icon: <ImageIcon className="h-5 w-5" />,
      label: 'Image',
      onClick: onImageClick,
    },
    {
      id: 'interactive',
      icon: <Monitor className="h-5 w-5" />,
      label: 'Interactive App',
      onClick: onInteractiveAppClick,
    },
    {
      id: 'landing',
      icon: <Layout className="h-5 w-5" />,
      label: 'Landing Page',
      onClick: onLandingPageClick,
    },
    {
      id: '2d-game',
      icon: <Grid3x3 className="h-5 w-5" />,
      label: '2D Game',
      onClick: on2DGameClick,
    },
    {
      id: '3d-game',
      icon: <Box className="h-5 w-5" />,
      label: '3D Game',
      onClick: on3DGameClick,
    },
  ]

  return (
    <>
      {/* Mobile: Horizontal scrollable row */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 pb-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              style={{ minHeight: TOUCH_TARGET_SIZE.recommended }}
            >
              <span className="text-neutral-700 dark:text-neutral-300">
                {action.icon}
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Icon-only buttons */}
      <div className="hidden md:flex gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors group relative"
            title={action.label}
          >
            <span className="text-neutral-700 dark:text-neutral-300">
              {action.icon}
            </span>
            {/* Tooltip on hover */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
