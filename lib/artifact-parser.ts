/**
 * Artifact Response Parser
 *
 * Parses structured artifact responses (XML/JSON) from AI models
 * into TypeScript objects for artifact creation and modification.
 */

import {
  ArtifactCreationSpec,
  ArtifactModificationSpec,
  ArtifactResponse,
  ArtifactFile,
  ArtifactDependency,
  ArtifactFileEdit,
  validateArtifactCreation,
  validateArtifactModification,
} from './artifact-protocol'

// ============================================================================
// XML PARSING
// ============================================================================

/**
 * Extracts XML content from text (finds <artifact> or <artifact-edit> tags)
 */
export function extractXMLArtifact(text: string): { type: 'creation' | 'modification' | null; xml: string | null } {
  // Check for artifact creation
  const creationMatch = text.match(/<artifact[\s\S]*?<\/artifact>/i)
  if (creationMatch) {
    return { type: 'creation', xml: creationMatch[0] }
  }

  // Check for artifact modification
  const modificationMatch = text.match(/<artifact-edit[\s\S]*?<\/artifact-edit>/i)
  if (modificationMatch) {
    return { type: 'modification', xml: modificationMatch[0] }
  }

  return { type: null, xml: null }
}

/**
 * Parses XML text content, extracting value from tags
 */
function parseXMLTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

/**
 * Parses all occurrences of a tag
 */
function parseXMLTags(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'gi')
  const matches: string[] = []
  let match
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim())
  }
  return matches
}

/**
 * Extracts attribute from XML tag
 */
