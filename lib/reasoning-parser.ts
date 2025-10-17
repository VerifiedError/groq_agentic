/**
 * Reasoning Parser
 * Parses raw reasoning text into structured sections/steps for display
 * Supports multiple reasoning formats from different AI models
 */

export interface ReasoningSection {
  id: string
  type: 'step' | 'analysis' | 'conclusion' | 'question' | 'consideration'
  title: string
  content: string
  stepNumber?: number
  isComplete: boolean
}

export interface ParsedReasoning {
  sections: ReasoningSection[]
  totalSteps: number
  isComplete: boolean
}

/**
 * Parse reasoning text into structured sections
 * Detects natural thought boundaries, numbered steps, section headers
 */
export function parseReasoning(reasoning: string, isStreaming: boolean = false): ParsedReasoning {
  if (!reasoning || reasoning.trim().length === 0) {
    return {
      sections: [],
      totalSteps: 0,
      isComplete: !isStreaming,
    }
  }

  const sections: ReasoningSection[] = []
  let stepCounter = 0

  // Split by double newlines (paragraph boundaries) or single newlines
  const paragraphs = reasoning
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  // If only one paragraph, split by single newlines for more granularity
  const chunks = paragraphs.length === 1
    ? reasoning.split(/\n/).map(p => p.trim()).filter(p => p.length > 0)
    : paragraphs

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    // Skip empty chunks
    if (!chunk || chunk.length === 0) continue

    // Detect section type based on content patterns
    const sectionType = detectSectionType(chunk)
    const title = generateSectionTitle(chunk, stepCounter, sectionType)

    // Increment step counter for step-type sections
    if (sectionType === 'step' || sectionType === 'analysis') {
      stepCounter++
    }

    sections.push({
      id: `reasoning-section-${i}`,
      type: sectionType,
      title,
      content: chunk,
      stepNumber: sectionType === 'step' || sectionType === 'analysis' ? stepCounter : undefined,
      isComplete: !isStreaming || i < chunks.length - 1, // Last section incomplete if streaming
    })
  }

  // If no sections detected, create a single section
  if (sections.length === 0 && reasoning.trim().length > 0) {
    sections.push({
      id: 'reasoning-section-0',
      type: 'analysis',
      title: 'Model Thinking',
      content: reasoning.trim(),
      stepNumber: 1,
      isComplete: !isStreaming,
    })
  }

  return {
    sections,
    totalSteps: stepCounter,
    isComplete: !isStreaming,
  }
}

/**
 * Detect the type of reasoning section based on content patterns
 */
function detectSectionType(content: string): ReasoningSection['type'] {
  const lower = content.toLowerCase()

  // Question patterns
  if (
    lower.match(/^(okay|alright|so|hmm|wait|let me|should i)/i) ||
    content.endsWith('?')
  ) {
    return 'question'
  }

  // Conclusion patterns
  if (
    lower.match(/^(therefore|thus|so|in conclusion|finally|to summarize)/i) ||
    lower.includes('should cover') ||
    lower.includes('that should')
  ) {
    return 'conclusion'
  }

  // Consideration/verification patterns
  if (
    lower.match(/^(wait|hold on|but|however|actually|i should check)/i) ||
    lower.includes('maybe') ||
    lower.includes('i recall')
  ) {
    return 'consideration'
  }

  // Numbered or bulleted steps
  if (lower.match(/^(\d+[\.)]\s|[-*•]\s|first|second|third|next|then)/)) {
    return 'step'
  }

  // Default to analysis
  return 'analysis'
}

/**
 * Generate a concise title for a reasoning section
 */
