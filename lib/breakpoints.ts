/**
 * Responsive breakpoints for mobile, tablet, and desktop layouts
 * Used across the application for consistent responsive design
 */

export const BREAKPOINTS = {
  // Mobile devices (phones)
  mobile: '(max-width: 767px)',
  mobileMin: 320,
  mobileMax: 767,

  // Tablet devices
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  tabletMin: 768,
  tabletMax: 1023,

  // Desktop devices
  desktop: '(min-width: 1024px)',
  desktopMin: 1024,

  // Large desktop devices
  largeDesktop: '(min-width: 1440px)',
  largeDesktopMin: 1440,

  // Ultra-wide displays
  ultraWide: '(min-width: 1920px)',
  ultraWideMin: 1920,
} as const

/**
 * Tailwind breakpoint classes
 * Use these in className strings for responsive styling
 */
export const TW_BREAKPOINTS = {
  // Hidden on mobile, visible on tablet+
  hideOnMobile: 'hidden md:block',

  // Visible on mobile, hidden on tablet+
  showOnMobile: 'block md:hidden',

  // Hidden on desktop, visible on mobile/tablet
  hideOnDesktop: 'block lg:hidden',

  // Visible on desktop, hidden on mobile/tablet
  showOnDesktop: 'hidden lg:block',

  // Full width on mobile, constrained on desktop
  responsiveContainer: 'w-full lg:max-w-4xl lg:mx-auto',

  // Responsive padding
  responsivePadding: 'px-4 md:px-6 lg:px-8',

  // Responsive gap
  responsiveGap: 'gap-2 md:gap-4 lg:gap-6',
} as const

/**
 * Hook to detect current breakpoint using window.matchMedia
 * @returns Current breakpoint name ('mobile' | 'tablet' | 'desktop' | 'largeDesktop')
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'largeDesktop' {
  if (typeof window === 'undefined') return 'desktop'

  if (window.matchMedia(BREAKPOINTS.largeDesktop).matches) return 'largeDesktop'
  if (window.matchMedia(BREAKPOINTS.desktop).matches) return 'desktop'
  if (window.matchMedia(BREAKPOINTS.tablet).matches) return 'tablet'
  return 'mobile'
}

/**
 * Check if current viewport matches a breakpoint
 * @param breakpoint - Breakpoint name to check
 * @returns True if current viewport matches the breakpoint
 */
export function isBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  if (typeof window === 'undefined') return false
  const query = BREAKPOINTS[breakpoint]
  if (typeof query !== 'string') return false
  return window.matchMedia(query).matches
}

/**
 * Get responsive class based on breakpoint
 * @param mobile - Class for mobile
 * @param tablet - Class for tablet (optional, defaults to desktop)
 * @param desktop - Class for desktop
 * @returns Tailwind responsive class string
 */
export function getResponsiveClass(
  mobile: string,
  desktop: string,
  tablet?: string
): string {
  return `${mobile} ${tablet ? `md:${tablet}` : `md:${desktop}`} lg:${desktop}`
}

/**
 * Touch target minimum size for accessibility (WCAG 2.1)
 */
export const TOUCH_TARGET_SIZE = {
  minimum: 44, // WCAG 2.1 Level AAA
  recommended: 48, // Better for mobile usability
  comfortable: 56, // Comfortable for most users
} as const

/**
 * Responsive sidebar widths
 */
export const SIDEBAR_WIDTH = {
  mobile: 280, // Full width minus edge margin
  tablet: 264, // Compact sidebar
  desktop: 264, // Standard sidebar
  desktopExpanded: 320, // Expanded sidebar for more content
  collapsed: 54, // Icon-only collapsed state
} as const

/**
 * Responsive chat container widths
 */
export const CHAT_CONTAINER_WIDTH = {
  mobile: '100%', // Full width on mobile
  tablet: 640, // Constrained on tablet
  desktop: 800, // Optimal reading width
  largeDesktop: 960, // Wider on large screens
} as const

/**
 * Z-index layers for responsive components
 */
export const Z_INDEX = {
  backdrop: 40,
  drawer: 50,
  modal: 60,
  toast: 70,
  tooltip: 80,
} as const