function parseXMLAttribute(tag: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}=["']([^"']*?)["']`, 'i')
  const match = tag.match(regex)
  return match ? match[1] : null
}

/**
 * Parses XML artifact creation response
 */
export function parseXMLCreation(xml: string): ArtifactCreationSpec | null {
  try {
    // Extract metadata
    const metadataXML = parseXMLTag(xml, 'metadata')
    if (!metadataXML) return null

    const title = parseXMLTag(metadataXML, 'title')
    const type = parseXMLTag(metadataXML, 'type')
    const description = parseXMLTag(metadataXML, 'description')
    const entryPoint = parseXMLTag(metadataXML, 'entryPoint')

    if (!title || !type) return null

    // Extract dependencies
    const dependenciesXML = parseXMLTag(xml, 'dependencies')
    const dependencies: ArtifactDependency[] = []

    if (dependenciesXML) {
      const packageTags = dependenciesXML.match(/<package[^>]*\/>/gi) || []
      packageTags.forEach((tag) => {
        const name = parseXMLAttribute(tag, 'name')
        const version = parseXMLAttribute(tag, 'version')
        if (name && version) {
          dependencies.push({ name, version })
        }
      })
    }

    // Extract files
    const filesXML = parseXMLTag(xml, 'files')
    if (!filesXML) return null

    const fileMatches = filesXML.matchAll(/<file[^>]*>([\s\S]*?)<\/file>/gi)
    const files: ArtifactFile[] = []

    for (const match of fileMatches) {
      const fileTag = match[0]
      const fileContent = match[1]

      const path = parseXMLAttribute(fileTag, 'path')
      const language = parseXMLAttribute(fileTag, 'language')

      if (!path) continue

      // Extract CDATA content if present
      const cdataMatch = fileContent.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i)
      const content = cdataMatch ? cdataMatch[1].trim() : fileContent.trim()

      files.push({
        path,
        content,
        language: language as any,
      })
    }

    const spec: ArtifactCreationSpec = {
      metadata: {
        title,
        type: type as any,
        description: description || undefined,
        entryPoint: entryPoint || undefined,
      },
      files,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
    }

    const validation = validateArtifactCreation(spec)
    if (!validation.valid) {
      console.error('Invalid artifact creation spec:', validation.errors)
      return null
    }

    return spec
  } catch (error) {
    console.error('Error parsing XML artifact creation:', error)
    return null
  }
}

/**
 * Parses XML artifact modification response
 */
export function parseXMLModification(xml: string): ArtifactModificationSpec | null {
  try {
    const summary = parseXMLTag(xml, 'summary')

    const editsXML = parseXMLTag(xml, 'edits')
    if (!editsXML) return null

    const editTags = parseXMLTags(editsXML, 'edit')
    const edits: ArtifactFileEdit[] = []

    editTags.forEach((editXML) => {
      const fileTag = parseXMLTag(editXML, 'file')
      const path = fileTag ? parseXMLAttribute(fileTag, 'path') : null
      const action = parseXMLTag(editXML, 'action')
      const descriptionTag = parseXMLTag(editXML, 'description')
      const contentXML = parseXMLTag(editXML, 'content')

      if (!path || !action || !contentXML) return

      // Extract CDATA content
      const cdataMatch = contentXML.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i)
      const content = cdataMatch ? cdataMatch[1].trim() : contentXML.trim()

      // Parse location if present
      const locationXML = parseXMLTag(editXML, 'location')
      let location = undefined

      if (locationXML) {
        const locationType = parseXMLAttribute(locationXML, 'type')
        const line = parseXMLAttribute(locationXML, 'line')
        const startLine = parseXMLAttribute(locationXML, 'startLine')
        const endLine = parseXMLAttribute(locationXML, 'endLine')
        const pattern = parseXMLAttribute(locationXML, 'pattern')

        location = {
          type: locationType as any,
          line: line ? parseInt(line) : undefined,
          startLine: startLine ? parseInt(startLine) : undefined,
          endLine: endLine ? parseInt(endLine) : undefined,
          pattern: pattern || undefined,
        }
      }

      edits.push({
        path,
        action: action as any,
        location,
        content,
        description: descriptionTag || undefined,
      })
    })

    const spec: ArtifactModificationSpec = {
      edits,
      summary: summary || undefined,
    }

    const validation = validateArtifactModification(spec)
    if (!validation.valid) {
      console.error('Invalid artifact modification spec:', validation.errors)
      return null
    }

    return spec
  } catch (error) {
    console.error('Error parsing XML artifact modification:', error)
    return null
  }
}

// ============================================================================
// JSON PARSING
// ============================================================================

/**
 * Extracts JSON artifact from text
 */
export function extractJSONArtifact(text: string): { type: 'creation' | 'modification' | null; json: string | null } {
  try {
    // Try to find JSON blocks
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i)
    if (jsonBlockMatch) {
      const jsonStr = jsonBlockMatch[1].trim()
      const parsed = JSON.parse(jsonStr)

      if (parsed.artifact) return { type: 'creation', json: jsonStr }
      if (parsed.artifactEdit) return { type: 'modification', json: jsonStr }
    }

    // Try to find raw JSON
    const artifactMatch = text.match(/\{"artifact":\s*\{[\s\S]*?\}\}/i)
    if (artifactMatch) return { type: 'creation', json: artifactMatch[0] }

    const editMatch = text.match(/\{"artifactEdit":\s*\{[\s\S]*?\}\}/i)
    if (editMatch) return { type: 'modification', json: editMatch[0] }

    return { type: null, json: null }
  } catch (error) {
    return { type: null, json: null }
  }
}

/**
 * Parses JSON artifact creation response
 */
export function parseJSONCreation(json: string): ArtifactCreationSpec | null {
  try {
    const parsed = JSON.parse(json)
    const artifact = parsed.artifact

    if (!artifact) return null

    const spec: ArtifactCreationSpec = {
      metadata: artifact.metadata,
      files: artifact.files,
      dependencies: artifact.dependencies,
    }

    const validation = validateArtifactCreation(spec)
    if (!validation.valid) {
      console.error('Invalid JSON artifact creation spec:', validation.errors)
      return null
    }

    return spec
  } catch (error) {
    console.error('Error parsing JSON artifact creation:', error)
    return null
  }
}

/**
 * Parses JSON artifact modification response
 */
export function parseJSONModification(json: string): ArtifactModificationSpec | null {
  try {
    const parsed = JSON.parse(json)
    const artifactEdit = parsed.artifactEdit

    if (!artifactEdit) return null

    const spec: ArtifactModificationSpec = {
      edits: artifactEdit.edits,
      summary: artifactEdit.summary,
    }

    const validation = validateArtifactModification(spec)
    if (!validation.valid) {
      console.error('Invalid JSON artifact modification spec:', validation.errors)
      return null
    }

    return spec
  } catch (error) {
    console.error('Error parsing JSON artifact modification:', error)
    return null
  }
}

// ============================================================================
// UNIFIED PARSING
// ============================================================================

/**
 * Main parsing function - attempts both XML and JSON parsing
 */
export function parseArtifactResponse(text: string): ArtifactResponse | null {
  // Try XML first
  const xmlExtract = extractXMLArtifact(text)
  if (xmlExtract.xml) {
    if (xmlExtract.type === 'creation') {
      const creation = parseXMLCreation(xmlExtract.xml)
      if (creation) {
        return { type: 'creation', creation }
      }
    } else if (xmlExtract.type === 'modification') {
      const modification = parseXMLModification(xmlExtract.xml)
      if (modification) {
        return { type: 'modification', modification }
      }
    }
  }

  // Try JSON
  const jsonExtract = extractJSONArtifact(text)
  if (jsonExtract.json) {
    if (jsonExtract.type === 'creation') {
      const creation = parseJSONCreation(jsonExtract.json)
      if (creation) {
        return { type: 'creation', creation }
      }
    } else if (jsonExtract.type === 'modification') {
      const modification = parseJSONModification(jsonExtract.json)
      if (modification) {
        return { type: 'modification', modification }
      }
    }
  }

  return null
}
