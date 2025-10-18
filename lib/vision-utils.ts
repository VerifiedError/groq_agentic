/**
 * Utility functions for vision model detection and multi-modal message formatting
 */

/**
 * Vision models supported by Groq
 */
export const VISION_MODELS = [
  'llama-4-scout-17b',
  'llama-4-maverick-17b',
  'llama-3.2-11b-vision',
  'llama-3.2-90b-vision',
  'llava-v1.5-7b',
]

/**
 * Checks if a model supports vision/image inputs
 */
export function isVisionModel(modelId: string): boolean {
  return VISION_MODELS.some((visionModel) => modelId.includes(visionModel))
}

/**
 * Formats a message with images for Groq's vision API
 * Converts simple { role, content, images } to multi-modal format
 */
export function formatVisionMessage(
  role: 'user' | 'assistant' | 'system',
  content: string,
  images?: string[]
): any {
  // If no images, return simple message
  if (!images || images.length === 0) {
    return { role, content }
  }

  // Format as multi-modal message
  const contentParts: any[] = []

  // Add text content
  if (content) {
    contentParts.push({
      type: 'text',
      text: content,
    })
  }

  // Add images
  for (const image of images) {
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: image, // Base64 data URL
      },
    })
  }

  return {
    role,
    content: contentParts,
  }
}

/**
 * Formats all messages in conversation for vision API
 */
export function formatVisionMessages(
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    images?: string[]
  }>,
  isVision: boolean
): any[] {
  if (!isVision) {
    // For non-vision models, strip images and return simple format
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))
  }

  // For vision models, format with images
  return messages.map((m) => formatVisionMessage(m.role, m.content, m.images))
}
