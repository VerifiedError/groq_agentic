import { ArtifactType } from './artifact-templates'

export interface DetectedCodeBlock {
  language: string
  code: string
  filename: string
}

export interface DetectedArtifact {
  type: ArtifactType
  title: string
  description: string
  files: Record<string, string>
  dependencies?: Record<string, string>
}

/**
 * Detects code blocks in markdown text and extracts them
 */
export function detectCodeBlocks(text: string): DetectedCodeBlock[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: DetectedCodeBlock[] = []
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || 'plaintext'
    const code = match[2].trim()

    // Generate filename based on language
    const filename = getFilenameForLanguage(language)

    blocks.push({
      language: language.toLowerCase(),
      code,
      filename,
    })
  }

  return blocks
}

/**
 * Groups related code blocks into artifacts
 */
export function groupCodeBlocksIntoArtifacts(
  blocks: DetectedCodeBlock[]
): DetectedArtifact[] {
  if (blocks.length === 0) return []

  // Single block detection
  if (blocks.length === 1) {
    const block = blocks[0]
    return [createSingleBlockArtifact(block)]
  }

  // Multi-block detection
  const artifacts: DetectedArtifact[] = []

  // Check for HTML + CSS + JS pattern (web page)
  const htmlBlocks = blocks.filter((b) =>
    ['html', 'htm'].includes(b.language)
  )
  const cssBlocks = blocks.filter((b) => b.language === 'css')
  const jsBlocks = blocks.filter((b) =>
    ['javascript', 'js'].includes(b.language)
  )

  if (htmlBlocks.length > 0 && (cssBlocks.length > 0 || jsBlocks.length > 0)) {
    // Web page artifact
    const files: Record<string, string> = {}

    htmlBlocks.forEach((block, index) => {
      files[index === 0 ? 'index.html' : `page${index}.html`] = block.code
    })

    cssBlocks.forEach((block, index) => {
      files[index === 0 ? 'styles.css' : `styles${index}.css`] = block.code
    })

    jsBlocks.forEach((block, index) => {
      files[index === 0 ? 'script.js' : `script${index}.js`] = block.code
    })

    artifacts.push({
      type: 'html',
      title: 'Web Page',
      description: 'HTML, CSS, and JavaScript web page',
      files,
    })

    return artifacts
  }

  // Check for React components (JSX/TSX)
  const reactBlocks = blocks.filter((b) =>
    ['jsx', 'tsx', 'react'].includes(b.language)
  )

  if (reactBlocks.length > 0) {
    const files: Record<string, string> = {}
    const dependencies: Record<string, string> = {}

    reactBlocks.forEach((block, index) => {
      const ext = block.language === 'tsx' ? '.tsx' : '.jsx'
      files[index === 0 ? `/App${ext}` : `/Component${index}${ext}`] =
        block.code

      // Detect THREE.js usage
      if (block.code.includes('import * as THREE') || block.code.includes('from "three"')) {
        dependencies['three'] = '^0.150.0'
      }
    })

    // Add CSS if present
    cssBlocks.forEach((block, index) => {
      files[index === 0 ? '/styles.css' : `/styles${index}.css`] = block.code
    })

    // Detect artifact type based on content
    let type: ArtifactType = 'react'
    const combinedCode = reactBlocks.map((b) => b.code).join('\n')

    if (combinedCode.includes('THREE.') || combinedCode.includes('from "three"')) {
      type = 'react-game-3d'
    } else if (
      combinedCode.includes('canvas') ||
      combinedCode.includes('getContext("2d")')
    ) {
      type = 'react-game-2d'
    }

    artifacts.push({
      type,
      title: type === 'react-game-3d' ? '3D Game' : type === 'react-game-2d' ? '2D Game' : 'React App',
      description: `Interactive ${type === 'react-game-3d' ? '3D' : type === 'react-game-2d' ? '2D' : 'React'} application`,
      files,
      dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
    })

    return artifacts
  }

  // Default: separate artifacts for each block
  return blocks.map((block) => createSingleBlockArtifact(block))
}

/**
 * Creates an artifact from a single code block
 */
function createSingleBlockArtifact(block: DetectedCodeBlock): DetectedArtifact {
  const { language, code, filename } = block

  // Determine artifact type
  let type: ArtifactType = 'vanilla-js'
  let title = 'Code Snippet'
  let description = `${language} code`

  if (['jsx', 'tsx', 'react'].includes(language)) {
    type = 'react'
    title = 'React Component'
    description = 'React component'

    // Check for THREE.js
    if (code.includes('THREE.') || code.includes('from "three"')) {
      type = 'react-game-3d'
      title = '3D Application'
      description = 'THREE.js 3D application'
    }
  } else if (['html', 'htm'].includes(language)) {
    type = 'html'
    title = 'HTML Document'
    description = 'HTML document'
  } else if (['javascript', 'js'].includes(language)) {
    type = 'vanilla-js'
    title = 'JavaScript Code'
    description = 'Vanilla JavaScript code'
  }

  const files: Record<string, string> = {
    [`/${filename}`]: code,
  }

  const dependencies: Record<string, string> = {}

  // Detect THREE.js dependency
  if (code.includes('import * as THREE') || code.includes('from "three"')) {
    dependencies['three'] = '^0.150.0'
  }

  return {
    type,
    title,
    description,
    files,
    dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
  }
}

/**
 * Generates appropriate filename for language
 */
function getFilenameForLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    jsx: 'App.jsx',
    tsx: 'App.tsx',
    javascript: 'script.js',
    js: 'script.js',
    typescript: 'script.ts',
    ts: 'script.ts',
    html: 'index.html',
    htm: 'index.html',
    css: 'styles.css',
    python: 'main.py',
    java: 'Main.java',
    cpp: 'main.cpp',
    c: 'main.c',
    rust: 'main.rs',
    go: 'main.go',
    react: 'App.jsx',
  }

  return languageMap[language.toLowerCase()] || 'code.txt'
}

/**
 * Main function: detects and extracts artifacts from AI response text
 */
export function extractArtifactsFromResponse(
  responseText: string
): DetectedArtifact[] {
  const codeBlocks = detectCodeBlocks(responseText)

  if (codeBlocks.length === 0) {
    return []
  }

  return groupCodeBlocksIntoArtifacts(codeBlocks)
}
