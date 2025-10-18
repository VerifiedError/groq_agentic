'use client'

import { ReactNode } from 'react'
import { CHAT_CONTAINER_WIDTH } from '@/lib/breakpoints'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
}

/**
 * Responsive container that adjusts width based on screen size
 * Mobile: Full width
 * Tablet: 640px max
 * Desktop: 800px max
 * Large Desktop: 960px max
 */
export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div
      className={`w-full mx-auto px-4 md:px-6 ${className}`}
      style={{
        maxWidth: CHAT_CONTAINER_WIDTH.desktop,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Full-width container for mobile, constrained for desktop
 */
export function ResponsiveChatContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Mobile: Full width */}
      <div className="flex-1 flex flex-col md:hidden">
        {children}
      </div>

      {/* Desktop: Centered with max width */}
      <div className="hidden md:flex md:flex-1 md:flex-col md:items-center">
        <div
          className="w-full h-full flex flex-col"
          style={{ maxWidth: CHAT_CONTAINER_WIDTH.desktop }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
