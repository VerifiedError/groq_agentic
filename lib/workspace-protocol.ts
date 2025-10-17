/**
 * Workspace Command Protocol
 *
 * Defines the structured command format for AI agents to build applications
 * autonomously in the workspace IDE environment.
 */

export type WorkspaceCommandType =
  | 'create-file'
  | 'edit-file'
  | 'delete-file'
  | 'install-package'
  | 'thought'
  | 'complete'

export interface WorkspaceCommand {
  type: WorkspaceCommandType
  timestamp: Date
}

export interface CreateFileCommand extends WorkspaceCommand {
  type: 'create-file'
  path: string
  content: string
  language?: string
}

export interface EditFileCommand extends WorkspaceCommand {
  type: 'edit-file'
  path: string
  action: 'replace' | 'append' | 'modify-lines'
  content: string
  startLine?: number
  endLine?: number
}

export interface DeleteFileCommand extends WorkspaceCommand {
  type: 'delete-file'
  path: string
}

export interface InstallPackageCommand extends WorkspaceCommand {
  type: 'install-package'
  name: string
  version: string
}

export interface ThoughtCommand extends WorkspaceCommand {
  type: 'thought'
  message: string
}

export interface CompleteCommand extends WorkspaceCommand {
  type: 'complete'
  summary: string
}

export type AnyWorkspaceCommand =
  | CreateFileCommand
  | EditFileCommand
  | DeleteFileCommand
  | InstallPackageCommand
  | ThoughtCommand
  | CompleteCommand

export interface WorkspaceState {
  files: Record<string, string>
  dependencies: Record<string, string>
  operations: AnyWorkspaceCommand[]
  isComplete: boolean
}

/**
 * Parse workspace commands from AI response
 */
export function parseWorkspaceCommands(text: string): AnyWorkspaceCommand[] {
  const commands: AnyWorkspaceCommand[] = []
  const timestamp = new Date()

  // Parse [THOUGHT] messages
  const thoughtRegex = /\[THOUGHT\]\s*(.+?)(?=\[|$)/gs
  let match
  while ((match = thoughtRegex.exec(text)) !== null) {
    commands.push({
      type: 'thought',
      message: match[1].trim(),
      timestamp: new Date(timestamp.getTime() + commands.length)
    })
  }

  // Parse [CREATE] file:/path/to/file.tsx
  const createRegex = /\[CREATE\]\s*file:(\S+)\s*```(\w+)?\s*\n([\s\S]*?)```/g
  while ((match = createRegex.exec(text)) !== null) {
    commands.push({
      type: 'create-file',
      path: match[1],
      language: match[2] || undefined,
      content: match[3].trim(),
      timestamp: new Date(timestamp.getTime() + commands.length)
    })
  }

  // Parse [EDIT] file:/path/to/file.tsx
  const editRegex = /\[EDIT\]\s*file:(\S+)\s*action:(replace|append|modify-lines)(?:\s*lines:(\d+)-(\d+))?\s*```(\w+)?\s*\n([\s\S]*?)```/g
  while ((match = editRegex.exec(text)) !== null) {
    commands.push({
      type: 'edit-file',
      path: match[1],
      action: match[2] as 'replace' | 'append' | 'modify-lines',
      startLine: match[3] ? parseInt(match[3]) : undefined,
      endLine: match[4] ? parseInt(match[4]) : undefined,
      content: match[6].trim(),
      timestamp: new Date(timestamp.getTime() + commands.length)
    })
  }

  // Parse [DELETE] file:/path/to/file.tsx
  const deleteRegex = /\[DELETE\]\s*file:(\S+)/g
  while ((match = deleteRegex.exec(text)) !== null) {
    commands.push({
      type: 'delete-file',
      path: match[1],
      timestamp: new Date(timestamp.getTime() + commands.length)
    })
  }

  // Parse [INSTALL] package:name@version
  const installRegex = /\[INSTALL\]\s*package:(\S+)@(\S+)/g
  while ((match = installRegex.exec(text)) !== null) {
    commands.push({
      type: 'install-package',
      name: match[1],
      version: match[2],
      timestamp: new Date(timestamp.getTime() + commands.length)
    })
  }

  // Parse [COMPLETE] message
  const completeRegex = /\[COMPLETE\]\s*(.+?)(?=\[|$)/gs
  while ((match = completeRegex.exec(text)) !== null) {
    commands.push({
      type: 'complete',
      summary: match[1].trim(),
      timestamp: new Date(timestamp.getTime() + commands.length)
    })
  }

  return commands
}

/**
 * Apply workspace commands to state
 */
export function applyWorkspaceCommands(
  state: WorkspaceState,
  commands: AnyWorkspaceCommand[]
): WorkspaceState {
  const newState = { ...state }

  for (const command of commands) {
    newState.operations.push(command)

    switch (command.type) {
      case 'create-file':
        newState.files[command.path] = command.content
        break

      case 'edit-file':
        if (command.action === 'replace') {
          newState.files[command.path] = command.content
        } else if (command.action === 'append') {
          newState.files[command.path] = (newState.files[command.path] || '') + '\n' + command.content
        } else if (command.action === 'modify-lines' && command.startLine && command.endLine) {
          const lines = (newState.files[command.path] || '').split('\n')
          const newLines = command.content.split('\n')
          lines.splice(command.startLine - 1, command.endLine - command.startLine + 1, ...newLines)
          newState.files[command.path] = lines.join('\n')
        }
        break

      case 'delete-file':
        delete newState.files[command.path]
        break

      case 'install-package':
        newState.dependencies[command.name] = command.version
        break

      case 'complete':
        newState.isComplete = true
        break
    }
  }

  return newState
}

/**
 * Validate workspace command
 */
export function validateWorkspaceCommand(command: AnyWorkspaceCommand): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  switch (command.type) {
    case 'create-file':
      if (!command.path) errors.push('create-file: path is required')
      if (!command.content) errors.push('create-file: content is required')
      if (!command.path.startsWith('/')) errors.push('create-file: path must start with /')
      break

    case 'edit-file':
      if (!command.path) errors.push('edit-file: path is required')
      if (!command.action) errors.push('edit-file: action is required')
      if (!command.content) errors.push('edit-file: content is required')
      if (command.action === 'modify-lines' && (!command.startLine || !command.endLine)) {
        errors.push('edit-file: modify-lines requires startLine and endLine')
      }
      break

    case 'delete-file':
      if (!command.path) errors.push('delete-file: path is required')
      break

    case 'install-package':
      if (!command.name) errors.push('install-package: name is required')
      if (!command.version) errors.push('install-package: version is required')
      break

    case 'thought':
      if (!command.message) errors.push('thought: message is required')
      break

    case 'complete':
      if (!command.summary) errors.push('complete: summary is required')
      break
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
