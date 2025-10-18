/**
 * Generates an intelligent session name from the first user message
 * Extracts key topics and creates titles like "Chat about React hooks" or "Help with Python code"
 */
export function generateSessionName(firstMessage: string): string {
  // Remove extra whitespace and limit length
  const cleaned = firstMessage.trim().slice(0, 200)

  // If message is very short (less than 30 chars), use it directly with prefix
  if (cleaned.length < 30) {
    return `Chat: ${cleaned}`
  }

  // Extract first sentence (up to period, question mark, or exclamation)
  const firstSentence = cleaned.split(/[.!?]/)[0]?.trim()

  if (!firstSentence || firstSentence.length < 10) {
    // Fall back to first 50 characters
    return `${cleaned.slice(0, 50)}${cleaned.length > 50 ? '...' : ''}`
  }

  // If first sentence is reasonable length (10-60 chars), use it
  if (firstSentence.length <= 60) {
    return firstSentence
  }

  // Extract key phrases using common question/request patterns
  const patterns = [
    /(?:help|assist|show|explain|teach|tell|write|create|build|make|fix|debug|solve|find)(?:\s+(?:me|with|how|to))?\s+(.+)/i,
    /(?:how|what|why|when|where|which|who)\s+(?:do|does|is|are|can|should|would)\s+(.+)/i,
    /(?:i|i'm|i am|we|we're|we are)\s+(?:trying|want|need|working|building|creating)\s+(?:to\s+)?(.+)/i,
  ]

  for (const pattern of patterns) {
    const match = firstSentence.match(pattern)
    if (match && match[1]) {
      const extracted = match[1].trim()
      // Capitalize first letter
      const capitalized = extracted.charAt(0).toUpperCase() + extracted.slice(1)
      return capitalized.length <= 60 ? capitalized : `${capitalized.slice(0, 57)}...`
    }
  }

  // Fall back to first sentence
  return firstSentence.length <= 60
    ? firstSentence
    : `${firstSentence.slice(0, 57)}...`
}

/**
 * Checks if a session name is auto-generated (default) or user-defined
 */
export function isDefaultSessionName(name: string): boolean {
  return (
    name === 'New Chat' ||
    name.startsWith('Chat ') ||
    name.startsWith('New Agentic Session')
  )
}
