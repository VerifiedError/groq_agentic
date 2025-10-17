# Artifact Protocol Documentation

## Overview

The Artifact Protocol is a systematic approach for AI-driven code generation and modification in the Agentic playground. It enables structured, iterative code changes with full transparency and user control.

## Architecture

```
User → Playground → AI (with system prompts) → Structured Response → Parser →
Preview UI → User Approval → Apply Changes → IDE Update
```

### Key Components

1. **System Prompts** (`lib/artifact-system-prompts.ts`)
   - Instructs AI on artifact format
   - Provides context for modifications

2. **Response Parser** (`lib/artifact-parser.ts`)
   - Extracts structured XML/JSON
   - Validates protocol compliance

3. **Protocol Types** (`lib/artifact-protocol.ts`)
   - TypeScript interfaces
   - Validation functions

4. **Chat API** (`app/api/artifacts/[id]/chat/route.ts`)
   - Streaming endpoint
   - Code context injection
   - Edit application

5. **Preview UI** (`components/playground/artifact-changes-preview.tsx`)
   - File-by-file diffs
   - Apply/reject controls

6. **FastMCP Filesystem Server** (`mcp_servers/filesystem_server.py`)
   - Direct file operations via Python
   - 10-100x faster than XML parsing
   - Secure workspace isolation

---

## FastMCP Tool-Based File Operations (Recommended)

### Overview

The artifact chat system now supports **direct file operations** through FastMCP tools, providing significantly better performance and precision compared to XML-based edits.

### Benefits

- **Performance**: 10-100x faster file operations
- **Precision**: Line-specific and pattern-based edits
- **Simplicity**: Natural tool calls instead of verbose XML
- **Security**: Sandboxed artifact workspaces with path traversal protection

### Available Tools

The AI has access to 7 filesystem tools when modifying artifacts:

#### 1. `read_file(path)`
Read the contents of a file in the artifact workspace.

```javascript
// AI calls this tool automatically when needed
read_file("/App.jsx")
// Returns: file contents as string
```

