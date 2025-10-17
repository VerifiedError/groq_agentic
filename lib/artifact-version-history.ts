/**
 * Artifact Version History Management
 *
 * Provides undo/redo functionality and version tracking for artifacts.
 */

export interface ArtifactVersion {
  id: string
  timestamp: Date
  files: Record<string, string>
  description: string
  action: 'initial' | 'chat-edit' | 'manual-edit' | 'restored'
}

export interface VersionHistory {
  artifactId: string
  versions: ArtifactVersion[]
  currentIndex: number
}

/**
 * Get version history from localStorage
 */
export function getVersionHistory(artifactId: string): VersionHistory | null {
  if (typeof window === 'undefined') return null

  try {
    const key = `artifact-versions-${artifactId}`
    const data = localStorage.getItem(key)
    if (!data) return null

    const parsed = JSON.parse(data)
    // Convert timestamp strings back to Date objects
    parsed.versions = parsed.versions.map((v: any) => ({
      ...v,
      timestamp: new Date(v.timestamp)
    }))

    return parsed
  } catch (error) {
    console.error('Failed to load version history:', error)
    return null
  }
}

/**
 * Save version history to localStorage
 */
export function saveVersionHistory(history: VersionHistory): void {
  if (typeof window === 'undefined') return

  try {
    const key = `artifact-versions-${history.artifactId}`
    localStorage.setItem(key, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save version history:', error)
  }
}

/**
 * Initialize version history for a new artifact
 */
export function initializeVersionHistory(
  artifactId: string,
  initialFiles: Record<string, string>,
  description: string = 'Initial version'
): VersionHistory {
  const version: ArtifactVersion = {
    id: generateVersionId(),
    timestamp: new Date(),
    files: { ...initialFiles },
    description,
    action: 'initial'
  }

  const history: VersionHistory = {
    artifactId,
    versions: [version],
    currentIndex: 0
  }

  saveVersionHistory(history)
  return history
}

/**
 * Add a new version to history
 * If we're not at the latest version, this will truncate future versions
 */
export function addVersion(
  artifactId: string,
  files: Record<string, string>,
  description: string,
  action: ArtifactVersion['action'] = 'manual-edit'
): VersionHistory {
  let history = getVersionHistory(artifactId)

  if (!history) {
    // Initialize if doesn't exist
    history = initializeVersionHistory(artifactId, files, description)
    return history
  }

  const newVersion: ArtifactVersion = {
    id: generateVersionId(),
    timestamp: new Date(),
    files: { ...files },
    description,
    action
  }

  // Truncate any versions after current index (if we've undone)
  history.versions = history.versions.slice(0, history.currentIndex + 1)

  // Add new version
  history.versions.push(newVersion)
  history.currentIndex = history.versions.length - 1

  // Limit history size (keep last 50 versions)
  if (history.versions.length > 50) {
    history.versions = history.versions.slice(-50)
    history.currentIndex = history.versions.length - 1
  }

  saveVersionHistory(history)
  return history
}

/**
 * Undo to previous version
 * Returns the previous version's files, or null if at start
 */
export function undo(artifactId: string): Record<string, string> | null {
  const history = getVersionHistory(artifactId)
  if (!history) return null

  if (history.currentIndex > 0) {
    history.currentIndex--
    saveVersionHistory(history)
    return history.versions[history.currentIndex].files
  }

  return null
}

/**
 * Redo to next version
 * Returns the next version's files, or null if at end
 */
export function redo(artifactId: string): Record<string, string> | null {
  const history = getVersionHistory(artifactId)
  if (!history) return null

  if (history.currentIndex < history.versions.length - 1) {
    history.currentIndex++
    saveVersionHistory(history)
    return history.versions[history.currentIndex].files
  }

  return null
}

/**
 * Jump to a specific version by index
 */
export function goToVersion(
  artifactId: string,
  versionIndex: number
): Record<string, string> | null {
  const history = getVersionHistory(artifactId)
  if (!history) return null

  if (versionIndex >= 0 && versionIndex < history.versions.length) {
    history.currentIndex = versionIndex
    saveVersionHistory(history)
    return history.versions[versionIndex].files
  }

  return null
}

/**
 * Get current version info
 */
export function getCurrentVersion(artifactId: string): ArtifactVersion | null {
  const history = getVersionHistory(artifactId)
  if (!history) return null

  return history.versions[history.currentIndex]
}

/**
 * Check if undo is available
 */
export function canUndo(artifactId: string): boolean {
  const history = getVersionHistory(artifactId)
  return history ? history.currentIndex > 0 : false
}

/**
 * Check if redo is available
 */
export function canRedo(artifactId: string): boolean {
  const history = getVersionHistory(artifactId)
  return history ? history.currentIndex < history.versions.length - 1 : false
}

/**
 * Get version navigation state
 */
export function getVersionState(artifactId: string): {
  canUndo: boolean
  canRedo: boolean
  currentIndex: number
  totalVersions: number
  currentVersion: ArtifactVersion | null
} {
  const history = getVersionHistory(artifactId)

  if (!history) {
    return {
      canUndo: false,
      canRedo: false,
      currentIndex: 0,
      totalVersions: 0,
      currentVersion: null
    }
  }

  return {
    canUndo: history.currentIndex > 0,
    canRedo: history.currentIndex < history.versions.length - 1,
    currentIndex: history.currentIndex,
    totalVersions: history.versions.length,
    currentVersion: history.versions[history.currentIndex]
  }
}

/**
 * Clear version history for an artifact
 */
export function clearVersionHistory(artifactId: string): void {
  if (typeof window === 'undefined') return

  const key = `artifact-versions-${artifactId}`
  localStorage.removeItem(key)
}

/**
 * Generate unique version ID
 */
function generateVersionId(): string {
  return `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get all versions for display in history panel
 */
export function getAllVersions(artifactId: string): ArtifactVersion[] {
  const history = getVersionHistory(artifactId)
  return history ? history.versions : []
}

/**
 * Format version timestamp for display
 */
export function formatVersionTime(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return timestamp.toLocaleDateString()
}
