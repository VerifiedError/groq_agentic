/**
 * Artifact Protocol Specification
 *
 * This file defines the structured format for AI responses when creating
 * or modifying code artifacts. The protocol ensures consistent parsing
 * and reliable artifact generation.
 */

// ============================================================================
// ARTIFACT CREATION PROTOCOL
// ============================================================================

/**
 * Artifact metadata containing type, title, and description
 */
export interface ArtifactMetadata {
  title: string
  type: 'react' | 'vanilla-js' | 'html' | 'react-game-3d' | 'react-game-2d'
  description?: string
  entryPoint?: string // Main file path (e.g., '/App.jsx')
}

/**
 * NPM package dependency specification
 */
export interface ArtifactDependency {
  name: string
  version: string
}

/**
 * Individual file in an artifact
 */
export interface ArtifactFile {
  path: string
  content: string
  language?: 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'css' | 'html' | 'json'
}

/**
 * Complete artifact creation specification
 */
export interface ArtifactCreationSpec {
  metadata: ArtifactMetadata
  files: ArtifactFile[]
  dependencies?: ArtifactDependency[]
}

// ============================================================================
// ARTIFACT MODIFICATION PROTOCOL
// ============================================================================

/**
 * Types of modifications that can be applied to artifact files
 */
export type ArtifactEditAction =
  | 'replace'      // Replace entire file
  | 'insert'       // Insert code at specific location
  | 'delete'       // Delete code from specific location
  | 'modify'       // Modify specific lines

/**
 * Location specifier for code modifications
 */
export interface CodeLocation {
  type: 'line' | 'after-line' | 'before-line' | 'range'
  line?: number
  startLine?: number
  endLine?: number
  pattern?: string // Regex pattern to find location
}

/**
 * Single file modification specification
 */
export interface ArtifactFileEdit {
  path: string
  action: ArtifactEditAction
  location?: CodeLocation
  content: string
  description?: string // Human-readable description of change
}

/**
 * Complete artifact modification specification
 */
export interface ArtifactModificationSpec {
  edits: ArtifactFileEdit[]
  summary?: string // Overall description of changes
}

// ============================================================================
// UNIFIED ARTIFACT RESPONSE
// ============================================================================

/**
 * Unified response type that can contain either creation or modification
 */
export interface ArtifactResponse {
  type: 'creation' | 'modification'
  creation?: ArtifactCreationSpec
  modification?: ArtifactModificationSpec
}

// ============================================================================
// XML/JSON FORMAT EXAMPLES
// ============================================================================

/**
 * Example XML format for artifact creation:
 *
 * <artifact>
 *   <metadata>
 *     <title>Todo List App</title>
 *     <type>react</type>
 *     <description>Interactive todo list with add/remove functionality</description>
 *     <entryPoint>/App.jsx</entryPoint>
 *   </metadata>
 *   <dependencies>
 *     <package name="react" version="^18.0.0" />
 *     <package name="react-dom" version="^18.0.0" />
 *   </dependencies>
 *   <files>
 *     <file path="/App.jsx" language="jsx">
 *       <![CDATA[
 *       import React, { useState } from 'react';
 *
 *       export default function App() {
 *         const [todos, setTodos] = useState([]);
 *         // ... rest of code
 *       }
 *       ]]>
 *     </file>
 *     <file path="/styles.css" language="css">
 *       <![CDATA[
 *       .todo-list {
 *         max-width: 600px;
 *         margin: 0 auto;
 *       }
 *       ]]>
 *     </file>
 *   </files>
 * </artifact>
 */

/**
 * Example JSON format for artifact creation:
 *
 * {
 *   "artifact": {
 *     "metadata": {
 *       "title": "Todo List App",
 *       "type": "react",
 *       "description": "Interactive todo list with add/remove functionality",
 *       "entryPoint": "/App.jsx"
 *     },
 *     "dependencies": [
 *       { "name": "react", "version": "^18.0.0" },
 *       { "name": "react-dom", "version": "^18.0.0" }
 *     ],
 *     "files": [
 *       {
 *         "path": "/App.jsx",
 *         "language": "jsx",
 *         "content": "import React, { useState } from 'react';\n\nexport default function App() {\n  // ...\n}"
 *       },
 *       {
 *         "path": "/styles.css",
 *         "language": "css",
 *         "content": ".todo-list { max-width: 600px; margin: 0 auto; }"
 *       }
 *     ]
 *   }
 * }
 */

/**
 * Example XML format for artifact modification:
 *
 * <artifact-edit>
 *   <summary>Add delete functionality to todo items</summary>
 *   <edits>
 *     <edit>
 *       <file path="/App.jsx" />
 *       <action>insert</action>
 *       <location type="after-line" line="25" />
 *       <description>Add delete handler function</description>
 *       <content>
 *         <![CDATA[
 *         const deleteTodo = (id) => {
 *           setTodos(todos.filter(todo => todo.id !== id));
 *         };
 *         ]]>
 *       </content>
 *     </edit>
 *     <edit>
 *       <file path="/App.jsx" />
 *       <action>modify</action>
 *       <location type="range" startLine="35" endLine="40" />
 *       <description>Add delete button to todo item</description>
 *       <content>
 *         <![CDATA[
 *         <li key={todo.id}>
 *           {todo.text}
 *           <button onClick={() => deleteTodo(todo.id)}>Delete</button>
 *         </li>
 *         ]]>
 *       </content>
 *     </edit>
 *   </edits>
 * </artifact-edit>
 */

/**
 * Example JSON format for artifact modification:
 *
 * {
 *   "artifactEdit": {
 *     "summary": "Add delete functionality to todo items",
 *     "edits": [
 *       {
 *         "path": "/App.jsx",
 *         "action": "insert",
 *         "location": { "type": "after-line", "line": 25 },
 *         "description": "Add delete handler function",
 *         "content": "const deleteTodo = (id) => {\n  setTodos(todos.filter(todo => todo.id !== id));\n};"
 *       },
 *       {
 *         "path": "/App.jsx",
 *         "action": "modify",
 *         "location": { "type": "range", "startLine": 35, "endLine": 40 },
 *         "description": "Add delete button to todo item",
 *         "content": "<li key={todo.id}>\n  {todo.text}\n  <button onClick={() => deleteTodo(todo.id)}>Delete</button>\n</li>"
 *       }
 *     ]
 *   }
 * }
 */

// ============================================================================
// PROTOCOL VALIDATION
// ============================================================================

/**
 * Validates artifact creation specification
 */
export function validateArtifactCreation(spec: ArtifactCreationSpec): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!spec.metadata?.title) {
    errors.push('Artifact must have a title')
  }

  if (!spec.metadata?.type) {
    errors.push('Artifact must have a type')
  }

  if (!spec.files || spec.files.length === 0) {
    errors.push('Artifact must have at least one file')
  }

  spec.files?.forEach((file, index) => {
    if (!file.path) {
      errors.push(`File at index ${index} must have a path`)
    }
    if (file.content === undefined || file.content === null) {
      errors.push(`File ${file.path} must have content`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validates artifact modification specification
 */
export function validateArtifactModification(spec: ArtifactModificationSpec): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!spec.edits || spec.edits.length === 0) {
    errors.push('Modification must have at least one edit')
  }

  spec.edits?.forEach((edit, index) => {
    if (!edit.path) {
      errors.push(`Edit at index ${index} must have a file path`)
    }
    if (!edit.action) {
      errors.push(`Edit at index ${index} must have an action`)
    }
    if (edit.content === undefined || edit.content === null) {
      errors.push(`Edit at index ${index} must have content`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
