/**
 * File Parser Engine Types and Utilities
 *
 * This module defines the available file parser engines for processing
 * uploaded files in the playground. Each parser engine determines how
 * files are processed and presented to the AI model.
 */

export type FileParserEngine =
  | 'auto'           // Auto-detect from file extension
  | 'markdown'       // Parse as markdown
  | 'pdf'            // Extract text from PDF
  | 'code'           // Syntax highlighting + language detection
  | 'json-yaml'      // Structured data parsing
  | 'plain-text'     // No special parsing

export interface FileParserOption {
  value: FileParserEngine
  label: string
  description: string
  icon?: string
}

/**
 * Available file parser engine options with metadata
 */
export const FILE_PARSER_OPTIONS: FileParserOption[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Automatically detect parser from file extension',
    icon: '🔍'
  },
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'Parse and render markdown formatting',
    icon: '📝'
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Extract text content from PDF files',
    icon: '📄'
  },
  {
    value: 'code',
    label: 'Code',
    description: 'Syntax highlighting and language detection',
    icon: '💻'
  },
  {
    value: 'json-yaml',
    label: 'JSON/YAML',
    description: 'Parse structured data formats',
    icon: '🗂️'
  },
  {
    value: 'plain-text',
    label: 'Plain Text',
    description: 'No special parsing, raw text only',
    icon: '📋'
  }
]

/**
 * Get parser engine option by value
 */
export function getParserOption(engine: FileParserEngine): FileParserOption | undefined {
  return FILE_PARSER_OPTIONS.find(opt => opt.value === engine)
}

/**
 * Detect parser engine from file extension
 */
export function detectParserEngine(filename: string): FileParserEngine {
  const ext = filename.toLowerCase().split('.').pop() || ''

  // Markdown files
  if (['md', 'markdown', 'mdown'].includes(ext)) {
    return 'markdown'
  }

  // PDF files
  if (ext === 'pdf') {
    return 'pdf'
  }

  // Code files
  if ([
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs',
    'rb', 'php', 'swift', 'kt', 'sh', 'bash', 'html', 'css', 'scss', 'sql'
  ].includes(ext)) {
    return 'code'
  }

  // Structured data
  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) {
    return 'json-yaml'
  }

  // Default to plain text
  return 'plain-text'
}

/**
 * Parse file content based on selected engine
 *
 * Note: This is a placeholder for future implementation.
 * Currently just returns the raw content.
 */
export function parseFileContent(
  content: string,
  engine: FileParserEngine,
  filename?: string
): string {
  // Future implementation will include actual parsing logic
  // For now, just return raw content

  // If auto mode, detect from filename
  if (engine === 'auto' && filename) {
    engine = detectParserEngine(filename)
  }

  // TODO: Implement actual parsing logic for each engine type
  // - markdown: render markdown to plain text or HTML
  // - pdf: extract text using PDF parser library
  // - code: add syntax metadata or formatting
  // - json-yaml: parse and validate structure
  // - plain-text: return as-is

  return content
}