#### 2. `write_file(path, content)`
Write content to a file (creates if doesn't exist).

```javascript
write_file("/App.jsx", "import React from 'react';\n...")
// Returns: "Successfully wrote 150 characters to '/App.jsx'"
```

#### 3. `edit_file(path, old_text, new_text)`
Replace specific text in a file (exact string matching).

```javascript
edit_file("/App.jsx", "count = 0", "count = 10")
// Returns: "Successfully replaced 1 occurrence(s) in '/App.jsx'"
```

#### 4. `delete_file(path)`
Delete a file from the workspace.

```javascript
delete_file("/old-component.jsx")
// Returns: "Successfully deleted '/old-component.jsx'"
```

#### 5. `list_files(directory)`
List all files in a directory.

```javascript
list_files("/components")
// Returns: "📁 hooks/\n📄 Button.jsx (248 bytes)\n📄 Card.jsx (512 bytes)"
```

#### 6. `create_directory(path)`
Create a new directory.

```javascript
create_directory("/utils")
// Returns: "Successfully created directory '/utils'"
```

### How It Works

1. **AI receives context**: Current file contents injected into system prompt
2. **AI explains changes**: Natural language description of what will change
3. **AI calls tools**: Groq SDK tool calling mechanism invokes MCP tools
4. **Tools execute**: Python FastMCP server performs file operations
5. **Results stream**: Tool execution results sent to client in real-time
6. **UI updates**: File changes reflected immediately in IDE

### System Prompt Example

```
You have access to the following filesystem tools:

**Available Tools:**
- read_file(path) - Read file contents
- write_file(path, content) - Write/create a file
- edit_file(path, old_text, new_text) - Find and replace text
- delete_file(path) - Delete a file
- list_files(directory) - List files in a directory
- create_directory(path) - Create a new directory

**How to Use Tools:**
1. For small changes: Use edit_file() to replace specific text
2. For large changes: Use write_file() to replace entire file
3. For new files: Use write_file() to create them
4. For deletions: Use delete_file()

**IMPORTANT RULES:**
- Explain your changes first, then use tools
- Use edit_file() for precision edits (10-100x faster than rewriting)
- Only use write_file() when replacing entire files
```

### Technical Architecture

```
Artifact Chat Request
   ↓
Groq API (with tools parameter)
   ↓
AI generates tool calls
   ↓
executeMCPTool() function
   ↓
Python FastMCP Server
   ↓
Filesystem operations in isolated workspace
   ↓
Results streamed back to client
```

### Security

- **Workspace Isolation**: Each artifact has its own directory (`artifact_workspaces/artifact-123/`)
- **Path Traversal Protection**: `get_workspace_path()` validates all paths
- **Error Handling**: All tools return error messages instead of throwing exceptions

### Configuration

FastMCP server is registered in `.mcp.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "python",
      "args": ["mcp_servers/filesystem_server.py"]
    }
  }
}
```

### Backward Compatibility

XML-based artifact protocol is still supported as a fallback. If the AI doesn't use tools, the system will parse XML `<artifact-edit>` tags automatically.

---

## Artifact Creation Format (Legacy/Fallback)

### XML Structure

```xml
<artifact>
  <metadata>
    <title>Brief Descriptive Title</title>
    <type>react|vanilla-js|html|react-game-3d|react-game-2d</type>
    <description>One sentence description (optional)</description>
  </metadata>
  <dependencies>
    <package name="package-name" version="^1.0.0" />
  </dependencies>
  <files>
    <file path="/App.jsx" language="jsx">
      <![CDATA[
      import React from 'react';

      export default function App() {
        return <h1>Hello World</h1>;
      }
      ]]>
    </file>
  </files>
</artifact>
```

### JSON Structure (Alternative)

```json
{
  "artifact": {
    "metadata": {
      "title": "Brief Descriptive Title",
      "type": "react",
      "description": "One sentence description"
    },
    "files": [
      {
        "path": "/App.jsx",
        "language": "jsx",
        "content": "import React from 'react';\n\nexport default function App() {\n  return <h1>Hello World</h1>;\n}"
      }
    ],
    "dependencies": [
      { "name": "package-name", "version": "^1.0.0" }
    ]
  }
}
```

### Artifact Types

- **react**: React applications (.jsx/.tsx)
- **html**: Static HTML/CSS/JS websites
- **vanilla-js**: Pure JavaScript without frameworks
- **react-game-3d**: React + THREE.js 3D games
- **react-game-2d**: React + Canvas 2D games

---

## Artifact Modification Format

### XML Structure

```xml
<artifact-edit>
  <summary>Brief description of changes</summary>
  <edits>
    <edit>
      <file path="/App.jsx" />
      <action>modify</action>
      <location type="range" startLine="10" endLine="15" />
      <description>What this edit does</description>
      <content>
        <![CDATA[
// New code to replace lines 10-15
        ]]>
      </content>
    </edit>
  </edits>
</artifact-edit>
```

### Edit Actions

- **replace**: Replace entire file with new content
- **insert**: Add code at specific location
- **modify**: Change specific lines
- **delete**: Remove code section

### Location Types

```xml
<!-- Exact line -->
<location type="line" line="42" />

<!-- Insert after line -->
<location type="after-line" line="42" />

<!-- Insert before line -->
<location type="before-line" line="42" />

<!-- Replace range -->
<location type="range" startLine="10" endLine="20" />

<!-- Pattern matching (not yet implemented) -->
<location type="pattern" pattern="function handleSubmit" />
```

---

## System Prompts

### Creation Prompt

The `ARTIFACT_GENERATION_SYSTEM_PROMPT` instructs AI on:
- When to create artifacts
- Required XML/JSON format
- File structure requirements
- CDATA usage for code content
- Complete, runnable code expectations

**Usage** (already set in playground):
```typescript
import { ARTIFACT_GENERATION_SYSTEM_PROMPT } from '@/lib/artifact-system-prompts'

const systemPrompt = ARTIFACT_GENERATION_SYSTEM_PROMPT
```

### Modification Prompt

The `ARTIFACT_CONTEXT_PROMPT` provides AI with:
- Current file contents
- Artifact title and context
- Modification instructions
- Precision targeting guidance

**Usage** (automatic in chat API):
```typescript
import { ARTIFACT_CONTEXT_PROMPT } from '@/lib/artifact-system-prompts'

const contextPrompt = ARTIFACT_CONTEXT_PROMPT(currentFiles, artifactTitle)
```

---

## Testing Workflow

### 1. Create an Artifact

**In Playground**:
1. Navigate to `/playground`
2. Select a model (e.g., llama-3.3-70b-versatile)
3. Send prompt: "Create a React counter app"
4. AI should respond with `<artifact>` tags
5. Artifact appears in sidebar
6. Click to open in IDE viewer

**Verify**:
- Artifact has unique ID
- Files are rendered in Sandpack
- Code executes correctly

### 2. Open Chat Interface

**In IDE Viewer**:
1. Click the chat icon (MessageSquare) in toolbar
2. Chat panel opens on right side
3. Shows "Ask me to modify [artifact title]"

**Verify**:
- Chat panel is visible
- Input field is functional
- No console errors

### 3. Request Code Modification

**Example Prompts**:
- "Add a reset button"
- "Change the background color to blue"
- "Add a max count of 10 with validation"

**AI Response**:
```xml
<artifact-edit>
  <summary>Add reset button to counter</summary>
  <edits>
    <edit>
      <file path="/App.jsx" />
      <action>insert</action>
      <location type="after-line" line="11" />
      <description>Add reset button after increment</description>
      <content>
        <![CDATA[
      <button onClick={() => setCount(0)} style={{ marginLeft: '10px' }}>Reset</button>
        ]]>
      </content>
    </edit>
  </edits>
</artifact-edit>
```

**Verify**:
- AI responds with streaming text
- Response includes `<artifact-edit>` tags
- Changes are detected by parser

### 4. Review Changes in Preview

**Preview Modal**:
- Appears automatically when changes detected
- Shows list of affected files
- Displays line-by-line diff
- Color-coded: red (removed), green (added)

**Verify**:
- Modal appears over IDE
- File list is correct
- Diffs are accurate
- Line numbers match

### 5. Apply or Reject Changes

**Apply Flow**:
1. Click "Apply Changes" button
2. Modal closes
3. Sandpack IDE updates instantly
4. Success toast appears

**Reject Flow**:
1. Click "Reject" button
2. Modal closes
3. No changes applied
4. Can continue chatting

**Verify**:
- Apply button works
- Reject button works
- IDE updates on apply
- No updates on reject

### 6. Multi-Turn Iteration

**Test Scenario**:
1. Create artifact: "React counter"
2. Modify: "Add reset button"
3. Apply changes
4. Modify: "Add max value of 10"
5. Apply changes
6. Modify: "Change button colors"
7. Apply changes

**Verify**:
- Each change builds on previous
- Context is maintained across turns
- No code loss or corruption
- Chat history persists

---

## API Endpoints

### POST `/api/artifacts/[id]/chat`

**Request**:
```typescript
{
  message: string          // User's modification request
  files: Record<string, string>  // Current file contents
  history: Array<{         // Previous conversation
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
}
```

**Response** (SSE stream):
```typescript
// Streaming chunks
data: {"content": "Here's how...", "done": false}

// Final message
data: {"content": "", "done": true, "fileChanges": {...}}
```

**File Changes Format**:
```typescript
{
  "/App.jsx": "// new content",
  "/styles.css": "/* updated styles */"
}
```

---

## Code Examples

### Creating a React Counter

**User Prompt**:
> "Create a React counter with increment and decrement buttons"

**AI Response**:
```xml
<artifact>
  <metadata>
    <title>Counter App</title>
    <type>react</type>
    <description>Simple counter with increment/decrement buttons</description>
  </metadata>
  <files>
    <file path="/App.jsx" language="jsx">
      <![CDATA[
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>{count}</h1>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
      ]]>
    </file>
  </files>
</artifact>
```

### Modifying the Counter

**User Prompt**:
> "Add a reset button"

**AI Response**:
```xml
<artifact-edit>
  <summary>Add reset button to counter</summary>
  <edits>
    <edit>
      <file path="/App.jsx" />
      <action>insert</action>
      <location type="after-line" line="9" />
      <description>Add reset button after increment button</description>
      <content>
        <![CDATA[
      <button onClick={() => setCount(0)} style={{ marginLeft: '10px' }}>Reset</button>
        ]]>
      </content>
    </edit>
  </edits>
</artifact-edit>
```

---

## Troubleshooting

### Chat Not Appearing

**Problem**: Chat icon doesn't open panel

**Solutions**:
- Verify artifact has `id` property
- Check `artifact.id` in console
- Ensure artifact created via playground (not manually)

### Changes Not Previewing

**Problem**: Changes apply immediately without preview

**Solutions**:
- Check API response includes `fileChanges`
- Verify parser recognizes `<artifact-edit>` tags
- Check browser console for parser errors

### Diff Not Showing

**Problem**: Preview shows but no diff content

**Solutions**:
- Verify `oldContent` and `newContent` are different
- Check file paths match exactly
- Ensure line endings are normalized

### API Timeout

**Problem**: Chat request hangs indefinitely

**Solutions**:
- Check GROQ_API_KEY is valid
- Verify model is available
- Check network tab for SSE connection
- Increase timeout in fetch options

---

## Future Enhancements

### Planned Features

1. **Version History**
   - Track all changes to artifact
   - Rollback to previous versions
   - View change timeline

2. **Undo/Redo**
   - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
   - Multiple undo levels
   - Persist across sessions

3. **Syntax Highlighting in Diffs**
   - Language-aware highlighting
   - Better code readability
   - Theme support

4. **Pattern Matching**
   - Regex-based location targeting
   - Fuzzy matching for changed code
   - Smart conflict resolution

5. **Collaborative Editing**
   - Share artifacts via URL
   - Real-time collaboration
   - Comment threads

---

## Best Practices

### For AI Prompts

1. **Be Specific**: "Add a blue reset button" > "Add a button"
2. **Provide Context**: "In the counter app, add validation"
3. **Incremental Changes**: Small edits > large rewrites
4. **Test After Each Change**: Verify before next modification

### For Development

1. **Always Use CDATA**: Prevents XML parsing issues
2. **Validate Line Numbers**: Ensure they match current state
3. **Test Edge Cases**: Empty files, large files, special characters
4. **Handle Errors Gracefully**: Show user-friendly messages

### For Users

1. **Review All Changes**: Don't blindly accept
2. **Reject Bad Edits**: AI makes mistakes
3. **Iterate Carefully**: Build complexity gradually
4. **Save Often**: Export artifacts regularly

---

## Reference

### File Structure

```
lib/
├── artifact-protocol.ts          # TypeScript interfaces
├── artifact-parser.ts             # XML/JSON parsing
└── artifact-system-prompts.ts     # AI instructions

app/api/artifacts/[id]/chat/
└── route.ts                       # Streaming chat endpoint

components/playground/
├── artifact-viewer.tsx            # IDE viewer with chat
├── artifact-chat.tsx              # Chat interface
└── artifact-changes-preview.tsx   # Diff preview modal
```

### Key Functions

```typescript
// Parse AI response
parseArtifactResponse(text: string): ArtifactResponse | null

// Generate context prompt
ARTIFACT_CONTEXT_PROMPT(files: Record<string, string>, title: string): string

// Apply edits to files
applyEdits(files: Record<string, string>, edits: ArtifactFileEdit[]): Record<string, string>
```

---

## License

This artifact protocol is part of the Agentic project.
