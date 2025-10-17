/**
 * IDE Layout Settings Management
 *
 * Manages user preferences for artifact IDE layout, themes, and customization.
 */

export type LayoutPreset = 'balanced' | 'code-focus' | 'preview-focus' | 'fullstack'
export type EditorTheme = 'dark' | 'light' | 'github-dark' | 'github-light' | 'monokai' | 'dracula'

export interface LayoutSettings {
  // Layout configuration
  layout: LayoutPreset
  showFileTree: boolean
  showConsole: boolean
  showChat: boolean

  // Panel sizes (percentages)
  fileTreeWidth: number
  editorWidth: number
  previewWidth: number
  consoleHeight: number
  chatWidth: number

  // Editor settings
  theme: EditorTheme
  fontSize: number
  tabSize: number
  lineWrap: boolean
  lineNumbers: boolean
  minimap: boolean
}

// Default settings
export const DEFAULT_SETTINGS: LayoutSettings = {
  layout: 'balanced',
  showFileTree: true,
  showConsole: false,
  showChat: false,

  fileTreeWidth: 200,
  editorWidth: 50,
  previewWidth: 50,
  consoleHeight: 200,
  chatWidth: 384, // 96 in rem (24rem)

  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  lineWrap: true,
  lineNumbers: true,
  minimap: false,
}

// Layout presets with predefined panel sizes
export const LAYOUT_PRESETS: Record<LayoutPreset, Partial<LayoutSettings>> = {
  'balanced': {
    layout: 'balanced',
    editorWidth: 50,
    previewWidth: 50,
    showFileTree: true,
    showConsole: false,
  },
  'code-focus': {
    layout: 'code-focus',
    editorWidth: 70,
    previewWidth: 30,
    showFileTree: true,
    showConsole: true,
  },
  'preview-focus': {
    layout: 'preview-focus',
    editorWidth: 30,
    previewWidth: 70,
    showFileTree: false,
    showConsole: false,
  },
  'fullstack': {
    layout: 'fullstack',
    editorWidth: 50,
    previewWidth: 50,
    showFileTree: true,
    showConsole: true,
  },
}

/**
 * Load layout settings from localStorage
 */
export function loadLayoutSettings(): LayoutSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    const stored = localStorage.getItem('artifact-layout-settings')
    if (!stored) return DEFAULT_SETTINGS

    const parsed = JSON.parse(stored)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch (error) {
    console.error('Failed to load layout settings:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Save layout settings to localStorage
 */
export function saveLayoutSettings(settings: LayoutSettings): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('artifact-layout-settings', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save layout settings:', error)
  }
}

/**
 * Apply a layout preset
 */
export function applyLayoutPreset(
  currentSettings: LayoutSettings,
  preset: LayoutPreset
): LayoutSettings {
  const presetConfig = LAYOUT_PRESETS[preset]
  const newSettings = { ...currentSettings, ...presetConfig }
  saveLayoutSettings(newSettings)
  return newSettings
}

/**
 * Update specific setting
 */
export function updateSetting<K extends keyof LayoutSettings>(
  currentSettings: LayoutSettings,
  key: K,
  value: LayoutSettings[K]
): LayoutSettings {
  const newSettings = { ...currentSettings, [key]: value }
  saveLayoutSettings(newSettings)
  return newSettings
}

/**
 * Reset to default settings
 */
export function resetToDefaults(): LayoutSettings {
  saveLayoutSettings(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

/**
 * Get Sandpack theme name from our theme setting
 */
export function getSandpackTheme(theme: EditorTheme): string {
  const themeMap: Record<EditorTheme, string> = {
    'dark': 'dark',
    'light': 'light',
    'github-dark': 'github-dark',
    'github-light': 'github-light',
    'monokai': 'monokai',
    'dracula': 'dark', // Sandpack doesn't have dracula, use dark
  }

  return themeMap[theme] || 'dark'
}

/**
 * Get panel visibility config
 */
export function getPanelVisibility(settings: LayoutSettings): {
  showCode: boolean
  showPreview: boolean
  showFileTree: boolean
  showConsole: boolean
  showChat: boolean
} {
  // Determine which panels should be visible based on layout
  const showCode = settings.editorWidth > 0
  const showPreview = settings.previewWidth > 0

  return {
    showCode,
    showPreview,
    showFileTree: settings.showFileTree && showCode,
    showConsole: settings.showConsole,
    showChat: settings.showChat,
  }
}

/**
 * Calculate panel flex values for CSS
 */
export function getPanelFlex(settings: LayoutSettings): {
  editorFlex: string
  previewFlex: string
} {
  const editorFlex = `${settings.editorWidth}`
  const previewFlex = `${settings.previewWidth}`

  return { editorFlex, previewFlex }
}

/**
 * Get preset display info
 */
export function getPresetInfo(preset: LayoutPreset): {
  name: string
  description: string
  icon: string
} {
  const presetInfo: Record<LayoutPreset, { name: string; description: string; icon: string }> = {
    'balanced': {
      name: 'Balanced',
      description: '50/50 code and preview split',
      icon: '⚖️',
    },
    'code-focus': {
      name: 'Code Focus',
      description: '70% code, 30% preview with console',
      icon: '💻',
    },
    'preview-focus': {
      name: 'Preview Focus',
      description: '30% code, 70% preview',
      icon: '👁️',
    },
    'fullstack': {
      name: 'Full Stack',
      description: 'All panels: code, preview, console, file tree',
      icon: '🔧',
    },
  }

  return presetInfo[preset]
}

/**
 * Get theme display info
 */
export function getThemeInfo(theme: EditorTheme): {
  name: string
  description: string
} {
  const themeInfo: Record<EditorTheme, { name: string; description: string }> = {
    'dark': { name: 'Dark', description: 'Classic dark theme' },
    'light': { name: 'Light', description: 'Classic light theme' },
    'github-dark': { name: 'GitHub Dark', description: 'GitHub dark theme' },
    'github-light': { name: 'GitHub Light', description: 'GitHub light theme' },
    'monokai': { name: 'Monokai', description: 'Popular monokai theme' },
    'dracula': { name: 'Dracula', description: 'Dracula color scheme' },
  }

  return themeInfo[theme]
}
