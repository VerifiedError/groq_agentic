# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📚 Groq API Documentation Reference

### 🔍 Search & Web Tools
- **[Web Search](https://console.groq.com/docs/web-search)** - Real-time web search capabilities
- **[Browser Search](https://console.groq.com/docs/browser-search)** - Search with browser context
- **[Visit Website](https://console.groq.com/docs/visit-website)** - Fetch and parse web pages

### 🤖 Automation & Execution
- **[Browser Automation](https://console.groq.com/docs/browser-automation)** - Automated browser interactions
- **[Code Execution](https://console.groq.com/docs/code-execution)** - Execute code in sandboxed environment

### 🧮 Knowledge & Computation
- **[Wolfram Alpha](https://console.groq.com/docs/wolfram-alpha)** - Advanced computational knowledge engine

### 🏗️ Models & Systems
- **[Models](https://console.groq.com/docs/models)** - Available models and capabilities
- **[Compound Built-in Tools](https://console.groq.com/docs/compound/built-in-tools)** - Groq Compound model tool system
- **[MCP (Model Context Protocol)](https://console.groq.com/docs/mcp)** - Integration with MCP ecosystem

### ⚡ Performance & Optimization
- **[Prompt Caching](https://console.groq.com/docs/prompt-caching)** - Optimize repeated prompts and reduce latency

---

**Remember**: Professional code, no AI attribution, track everything in GitHub!
- when writing on GitHub you cannot mention Claude for any reason
- use playwright tools at all times if they're available so you can perform tests and read the output from the console
- do not run Bash(taskkill //F //IM node.exe)
- never force kill node as it will kill the claude code CLI
- do not mention claude at all when uploading to github under any circumstance, and if you make this mistake, you will correct your mistake.

## 🚨 CRITICAL: GitHub Change Tracking Workflow

**MANDATORY PROCESS FOR ALL CODE CHANGES:**

### Before Making Any Code Changes:

1. **Create a GitHub Issue FIRST**
   ```bash
   gh issue create --title "Brief description" --body "Detailed explanation"
   ```
   - Use descriptive titles that explain what will be changed
   - Include rationale, expected behavior, and technical details
   - Reference related issues if applicable
   - Get the issue number for later reference

2. **Present Changes to User for Approval**
   - Explain what will be changed and why
   - Detail all files that will be modified
   - Describe the implementation approach
   - Wait for explicit user approval before proceeding

3. **After Approval: Implement and Push**
   ```bash
   git add <changed-files>
   git commit -m "Description of changes (closes #issue-number)"
   git push origin master
   ```
   - Include issue number in commit message using `closes #X` or `fixes #X`
   - Push changes immediately after approval
   - Update the issue with commit details if needed

### Why This Matters:
- **Traceability**: Every change has a documented reason
- **Accountability**: Clear approval process prevents unwanted modifications
- **History**: Complete audit trail of all project decisions
- **Collaboration**: Other developers can understand the evolution

### Example Workflow:
```bash
# 1. User requests: "Add dark mode toggle"
gh issue create --title "Add dark mode toggle to settings" \
  --body "Implement user-configurable dark mode with persistence"

# 2. Present plan to user:
# "I will modify:
#  - components/settings.tsx (add toggle component)
#  - lib/theme-store.ts (add theme state management)
#  - app/globals.css (add dark mode CSS variables)
# Is this acceptable?"

# 3. After user approval:
git add components/settings.tsx lib/theme-store.ts app/globals.css
git commit -m "Add dark mode toggle to settings (closes #42)"
git push origin master
```

**NEVER skip creating an issue. NEVER push code without approval. This project requires complete GitHub tracking.**

---

## 🐳 CRITICAL: Docker Deployment Workflow

**MANDATORY: Every code change MUST be immediately deployable via Docker**

### The Golden Rule:
**EVERY UPDATE → GITHUB → DOCKER READY**

This ensures the user can rebuild their Docker container at any time to get all the latest features and fixes.

### Complete Workflow for Every Change:

1. **Make Code Changes** (as described above with GitHub workflow)
   ```bash
   # Create issue, get approval, implement changes
   gh issue create --title "Feature description"
   # ... make changes ...
   git add <files>
   git commit -m "Description (closes #X)"
   git push origin master
   ```

2. **Verify Docker Compatibility** (automatically happens via Dockerfile)
   - All migrations are included (in `prisma/migrations/`)
   - All new dependencies are in `package.json`
   - All API routes have `export const dynamic = 'force-dynamic'`
   - All new files are not excluded in `.dockerignore`

3. **User Can Deploy Anytime**
   ```bash
   # User runs this to get ALL updates:
   docker-start.bat
   # Choose option 5 (Clean rebuild)
   ```

### Docker Rebuild Process (User's Perspective):

When the user wants to deploy all updates to Docker:

```bash
# 1. Pull latest code (if needed)
git pull origin master

# 2. Run docker-start.bat
docker-start.bat

# 3. Choose option 5: Clean rebuild (if having database/migration issues)
#    OR option 1: Build and start (for regular updates)

# The script will:
# - Stop old containers
# - Rebuild image from scratch with ALL latest code
# - Deploy ALL database migrations
# - Start fresh containers with all updates
```

### What This Means for Development:

✅ **DO:**
- Always push ALL changes to GitHub immediately
- Test that Docker builds work (check Dockerfile compatibility)
- Include database migrations in every schema change
- Add new environment variables to `.env.local.template`
- Document Docker-specific setup in commit messages

❌ **DON'T:**
- Leave uncommitted code changes
- Skip pushing "minor" updates
- Add files to `.dockerignore` without careful consideration
- Forget to test that migrations work in fresh databases
- Create environment-specific code that breaks in Docker

### Why This Matters:

- **User Flexibility**: User can deploy updates whenever they want
- **Clean Deploys**: Fresh Docker rebuild ensures no leftover state
- **Version Control**: Every Docker deployment matches a specific git commit
- **Reproducibility**: Same code = same Docker container, always
- **CI/CD Ready**: Project is always in a deployable state

### Example Complete Workflow:

```bash
# User requests: "Add export feature for chat sessions"

# 1. Create issue
gh issue create --title "Add CSV export for chat sessions" \
  --body "Allow users to export session history as CSV"

# 2. Get approval and implement
# ... make changes to code ...

# 3. Test locally
npm run build  # Ensure build works

# 4. Commit and push
git add app/api/sessions/export/route.ts components/export-button.tsx
git commit -m "Add CSV export for chat sessions (closes #X)"
git push origin master

# 5. User can now deploy to Docker anytime:
# - Runs docker-start.bat
# - Chooses option 5 (clean rebuild)
# - Gets ALL updates including the new export feature
```

**REMEMBER: Code on GitHub = Code in Docker. Always push, always deployable!**

---

## Project Overview

**Agentic** is a standalone AI chat application built with Next.js 15 that uses Groq's Compound agentic system. The application provides a ChatGPT-like interface with session management, cost tracking, and support for Groq's built-in tools (web search, code execution, browser automation).

## Development Commands

### ⚠️ CRITICAL WARNINGS
**NEVER run these commands:**
- `taskkill /F /IM node.exe /T` - This will kill the Claude Code CLI process
- Any force-kill command targeting all node processes

**To stop the dev server properly:**
- Press `Ctrl+C` in the terminal running `app.bat`
- Or close the terminal window
- Use `app.bat` which handles port cleanup automatically

### Starting the Application
```bash
# Use app.bat (Windows) - automatically kills processes on port 13380
app.bat

# Or use npm directly
npm run dev -- -p 13380
```

The app runs on **port 13380** (not the default 3000). The `app.bat` script automatically:
- Checks if port 13380 is in use
- Terminates any existing process using that port
- Starts the Next.js dev server with Turbopack

### Database Commands
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration_name>

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Build and Lint
```bash
# Production build with Turbopack
npm run build

# Run ESLint
npm run lint

# Start production server
npm start
```

### Docker Commands
```bash
# Build and run with Docker Compose (recommended)
docker-compose up

# Build and run in detached mode
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up --build

# Build Docker image manually
docker build -t groq-agentic .

# Run Docker container manually
docker run -p 13380:13380 --env-file .env.local groq-agentic

# Access running container
docker exec -it groq-agentic sh

# Clean up volumes (WARNING: deletes database)
docker-compose down -v
```

**Docker Features:**
- Multi-stage build for optimized image size
- Automatic Prisma migrations on startup
- SQLite database persistence via volume
- Health checks every 30 seconds
- Non-root user for security
- Port 13380 exposed

**Requirements:**
- Docker Engine 20.10+
- Docker Compose 2.0+ (optional but recommended)
- `.env.local` file with required environment variables

## Architecture

### Core Technology Stack
- **Framework**: Next.js 15.5.5 (App Router with Turbopack)
- **UI**: React 19.1.0 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v4 with credentials provider
- **State Management**: Zustand with persistence
- **AI Provider**: Groq SDK (official, not OpenAI SDK)

### Database Schema (Prisma)

The application has 4 main models:

1. **User** - User accounts with auto-creation on login
2. **AgenticSession** - Chat sessions with cost tracking (totalCost, inputTokens, outputTokens, messageCount) and model selection
3. **AgenticMessage** - Individual messages with:
   - role (user/assistant/system)
   - content (text)
   - per-message cost tracking
   - toolCalls (JSON array of tool executions)
   - attachments (JSON array of base64-encoded images)
4. **GroqModel** - Available Groq models (synced from Groq API):
   - id (model ID)
   - displayName (human-readable name)
   - contextWindow (max context length)
   - inputPricing/outputPricing (cost per 1M tokens)
   - isVision (image support flag)
   - isActive (availability flag)

Key relationships:
- User → AgenticSession (one-to-many)
- AgenticSession → AgenticMessage (one-to-many with cascade delete)

### Application Structure

```
app/
├── api/
│   ├── agentic/
│   │   ├── route.ts                    # Main streaming chat endpoint (POST)
│   │   └── sessions/
│   │       ├── route.ts                # List/create sessions (GET/POST)
│   │       └── [id]/
│   │           ├── route.ts            # Get/update/delete session (GET/PATCH/DELETE)
│   │           └── messages/route.ts   # Get session messages (GET)
│   ├── playground/
│   │   └── route.ts                    # Playground streaming endpoint (POST)
│   ├── models/
│   │   ├── route.ts                    # Fetch models from DB (GET)
│   │   └── refresh/route.ts            # Sync models from Groq API (POST, auth required)
│   └── auth/[...nextauth]/route.ts     # NextAuth handler
├── page.tsx                            # Main chat interface
├── playground/page.tsx                 # Playground chat interface
├── login/page.tsx                      # Login page
└── layout.tsx                          # Root layout with providers

components/agentic/
├── session-sidebar.tsx                 # Session list sidebar
├── session-header.tsx                  # Session title and stats
├── new-session-button.tsx              # Model selection dialog (Agentic + Vision)
└── message-cost-badge.tsx              # Cost display per message

lib/
├── auth.ts                             # NextAuth configuration
├── prisma.ts                           # Prisma client singleton
├── groq.ts                             # Groq SDK + pricing + cost calc + isVisionModel()
├── rate-limit.ts                       # Rate limiting middleware
└── utils/
    └── groq-tool-costs.ts              # Tool usage parsing and cost calculation

stores/
└── agentic-session-store.ts            # Zustand store for sessions and messages
```

### Key Architectural Patterns

#### 1. Streaming AI Responses
The `/api/agentic` endpoint uses Server-Sent Events (SSE) to stream responses:
- User message is saved to database immediately
- Groq API streams response chunks via `groq.chat.completions.create({ stream: true })`
- Each chunk is sent to client as `data: {content, done, usage}`
- When complete (`done: true`), assistant message is saved with full cost tracking
- Client refetches messages and sessions to update UI with cost data

#### 2. Cost Tracking
Per-message and per-session cost tracking using Groq pricing:
- Token counts from Groq API response (`usage.prompt_tokens`, `usage.completion_tokens`)
- Pricing defined in `lib/groq.ts` (GROQ_PRICING object) per model
- Tool costs calculated from `executed_tools` field (unique to Groq SDK)
- Costs stored in both `AgenticMessage` (per message) and aggregated in `AgenticSession`

#### 3. Authentication Flow
- Simple auto-registration: any email creates a user account (development mode)
- NextAuth.js JWT sessions with custom callbacks
- Protected routes check session and redirect to `/login` if unauthenticated
- All API routes verify session and user ownership before database operations

#### 4. Next.js 15 Dynamic Routes
**IMPORTANT**: Next.js 15 requires `params` to be awaited in dynamic routes:
```typescript
// Correct pattern (already implemented)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // use id...
}
```

#### 5. State Management
Zustand store (`agentic-session-store.ts`) manages:
- Sessions list and active session
- Messages for active session
- Loading states
- API actions (fetch, create, update, delete)
- Only `activeSessionId` is persisted to localStorage

### Model Management & Database Integration

The application features a **dynamic model management system** that syncs Groq models from the API to a local database:

#### Database Schema
The `GroqModel` table stores all available Groq models:
- `id` - Model ID from Groq API (e.g., 'llama-3.3-70b-versatile')
- `displayName` - Human-readable name
- `contextWindow` - Max context length
- `inputPricing` - Cost per 1M input tokens
- `outputPricing` - Cost per 1M output tokens
- `isVision` - Boolean flag for image support
- `isActive` - Availability flag
- `createdAt` / `updatedAt` - Timestamps

#### API Endpoints

**GET /api/models**
- Fetches active models from database
- Falls back to hardcoded `GROQ_PRICING` if database is empty
- Returns models sorted by vision capability
- Response includes `source` field ('database' or 'fallback')

**POST /api/models/refresh** (Authenticated)
- Syncs models from Groq API to database
- Calls `groq.models.list()` to fetch latest models
- Detects vision models using pattern matching:
  - Vision keywords: 'vision', 'llava'
  - Specific models: 'llama-4-maverick', 'llama-4-scout'
  - Version patterns: 'llama-3.2-11b', 'llama-3.2-90b'
- Upserts each model (atomic update or create)
- Returns sync count and updated model list

#### UI Integration
The New Session modal (`components/agentic/new-session-button.tsx`) includes:
- **Refresh button** (RefreshCw icon) in modal header
- Automatically fetches models on modal open
- Loading spinner during fetch
- Empty state with refresh prompt
- Success/error toast notifications
- Separate sections for Agentic vs Vision models

#### Architecture Benefits
- **Database-first**: Models stored in SQLite for fast access
- **Fallback strategy**: Hardcoded pricing ensures app always works
- **Automatic categorization**: Vision models detected and grouped
- **Cost tracking**: Per-model pricing stored for accurate cost calculation
- **Sync on demand**: Refresh button updates models without code changes

### Groq Models

The application supports two types of models:

#### **Compound Agentic Models** (Built-in Tools)
- `groq/compound` - Production system (free, 0 cost)
- `groq/compound-mini` - Lightweight system (free, 0 cost)

These models have **built-in tools**:
- Web search
- Code execution
- Browser automation

The `/api/agentic` endpoint does NOT pass custom tools for Compound models - it relies entirely on Groq's built-in capabilities.

#### **Vision Models** (Image Understanding)
The application also supports vision models for image analysis:
- `meta-llama/llama-4-scout-17b-16e-instruct` - Fast vision model ($0.11/$0.34 per 1M tokens)
- `meta-llama/llama-4-maverick-17b-128e-instruct` - Advanced vision ($0.20/$0.60 per 1M tokens)
- `llama-3.2-11b-vision-preview` - Efficient vision ($0.18/$0.18 per 1M tokens)
- `llama-3.2-90b-vision-preview` - High-performance vision ($0.90/$0.90 per 1M tokens)
- `llava-v1.5-7b-4096-preview` - Free vision model

**Vision Model Features**:
- Support for image uploads (max 5 images per message, 4MB each)
- Multi-modal messages (text + images) sent to Groq API
- Images stored as base64 in database
- Automatic validation: vision models required when uploading images

### Code Artifacts & Interactive IDE

The playground includes a full-featured **IDE/Artifacts system** that allows AI models to generate, execute, and display interactive code directly in the browser.

#### Overview
- **Sandpack Integration**: Uses CodeSandbox's Sandpack for client-side code bundling and execution
- **No Docker Required**: All code runs in-browser with secure iframe sandboxing
- **Multi-Language Support**: React, Vanilla JS, HTML/CSS, with NPM package support
- **Live Preview**: Real-time code execution with hot reload
- **Full IDE Experience**: Code editor, file tree, preview pane, and console

#### Database Schema
```prisma
model Artifact {
  id            String   @id @default(cuid())
  sessionId     String   // Associated chat session

  type          String   // 'react', 'vanilla-js', 'html', 'react-game-3d', 'react-game-2d'
  title         String
  description   String?

  files         String   // JSON: { "App.js": "...", "styles.css": "..." }
  dependencies  String?  // JSON: { "three": "^0.150.0" }

  template      String?  // Template ID used
  isPublic      Boolean  @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Component Architecture

**Core Components** (`components/playground/`):
- `artifact-viewer.tsx` - Full-screen IDE modal with Sandpack
- `artifact-button.tsx` - Template selection and creation modal
- `artifact-templates.ts` - Pre-built templates library

**Features**:
- **File Management**: Multi-file projects with file tree navigation
- **Code Editor**: Syntax highlighting, line numbers, error detection
- **Live Preview**: Instant preview updates on code changes
- **View Modes**: Code-only, Split view, Preview-only
- **Console**: Real-time console output and error display
- **Controls**: Copy, Download, Delete, Fullscreen toggle

#### Built-in Templates

1. **React App** - Basic React starter with hooks
2. **Whisker World** - 3D game with THREE.js (cat platformer adventure)
3. **2D Platformer** - Canvas-based game with physics
4. **Interactive Dashboard** - Modern dashboard with charts
5. **Landing Page** - Product landing page template
6. **Vanilla JavaScript** - Pure JS without frameworks

#### Usage in Playground

**Creating Artifacts**:
```typescript
// Click "New Artifact" button
// Select template (e.g., Whisker World)
// Optionally customize title
// Click "Create Artifact"
```

**Artifact Storage**:
- Artifacts stored per-chat-session in localStorage
- Associated with `ChatSession` via `artifacts` array
- Persisted across page refreshes
- Can be deleted individually

**Code Execution**:
- Sandpack bundles code in-browser
- NPM dependencies fetched from CDN
- Secure iframe sandbox prevents code from accessing parent page
- THREE.js and other libraries supported

#### Auto-Detection from AI Responses

**NEW FEATURE**: Artifacts are automatically detected and created from AI model responses containing code blocks.

**How It Works**:
1. AI responds with markdown code blocks (```language...```)
2. `extractArtifactsFromResponse()` parses and groups related code
3. Artifacts created automatically with toast notification
4. Artifact cards displayed inline with chat messages

**Detection Logic** (`lib/code-detector.ts`):
- **Single File**: Detects language and creates appropriate artifact type
- **Multi-File**: Groups HTML + CSS + JS into web page artifact
- **React Components**: Detects JSX/TSX and creates React artifacts
- **3D Games**: Detects THREE.js imports and creates react-game-3d type
- **Dependencies**: Auto-detects NPM packages (e.g., THREE.js)

**Example Multi-File Detection**:
```typescript
// AI Response:
// ```html
// <!DOCTYPE html>...
// ```
// ```css
// body { ... }
// ```
// ```javascript
// let counter = 0;
// ```

// Result: Single "Web Page" artifact with 3 files
{
  type: 'html',
  title: 'Web Page',
  files: {
    'index.html': '...',
    'styles.css': '...',
    'script.js': '...'
  }
}
```

**UI Components**:
- `artifact-card.tsx` - Inline artifact preview card
- Shows file count, code preview, and "Open IDE" button
- Displays artifact icon based on type (🌐 HTML, ⚛️ React, etc.)

**User Experience**:
- User asks: "Create a counter app with HTML/CSS/JS"
- AI responds with code blocks
- Artifact automatically created
- Toast: "Artifact detected: Web Page"
- Card appears below message with preview and "Open IDE" button
- Click "Open IDE" to open full Sandpack viewer

#### Integration Points

**Playground Page** (`app/playground/page.tsx`):
- `handleCreateArtifact()` - Creates artifact and opens viewer
- `handleDeleteArtifact()` - Removes artifact from session
- `artifacts` state - Current session's artifacts
- `activeArtifactId` - Currently viewing artifact

**localStorage Keys**:
- `playground-chat-sessions` - Includes artifacts array per session

#### Example: Whisker World Template
```typescript
{
  id: 'whisker-world-3d',
  type: 'react-game-3d',
  title: 'Whisker World - 3D Cat Adventure',
  files: {
    '/App.js': '/* Complete THREE.js game */',
  },
  dependencies: {
    'three': '^0.150.0'
  }
}
```

#### Technical Notes
- **Sandpack Version**: Latest from `@codesandbox/sandpack-react`
- **React Version**: Compatible with React 19
- **Bundle Size**: Sandpack adds ~500KB to bundle
- **Performance**: First load may take 3-5s for NPM dependencies
- **Caching**: Sandpack caches dependencies in browser

#### Future Enhancements
- Server-side artifact storage (Prisma integration ready)
- Python/Node.js code execution (via Docker)
- Artifact sharing via public URLs
- Collaborative editing
- Version history
- More templates (Vue, Angular, Svelte)

## Environment Variables

Required variables in `.env.local`:
```bash
DATABASE_URL="file:./dev.db"           # SQLite database path
GROQ_API_KEY=gsk_xxx                    # Groq API key
NEXTAUTH_URL="http://localhost:13380"   # Auth callback URL (note port 13380)
NEXTAUTH_SECRET="xxx"                   # JWT signing secret
```

## Important Implementation Notes

### Image Upload (Vision Models)
When using vision models, users can upload images:
1. **File Upload UI** (`app/page.tsx`):
   - Paperclip button triggers file input
   - Preview area shows uploaded images with remove option
   - Max 5 images per message, 4MB per image
   - Validation: only image files accepted

2. **API Validation** (`app/api/agentic/route.ts`):
   - Uses session's stored model (NOT request body model)
   - Validates that vision models are used when images are attached
   - Returns 400 error if non-vision model used with images
   - Multi-modal message format: `[{type: 'text', text: '...'}, {type: 'image_url', image_url: {url: 'data:...'}}]`

3. **Model Selection** (`components/agentic/new-session-button.tsx`):
   - Vision models grouped separately in UI
   - Eye icon indicates vision capability
   - Pricing displayed per model
   - Session stores selected model for all messages

**CRITICAL**: Always use `agenticSession.model` for validation, not request body defaults!

### Vision Message Formatting
Vision model responses use a custom `VisionMessage` component (`components/agentic/vision-message.tsx`) for improved readability:

1. **Content Parsing**:
   - Strips markdown syntax (###, **) from AI responses
   - Detects section headers (ending with : or known patterns)
   - Categorizes sections: paragraph, list, or colors
   - Structures content into sections with titles and content arrays

2. **Section Rendering**:
   - **Headers**: Bold h3 headings for section titles
   - **Lists**: Bullet points with proper spacing
   - **Color Sections**: Special rendering with color swatches
   - **Paragraphs**: Clean text without markdown artifacts

3. **Color Swatches**:
   - Maps common color names to hex codes
   - Renders colored boxes next to color names
   - Displays both swatch and capitalized color name
   - Supports: black, white, red, blue, green, yellow, purple, orange, pink, brown, gray, navy, teal, gold, silver

4. **Conditional Usage** (`app/page.tsx`):
   - Automatically used for vision model sessions
   - Detected via `isVisionModel()` from `lib/groq-utils.ts`
   - Falls back to ReactMarkdown for non-vision models
   - Applied to both stored messages and streaming content

5. **Client-Safe Utilities** (`lib/groq-utils.ts`):
   - Extracts pricing, model detection, and cost calculations
   - Prevents Groq SDK from loading in browser (fixes client-side errors)
   - Re-exported from `lib/groq.ts` for backward compatibility

**Benefits**: Structured sections, better typography, visual color swatches, improved hierarchy

### Playground Chat Interface
The playground (`/playground`) has been transformed into an OpenRouter-style chat interface for testing Groq models:

1. **UI Design**:
   - **Collapsible Sidebar** (54px collapsed, 264px expanded)
     - Toggle button with smooth animation
     - Chat history grouped by date (Today, Previous 30 Days)
     - Search functionality for chats
     - Active chat highlighting
     - New chat button
   - **Centered Chat Container**
     - OpenRouter-style design (rounded, border, shadow)
     - Quick action buttons: Image, Interactive App, Landing Page, 2D Game, 3D Game
     - Auto-resizing textarea with Enter to send
     - Streaming message display with markdown rendering
     - Cost tracking per message
   - **Tool Controls**
     - Settings button (for temperature, maxTokens, topP)
     - Attachment/file upload button
     - Drawing/artifacts button (placeholder)
     - Web search toggle switch
     - Submit button with disabled state management
   - **Top Bar**
     - "Add Model" button with keyboard shortcut display (⌘K)

2. **Chat Session Management**:
   - Create, save, load, and delete chats
   - localStorage persistence (chat history persists across sessions)
   - Auto-selects first available model for new chats
   - Auto-updates chat title from first message

3. **Technical Implementation** (`app/playground/page.tsx`):
   - Client-side chat sessions (not saved to database)
   - SSE-based streaming via `/api/playground`
   - Model selection on chat creation
   - Message history with cost tracking
   - Responsive design for all screen sizes

4. **API Endpoint** (`app/api/playground/route.ts`):
   - Streaming endpoint similar to `/api/agentic`
   - Supports custom parameters (temperature, maxTokens, topP)
   - Returns cost data with final message
   - No session/message persistence (ephemeral testing)

**Use Cases**: Testing models, comparing responses, experimenting with parameters without creating permanent sessions

### Port Configuration
- Application runs on **port 13380** (not 3000)
- This is configured in `app.bat` and `.env.local` (NEXTAUTH_URL)
- When changing ports, update both files

### Database Migrations
When modifying `prisma/schema.prisma`:
1. **Stop the dev server first** (app.bat or ctrl+c) - Prisma client cannot be regenerated while the server is running
2. Run `npx prisma migrate dev --name <descriptive_name>` to create and apply migration
3. Run `npx prisma generate` to regenerate the Prisma client with new schema
4. Restart the dev server with `app.bat`

**CRITICAL**: If you add/modify schema without regenerating the client, you'll experience:
- Extremely slow API responses (10+ seconds per request)
- Database queries falling back to outdated client
- TypeScript errors for new models/fields

### Rate Limiting
Implemented in `lib/rate-limit.ts` with Redis-like sliding window:
- Different limits for different endpoints (aiStream, auth, api)
- Identified by user ID or IP address
- Returns 429 with Retry-After header when exceeded

### Cost Calculation
Tool costs are calculated from the `executed_tools` array in Groq's response:
- Each tool has a cost per execution (defined in `groq-tool-costs.ts`)
- Costs are summed and added to message cost
- Total session cost is updated after each message

### Styling
Uses Tailwind CSS with custom configuration:
- Dark mode support via `class` strategy
- Custom color variables defined in `globals.css`
- shadcn/ui components in `components/` directory
- Markdown rendering with `react-markdown` in messages

## Advanced Features

### Structured Artifact Protocol System

The application includes a comprehensive **structured artifact generation and modification system** that enables systematic code creation and iterative updates with full transparency.

#### Architecture Overview

**Core Components**:
```
lib/
├── artifact-protocol.ts           # TypeScript protocol spec
├── artifact-parser.ts             # XML/JSON response parser
├── artifact-system-prompts.ts     # AI instruction templates
└── workspace-protocol.ts          # Workspace command protocol

app/api/
├── artifacts/[id]/chat/route.ts   # Artifact chat endpoint
└── workspace/build/route.ts       # Workspace builder endpoint

components/playground/
├── artifact-chat.tsx              # IDE chat interface
├── artifact-changes-preview.tsx   # Diff preview modal
├── artifact-viewer.tsx            # Sandpack IDE viewer
└── workspace-ide.tsx              # Autonomous builder IDE

docs/
└── ARTIFACT_PROTOCOL.md           # Complete documentation
```

#### 1. Artifact Creation Protocol

**XML Format** (Primary):
```xml
<artifact>
  <metadata>
    <title>Counter App</title>
    <type>react</type>
    <description>Simple counter with buttons</description>
  </metadata>
  <dependencies>
    <package name="axios" version="^1.6.0" />
  </dependencies>
  <files>
    <file path="/App.tsx" language="tsx">
      <![CDATA[
      import React, { useState } from 'react';

      export default function App() {
        const [count, setCount] = useState(0);
        return <div>{count}</div>;
      }
      ]]>
    </file>
  </files>
</artifact>
```

**JSON Format** (Alternative):
```json
{
  "artifact": {
    "metadata": {
      "title": "Counter App",
      "type": "react"
    },
    "files": [
      {
        "path": "/App.tsx",
        "language": "tsx",
        "content": "..."
      }
    ]
  }
}
```

#### 2. Artifact Modification Protocol

**XML Edit Format**:
```xml
<artifact-edit>
  <summary>Add reset button</summary>
  <edits>
    <edit>
      <file path="/App.tsx" />
      <action>insert</action>
      <location type="after-line" line="10" />
      <description>Add reset button after increment</description>
      <content>
        <![CDATA[
        <button onClick={() => setCount(0)}>Reset</button>
        ]]>
      </content>
    </edit>
  </edits>
</artifact-edit>
```

**Edit Actions**:
- `replace` - Replace entire file
- `insert` - Add code at location
- `modify` - Change specific lines
- `delete` - Remove code section

**Location Types**:
- `line` - Exact line number
- `after-line` - Insert after line
- `before-line` - Insert before line
- `range` - Replace lines startLine to endLine
- `pattern` - Match code pattern (future)

#### 3. IDE Chat Interface

**Features**:
- **Artifact-Specific Chat**: Each artifact has its own conversation
- **Code Context Injection**: AI sees all current files automatically
- **Streaming Responses**: Real-time SSE-based chat
- **Change Preview**: Diff modal before applying changes
- **Apply/Reject**: User control over all modifications
- **Chat History**: Persisted to localStorage per artifact

**Usage Flow**:
1. Open artifact in IDE viewer
2. Click chat icon (MessageSquare) in toolbar
3. Ask AI to modify code: "Add a reset button"
4. AI responds with `<artifact-edit>` commands
5. Preview modal shows line-by-line diffs
6. User clicks "Apply" or "Reject"
7. IDE updates instantly on apply

**API Endpoint** (`/api/artifacts/[id]/chat`):
- **Input**: `{ message, files, history }`
- **Output**: SSE stream with `{ content, done, fileChanges }`
- **Processing**: Injects `ARTIFACT_CONTEXT_PROMPT` with current files
- **Parsing**: Extracts `<artifact-edit>` tags and applies to files

**Components**:
- `artifact-chat.tsx` - Chat UI with message history
- `artifact-changes-preview.tsx` - Diff viewer modal
- `artifact-viewer.tsx` - IDE with integrated chat

#### 4. Autonomous Workspace Builder

**Overview**: Transform the "Interactive App" button into a sophisticated IDE where users watch AI agents autonomously build applications using structured commands.

**Command Protocol**:
```
[THOUGHT] - AI explains reasoning
[CREATE] file:/path - Create new file
[EDIT] file:/path action:replace - Modify file
[DELETE] file:/path - Remove file
[INSTALL] package:name@version - Add dependency
[COMPLETE] - Mark completion
```

**Example Workflow**:
```
[THOUGHT] I'll create a todo list app with React.

[CREATE] file:/App.tsx
```tsx
import React, { useState } from 'react';
// Complete code here...
```

[CREATE] file:/App.css
```css
.app { /* Styling */ }
```

[COMPLETE] Successfully built todo list app with full functionality.
```

**System Prompt** (`lib/workspace-system-prompt.ts`):
- 600+ lines of detailed AI instructions
- Command format rules and examples
- Architecture guidelines (React, TypeScript)
- Common patterns (forms, API calls, styling)
- Complete working examples
- Formatting rules with ✅/❌ examples

**Workspace IDE Features**:
- **Full-Screen Environment**: Dedicated workspace mode
- **Operation Log**: Real-time sidebar showing AI actions
  - 🧠 Thought process
  - 📄 File creations
  - ✏️ File modifications
  - 📦 Package installs
  - ✅ Completion status
- **Live Code Editor**: Sandpack integration with auto-updates
- **Preview Pane**: Running application
- **Pause/Resume**: User control over build process
- **Statistics**: File count, operation count

**Integration**:
- Click "Interactive App" quick action
- Workspace IDE opens full-screen
- AI starts building automatically
- User watches real-time progress
- Pause/resume at any time

**API Endpoint** (`/api/workspace/build`):
- **Input**: `{ request, model }`
- **Output**: SSE stream with AI response
- **Processing**: Injects `WORKSPACE_BUILDER_SYSTEM_PROMPT`
- **Parsing**: Client-side command extraction

**Command Parser** (`lib/workspace-protocol.ts`):
- Regex-based extraction of commands
- Validates command structure
- Applies operations to workspace state
- Tracks complete file history

#### System Prompt Design

**Two Specialized Prompts**:

1. **`ARTIFACT_GENERATION_SYSTEM_PROMPT`** (`lib/artifact-system-prompts.ts`):
   - Structured artifact creation instructions
   - XML/JSON format specification
   - CDATA usage for code content
   - Modification protocol with edit actions
   - Used in playground chat

2. **`WORKSPACE_BUILDER_SYSTEM_PROMPT`** (`lib/workspace-system-prompt.ts`):
   - Autonomous building instructions
   - Command-based interaction protocol
   - Complete code requirements (no placeholders)
   - Architecture best practices
   - Used in workspace IDE

**Key Principles**:
- **Structured Output**: AI must follow exact format
- **Complete Code**: No placeholders or TODOs
- **Transparency**: AI explains every decision
- **User Control**: Preview before applying changes
- **Context Awareness**: AI sees full codebase state

#### Documentation

**Complete Protocol Spec**: `docs/ARTIFACT_PROTOCOL.md`
- Protocol overview and architecture
- XML/JSON format specifications
- Testing workflow (6-step process)
- API endpoint documentation
- Code examples
- Troubleshooting guide
- Best practices

**File Structure**:
```
docs/
└── ARTIFACT_PROTOCOL.md   # 535 lines of documentation

lib/
├── artifact-protocol.ts          # Types, validation (450 lines)
├── artifact-parser.ts             # XML/JSON parsing (350 lines)
├── artifact-system-prompts.ts     # AI instructions
├── workspace-protocol.ts          # Command protocol (250 lines)
└── workspace-system-prompt.ts     # Builder instructions (620 lines)
```

#### Benefits

**For Users**:
- ✅ Watch AI code in real-time
- ✅ Full transparency (see every operation)
- ✅ Complete control (preview and approve changes)
- ✅ Production-ready output
- ✅ Educational value (learn from AI's process)

**For AI**:
- ✅ Clear, structured communication
- ✅ Full context of workspace state
- ✅ Detailed instructions and examples
- ✅ No ambiguity in commands
- ✅ Error recovery guidance

#### Common Use Cases

1. **Iterative Development**:
   - Create artifact: "Build a counter app"
   - Modify: "Add a reset button"
   - Modify: "Add max value of 10"
   - Modify: "Style it with gradients"

2. **Autonomous Building**:
   - Click "Interactive App"
   - AI builds complete application
   - User watches progress
   - Pause if needed

3. **Code Exploration**:
   - Ask AI to explain changes
   - Preview diffs before applying
   - Learn React patterns from AI's code

#### Future Enhancements

- **Version History**: Track all artifact changes over time
- **Undo/Redo**: Keyboard shortcuts for reversing changes
- **Syntax Highlighting**: Code diffs with language-aware highlighting
- **Pattern Matching**: Smarter location targeting in edits
- **Collaborative Editing**: Share artifacts with other users

## Common Gotchas

1. **Port conflicts**: If the app won't start, check if port 13380 is in use. Run `app.bat` which auto-handles this.

2. **Database sync issues**: After pulling schema changes, stop the dev server, then run `npx prisma generate` and `npx prisma migrate dev`.

2a. **Slow API responses (10+ seconds)**: This indicates Prisma client is out of sync with schema. Stop dev server, run `npx prisma generate`, restart server.

3. **Authentication loops**: Ensure `NEXTAUTH_URL` matches your actual URL including port 13380.

4. **Cost tracking missing**: Verify Groq API key is valid and model is a recognized Groq model in `GROQ_PRICING`.

5. **Streaming not working**: Check that the API route has `export const dynamic = 'force-dynamic'` and `export const runtime = 'nodejs'`.

6. **Next.js 15 params errors**: All dynamic route handlers must await params before accessing properties (see "Dynamic Routes" section above).

7. **Prisma client locked errors**: If you get "EPERM: operation not permitted" when running `npx prisma generate`, the dev server is still running and has locked the query engine. Stop the server first.