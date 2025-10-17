/**
 * Reasoning Keyword Highlighter
 * Detects and highlights important keywords, concepts, and technical terms in reasoning text
 */

export interface HighlightedSegment {
  text: string
  type: 'normal' | 'keyword' | 'technical' | 'question' | 'emphasis'
}

// Common technical and reasoning keywords to highlight
const TECHNICAL_TERMS = new Set([
  // Science terms
  'wavelength', 'scattering', 'rayleigh', 'frequency', 'photon', 'molecule', 'atmosphere',
  'spectrum', 'refraction', 'diffraction', 'absorption', 'emission',

  // Math/logic terms
  'algorithm', 'function', 'equation', 'formula', 'theorem', 'proof', 'calculate',
  'derive', 'integrate', 'differentiate', 'optimize', 'minimize', 'maximize',

  // Programming terms
  'variable', 'parameter', 'argument', 'return', 'iterate', 'recursive', 'async',
  'callback', 'promise', 'method', 'class', 'interface', 'type', 'array', 'object',

  // Reasoning terms
  'hypothesis', 'assumption', 'conclusion', 'inference', 'deduction', 'induction',
  'evidence', 'reasoning', 'logic', 'premise', 'consequence',
])

const EMPHASIS_WORDS = new Set([
  'important', 'critical', 'key', 'essential', 'vital', 'crucial', 'significant',
  'main', 'primary', 'fundamental', 'core', 'central', 'major',
  'must', 'should', 'need', 'require', 'necessary',
])

const QUESTION_WORDS = new Set([
  'why', 'how', 'what', 'when', 'where', 'which', 'who', 'whose',
  'could', 'would', 'should', 'might', 'may', 'can',
])

/**
 * Highlight keywords in reasoning text
 * Returns segments with type information for styling
 */
export function highlightReasoningText(text: string): HighlightedSegment[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const segments: HighlightedSegment[] = []

  // Split by word boundaries while preserving punctuation
  const regex = /([a-zA-Z0-9_-]+|[^\w\s]+|\s+)/g
  const matches = text.match(regex)

  if (!matches) {
    return [{ text, type: 'normal' }]
  }

  for (let i = 0; i < matches.length; i++) {
    const token = matches[i]
    const lowerToken = token.toLowerCase()

    // Check for question marks
    if (token === '?') {
      segments.push({ text: token, type: 'question' })
      continue
    }

    // Check for whitespace/punctuation
    if (token.match(/^[\s\W]+$/)) {
      segments.push({ text: token, type: 'normal' })
      continue
    }

    // Check for technical terms
    if (TECHNICAL_TERMS.has(lowerToken)) {
      segments.push({ text: token, type: 'technical' })
      continue
    }

    // Check for emphasis words
    if (EMPHASIS_WORDS.has(lowerToken)) {
      segments.push({ text: token, type: 'emphasis' })
      continue
    }

    // Check for question words
    if (QUESTION_WORDS.has(lowerToken)) {
      segments.push({ text: token, type: 'question' })
      continue
    }

    // Check for capitalized terms (potential proper nouns/important concepts)
    if (token.length > 3 && token[0] === token[0].toUpperCase() && token.slice(1) === token.slice(1).toLowerCase()) {
      // Check if it's at start of sentence
      const prevTokens = matches.slice(Math.max(0, i - 3), i)
      const isProbablySentenceStart = prevTokens.some(t => t.includes('.') || t.includes('!') || t.includes('?'))

      if (!isProbablySentenceStart && i > 0) {
        segments.push({ text: token, type: 'keyword' })
        continue
      }
    }

    // Check for quoted terms
    const prevToken = i > 0 ? matches[i - 1] : ''
    if (prevToken === '"' || prevToken === "'") {
      segments.push({ text: token, type: 'keyword' })
      continue
    }

    // Default to normal
    segments.push({ text: token, type: 'normal' })
  }

  return segments
}

/**
 * Extract key concepts from reasoning text for summary
 * Returns up to 3 most important concepts
 */
export function extractKeyConcepts(text: string): string[] {
  const concepts: string[] = []
  const lowerText = text.toLowerCase()

  // Count occurrences of technical terms
  const termCounts: Record<string, number> = {}

  TECHNICAL_TERMS.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    const matches = lowerText.match(regex)
    if (matches) {
      termCounts[term] = matches.length
    }
  })

  // Sort by frequency and take top 3
  const sortedTerms = Object.entries(termCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([term]) => term)

  return sortedTerms
}

/**
 * Generate a summary line for reasoning section
 * Used in collapsed view
 */
export function generateReasoningSummary(content: string, maxLength: number = 80): string {
  // Remove markdown formatting
  let summary = content
    .replace(/[*_`]/g, '')
    .replace(/\n+/g, ' ')
    .trim()

  // Truncate to first sentence or maxLength
  const firstSentenceMatch = summary.match(/^[^.!?]+[.!?]/)
  if (firstSentenceMatch) {
    summary = firstSentenceMatch[0]
  }

  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...'
  }

  return summary
}

/**
 * Detect if reasoning contains code snippets
 */
export function detectCodeInReasoning(text: string): boolean {
  // Check for common code patterns
  const codePatterns = [
    /```[\s\S]*?```/, // Markdown code blocks
    /`[^`]+`/, // Inline code
    /\b(function|const|let|var|class|interface|def|import|return)\b/, // Keywords
    /[{}\[\]();].*[{}\[\]();]/, // Multiple brackets/parens
    /=>\s*{/, // Arrow functions
    /\w+\.\w+\([^)]*\)/, // Method calls
  ]

  return codePatterns.some(pattern => pattern.test(text))
}

/**
 * Format reasoning text for display (clean up whitespace, etc.)
 */
export function formatReasoningText(text: string): string {
  return text
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .replace(/[ \t]+/g, ' ') // Normalize whitespace
    .trim()
}