function generateSectionTitle(content: string, stepNumber: number, type: ReasoningSection['type']): string {
  // Extract first sentence or first 60 characters
  const firstSentence = content.split(/[.!?]/)[0].trim()
  const preview = firstSentence.length > 60
    ? firstSentence.substring(0, 60) + '...'
    : firstSentence

  // Generate title based on type
  switch (type) {
    case 'question':
      if (content.toLowerCase().startsWith('okay') || content.toLowerCase().startsWith('alright')) {
        return 'Understanding the Request'
      }
      if (content.toLowerCase().includes('should i') || content.toLowerCase().includes('should we')) {
        return 'Considering Options'
      }
      if (content.endsWith('?')) {
        return preview.replace(/^(okay|alright|so|hmm|wait|let me),?\s*/i, '').trim() || 'Asking a Question'
      }
      return 'Initial Thoughts'

    case 'conclusion':
      if (content.toLowerCase().includes('should cover') || content.toLowerCase().includes('that should')) {
        return 'Final Check'
      }
      return 'Reaching Conclusion'

    case 'consideration':
      if (content.toLowerCase().startsWith('wait')) {
        return 'Reconsidering'
      }
      if (content.toLowerCase().includes('i recall') || content.toLowerCase().includes('i remember')) {
        return 'Recalling Information'
      }
      return 'Verifying Approach'

    case 'step':
      // Try to extract step description
      const stepMatch = content.match(/^(\d+[\.)]\s|[-*•]\s)?(.+?)([.!?]|$)/i)
      if (stepMatch && stepMatch[2]) {
        const stepDesc = stepMatch[2].trim()
        return stepDesc.length > 50 ? stepDesc.substring(0, 50) + '...' : stepDesc
      }
      return `Step ${stepNumber}`

    case 'analysis':
    default:
      // Try to extract key topic from first sentence
      if (content.toLowerCase().includes('light scatter') || content.toLowerCase().includes('rayleigh')) {
        return 'Analyzing Light Scattering'
      }
      if (content.toLowerCase().includes('wavelength')) {
        return 'Examining Wavelengths'
      }
      if (content.toLowerCase().includes('atmosphere')) {
        return 'Considering Atmospheric Effects'
      }
      if (content.toLowerCase().includes('related to')) {
        return 'Identifying Key Concepts'
      }

      // Generic title based on position
      return stepNumber > 0 ? `Analysis Step ${stepNumber}` : 'Thinking Process'
  }
}

/**
 * Merge new reasoning content with existing parsed reasoning
 * Used for streaming updates
 */
export function mergeReasoningUpdates(
  existing: ParsedReasoning,
  newReasoning: string,
  isStreaming: boolean = true
): ParsedReasoning {
  // Parse the complete new reasoning
  const newParsed = parseReasoning(newReasoning, isStreaming)

  // If no existing sections, return new parsed reasoning
  if (existing.sections.length === 0) {
    return newParsed
  }

  // Check if we need to update the last section or add new sections
  const existingSections = [...existing.sections]
  const lastSection = existingSections[existingSections.length - 1]

  // If new parsed has more sections, merge
  if (newParsed.sections.length > existingSections.length) {
    // Mark previous last section as complete
    if (lastSection && !lastSection.isComplete) {
      lastSection.isComplete = true
    }

    // Add new sections
    const newSections = newParsed.sections.slice(existingSections.length)
    return {
      sections: [...existingSections, ...newSections],
      totalSteps: newParsed.totalSteps,
      isComplete: newParsed.isComplete,
    }
  }

  // If same number of sections, update the last one if still streaming
  if (newParsed.sections.length === existingSections.length && isStreaming) {
    const updatedLastSection = newParsed.sections[newParsed.sections.length - 1]
    existingSections[existingSections.length - 1] = {
      ...updatedLastSection,
      id: lastSection.id, // Keep same ID
      isComplete: false, // Still streaming
    }
  }

  return {
    sections: existingSections,
    totalSteps: newParsed.totalSteps,
    isComplete: newParsed.isComplete,
  }
}

/**
 * Extract reasoning from content with <think> tags
 * Compatible with existing extractThinking function
 */
export function extractThinkTags(content: string): { reasoning: string; cleanContent: string } {
  // Pattern: <think>...</think> tags
  const thinkTagMatch = content.match(/<think>([\s\S]*?)<\/think>/i)
  if (thinkTagMatch) {
    return {
      reasoning: thinkTagMatch[1].trim(),
      cleanContent: content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    }
  }

  // Pattern: <reasoning>...</reasoning> tags
  const reasoningTagMatch = content.match(/<reasoning>([\s\S]*?)<\/reasoning>/i)
  if (reasoningTagMatch) {
    return {
      reasoning: reasoningTagMatch[1].trim(),
      cleanContent: content.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim()
    }
  }

  return {
    reasoning: '',
    cleanContent: content
  }
}
