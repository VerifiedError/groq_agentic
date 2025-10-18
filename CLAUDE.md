# CLAUDE.md

This file provides guidance when working with code in this repository.

## 📚 Groq API Documentation

- **[Models](https://console.groq.com/docs/models)** | **[Web Search](https://console.groq.com/docs/web-search)** | **[Browser Automation](https://console.groq.com/docs/browser-automation)**
- **[Code Execution](https://console.groq.com/docs/code-execution)** | **[Visit Website](https://console.groq.com/docs/visit-website)** | **[Wolfram Alpha](https://console.groq.com/docs/wolfram-alpha)**
- **[Compound Built-in Tools](https://console.groq.com/docs/compound/built-in-tools)** | **[MCP Protocol](https://console.groq.com/docs/mcp)** | **[Prompt Caching](https://console.groq.com/docs/prompt-caching)**

---

## 🚨 CRITICAL: GitHub & Deployment Workflow

### GitHub Change Tracking (MANDATORY)

**Every code change requires:**

1. **Create GitHub Issue First**
   ```bash
   gh issue create --title "Brief description" --body "## Objective\n[Details]\n\n## Files\n- file1.ts\n\n## Acceptance Criteria\n- Criterion 1"
   ```

2. **Present Changes for Approval**
   - Explain what will change and why
   - List all files to modify
   - Wait for explicit user approval

3. **Implement and Push**
   ```bash
   git add <files>
   git commit -m "Description (closes #issue-number)"
   git push origin master
   ```

### Vercel Deployment (Auto-Deploy)

**IMPORTANT: Every push to `master` automatically deploys to Vercel**

- **Production URL**: `https://agentic-iewrzpluo-verifiederrors-projects.vercel.app`
- **Auto-deploy**: Push to `master` → Vercel rebuilds → Live in ~2 minutes
- **Environment Variables**: Set in Vercel dashboard (not in code)
- **Database**: PostgreSQL (Neon) configured via `DATABASE_URL`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

**One-Click Deployment (Vercel CLI):**
```bash
# Windows: Double-click one of these
vercel-update.bat      # Simple wrapper (runs PowerShell script)
vercel-update.ps1      # Full-featured PowerShell script (RECOMMENDED)

# Or run from command line:
powershell -ExecutionPolicy Bypass -File vercel-update.ps1
```

**Prerequisites:**
```bash
npm install -g vercel  # Install Vercel CLI globally
vercel login           # Authenticate with Vercel (one-time)
```

**What it does:**
1. Checks git status for uncommitted changes
2. Prompts for commit message (if changes exist)
3. Commits all changes with provided message
4. Pushes to GitHub `master` branch
5. Checks for Vercel CLI installation
6. Authenticates with Vercel (if needed)
7. **Deploys directly via `vercel --prod --yes`**
8. Shows deployment progress in real-time
9. Displays final production URL

**Fallback:** If Vercel CLI is not installed, falls back to GitHub auto-deploy

**Files:**
- `vercel-update.ps1` - Main PowerShell script (full-featured, color output)
- `vercel-update.bat` - Simple wrapper that calls PowerShell script

**Deployment Checklist:**
- ✅ All API routes have `export const dynamic = 'force-dynamic'`
- ✅ Database migrations included in `prisma/migrations/`
- ✅ New dependencies in `package.json`
- ✅ No hardcoded localhost URLs
- ✅ Environment variables documented

### Docker Deployment (Local)

**Quick Update:**
```bash
docker-update.bat  # Pulls latest code, rebuilds, starts containers
```

**Manual:**
```bash
docker-start.bat  # Interactive: Build & start, Stop, View logs, Clean rebuild
```

**Every code change MUST be Docker-compatible:**
- All migrations in `prisma/migrations/`
- Dependencies in `package.json`
- No environment-specific code

---

## 📋 Project Overview

**Agentic** - Simplified AI chat application with Next.js 15, Groq Compound AI, and built-in thinking/reasoning display.

### Tech Stack
- **Framework**: Next.js 15.5.5 (App Router, Turbopack)
- **UI**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (Vercel/Production), SQLite (Docker/Local)
- **Auth**: NextAuth.js v4 (credentials, bcrypt)
- **AI**: Groq SDK (streaming responses with reasoning)
- **Architecture**: Single-page chat interface (simplified from multi-session)

### Database Schema

**4 Main Models:**
1. **User** - Accounts (username, passwordHash, role, isActive, lastLoginAt)
2. **AgenticSession** - Chat sessions (model, cost tracking, token counts) *[Legacy, archived]*
3. **AgenticMessage** - Messages (role, content, toolCalls, attachments, reasoning) *[Legacy, archived]*
4. **GroqModel** - Available models (pricing, vision flag, context window)

**Authentication:**
- Bcrypt password hashing (12 rounds)
- Rate limiting (5 attempts per 15 min, 30 min block)
- Role-based access (admin/user)
- Account status management (isActive flag)

### Application Structure

```
app/
├── api/
│   ├── chat/route.ts                 # Main streaming chat (SSE) *[CURRENT]*
│   ├── models/route.ts               # Fetch models from DB
│   ├── models/refresh/route.ts       # Sync models from Groq API
│   └── auth/[...nextauth]/route.ts   # NextAuth handler
├── page.tsx                          # Root chat interface *[CURRENT - Simplified]*
├── login/page.tsx                    # Login (username/password, Suspense-wrapped)
└── playground/                       # *[ARCHIVED - See DO_NOT_DELETE/]*

components/agentic/
├── reasoning-display.tsx             # Thinking/reasoning UI *[ACTIVE]*
└── reasoning-card.tsx                # Individual reasoning step *[ACTIVE]*

components/playground/
├── model-settings-modal.tsx          # Temperature, maxTokens, topP settings
└── *[Other components archived]*     # *[See DO_NOT_DELETE/]*

lib/
├── auth.ts                           # NextAuth config (bcrypt, rate limiting)
├── auth/password.ts                  # Password hashing utilities
├── auth/login-rate-limit.ts          # Rate limiting system
├── groq.ts                           # Groq SDK + pricing
└── reasoning-parser.ts               # Extract <think> tags from AI responses

DO_NOT_DELETE/                        # Archived legacy code
├── app/page.tsx                      # Old multi-session chat interface
├── components/agentic/               # Session management components (10 files)
│   ├── session-sidebar.tsx
│   ├── new-session-button.tsx
│   ├── vision-message.tsx
│   └── ...
└── stores/agentic-session-store.ts   # Zustand session store
```

### Responsive Design (Mobile & Desktop)

**Current Root Page** (`app/page.tsx`):
- **Mobile**: Simplified single-column layout
  - 16px font (prevents iOS zoom on input focus)
  - 44px minimum touch targets (WCAG Level AAA)
  - Safe area insets for iOS notch (`env(safe-area-inset-bottom)`)
  - Touch-friendly scrolling (`-webkit-overflow-scrolling: touch`)
  - Compact mobile header with settings button
- **Desktop**: Centered chat container
  - Larger header with "New Chat" button
  - Spacious layout with better typography
  - Hover states and transitions

**Global Mobile CSS** (`app/globals.css`):
- Safe area insets (`.safe-bottom`, `.safe-top`)
- No horizontal overflow prevention
- Better tap highlighting
- Disabled double-tap zoom on buttons/links
- Optimized prose sizing for mobile

**Archived Responsive Components** (`DO_NOT_DELETE/`):
- `mobile-sidebar.tsx` - Slide-out chat drawer *[Legacy]*
- `settings-bottom-sheet.tsx` - Drag-to-dismiss settings *[Legacy]*
- `quick-actions-mobile.tsx` - Horizontal scrollable actions *[Legacy]*
- `responsive-container.tsx` - Adaptive containers *[Legacy]*
- `lib/breakpoints.ts` - Breakpoint utilities *[Legacy]*

---

## 🔑 Key Features (Current Implementation)

### 1. Streaming AI Responses with Reasoning
- **Endpoint**: `/api/chat` (SSE streaming)
- User message displayed immediately
- Groq API streams via `groq.chat.completions.create({ stream: true })`
- **Think Tag Extraction**: AI reasoning extracted from `<think>` tags
- **ReasoningDisplay**: Collapsible UI showing AI's thought process
- Clean content shown (reasoning stripped from final message)

### 2. Authentication (Secure, Production-Ready)
- **Username/password login** with bcrypt hashing (12 rounds)
- **Rate limiting**: 5 failed attempts → 30-minute block
- **Role-based access**: admin/user roles
- **Account management**: isActive flag, lastLoginAt tracking
- **JWT sessions**: httpOnly cookies, 7-day expiry
- **Protected routes**: Middleware redirects to /login if unauthenticated
- **Suspense-wrapped login**: Next.js 15 compliant (useSearchParams)

### 3. Model Settings
- **Temperature**: 0-2 range (creativity control)
- **Max Tokens**: Output length limit
- **Top P**: Nucleus sampling
- **Model Selection**: Dropdown with all available Groq models
- Settings persist in state (not localStorage)

### 4. Model Management (Database-First)
- **GET /api/models** - Fetch active models from PostgreSQL
- **POST /api/models/refresh** - Sync from Groq API (authenticated)
- Vision models auto-detected (pattern matching)
- Fallback to hardcoded `GROQ_PRICING` if DB empty

### 5. Responsive Design
- **Mobile-first**: 16px font, 44px touch targets, safe areas
- **Desktop-optimized**: Larger header, spacious layout, hover states
- **Global CSS utilities**: Safe area insets, touch scrolling, no zoom on focus

---

## 🗂️ Archived Features (DO_NOT_DELETE/)

These features were removed in the major simplification (commit `eed2a80`):

### ❌ Session Management (Removed)
- Multiple chat sessions with history
- Session sidebar with date grouping
- Cost tracking per session
- Session search and filtering
- **Why removed**: Simplified to single-chat interface

### ❌ Vision Models & Image Upload (Removed)
- Image uploads (max 5 images, 4MB each)
- Multi-modal messages: `[{type: 'text'}, {type: 'image_url'}]`
- Custom `VisionMessage` component (color swatches)
- **Why removed**: Focused on text-based chat

### ❌ Code Artifacts & Sandpack IDE (Removed)
- Auto-detection from AI code blocks
- Templates (React, 3D Game, Dashboard, etc.)
- Artifact chat with XML edit commands
- Diff preview and autonomous workspace builder
- **Why removed**: Simplified to pure chat interface

### ❌ Playground Route (Removed)
- `/playground` - OpenRouter-style testing interface
- **Why removed**: Consolidated to single root route `/`

**Note**: All archived code is preserved in `DO_NOT_DELETE/` for reference and potential future restoration.

---

## ⚙️ Development Commands

### Starting the Application
```bash
app.bat              # Windows: Auto-kills port 13380, starts dev server
npm run dev -- -p 13380
```

**Port**: 13380 (not 3000)

### Database
```bash
npx prisma generate                    # Regenerate client after schema changes
npx prisma migrate dev --name <name>   # Create and apply migration
npx prisma studio                      # Database GUI
```

**CRITICAL**: Stop dev server before `prisma generate` (prevents EPERM errors)

### Build
```bash
npm run build        # Production build (Turbopack)
npm start            # Production server
npm run lint         # ESLint
```

---

## 🔧 Environment Variables

**Required in `.env.local`:**
```bash
DATABASE_URL="postgresql://..."         # PostgreSQL (Vercel) or "file:./dev.db" (local)
GROQ_API_KEY=gsk_xxx                     # Groq API key
NEXTAUTH_URL="http://localhost:13380"    # Auth callback URL (port 13380)
NEXTAUTH_SECRET="xxx"                    # JWT signing secret
```

**Vercel Production:**
- Set in Vercel dashboard (Settings → Environment Variables)
- `NEXTAUTH_URL` = production URL
- `DATABASE_URL` = Neon PostgreSQL connection string

---

## 🚦 Important Notes

### Next.js 15 Dynamic Routes
**CRITICAL**: Must await params:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // ✅ Must await!
  // use id...
}
```

### Database Migrations Workflow
1. Stop dev server (`Ctrl+C` or close terminal)
2. Edit `prisma/schema.prisma`
3. Run `npx prisma migrate dev --name <name>`
4. Run `npx prisma generate`
5. Restart server with `app.bat`

**Symptoms of outdated client:**
- Slow API responses (10+ seconds)
- TypeScript errors for new fields
- Database queries fail

### API Routes (Next.js 15)
All API routes must include:
```typescript
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
```

### Groq Models

**Compound Models** (Free, Built-in Tools):
- `groq/compound` - Production
- `groq/compound-mini` - Lightweight

**Vision Models** (Image Understanding):
- `llama-4-scout-17b` - Fast ($0.11/$0.34 per 1M tokens)
- `llama-4-maverick-17b` - Advanced ($0.20/$0.60)
- `llama-3.2-11b-vision` - Efficient ($0.18/$0.18)
- `llama-3.2-90b-vision` - High-performance ($0.90/$0.90)
- `llava-v1.5-7b` - Free

### Reasoning Display (Think Tags)

The current implementation extracts AI reasoning from `<think>` tags:

**Example AI Response**:
```
<think>
I should create a greeting function that accepts a name parameter.
First, I'll validate the input to handle edge cases.
Then return a personalized greeting.
</think>

Here's a greeting function:
```js
function greet(name) {
  if (!name) return 'Hello, stranger!';
  return `Hello, ${name}!`;
}
```
```

**UI Result**:
- **Reasoning**: Collapsible "AI Reasoning" card with thought process
- **Content**: Clean code example without `<think>` tags

**Component**: `ReasoningDisplay` (`components/agentic/reasoning-display.tsx`)
**Parser**: `extractThinkTags()` from `lib/reasoning-parser.ts`

---

## ⚠️ Common Gotchas

1. **Port conflicts**: Run `app.bat` (auto-handles port 13380 cleanup)
2. **Slow API responses**: Prisma client out of sync → Stop server → `npx prisma generate` → Restart
3. **Database sync issues**: After pulling schema changes → `npx prisma generate` → `npx prisma migrate dev`
4. **Authentication loops**: Ensure `NEXTAUTH_URL` matches actual URL (include port 13380)
5. **Next.js 15 params errors**: Must await params in dynamic routes
6. **Next.js 15 Suspense errors**: Wrap `useSearchParams()` in Suspense boundary
7. **Prisma locked errors**: Stop dev server before running `npx prisma generate`
8. **Vercel build failures**:
   - Check for missing `export const dynamic = 'force-dynamic'`
   - Ensure all imports exist (check for archived components)
   - Verify Suspense boundaries for client hooks
9. **Node force-kill**: NEVER run `taskkill /F /IM node.exe` (kills CLI)

---

## 📖 Recent Major Changes

### Simplification (Commit `eed2a80`, Oct 2025)
**What Changed**:
- Removed `/playground` route → Consolidated to single root `/`
- Archived session management system (10 components + store)
- Removed vision models, image uploads, cost tracking
- Removed Sandpack IDE, code artifacts, autonomous builder
- Simplified to single-chat interface with reasoning display
- **Lines removed**: ~2,000 lines of code
- **Files archived**: 14 files moved to `DO_NOT_DELETE/`

**Why**:
- Focus on core chat functionality
- Improve mobile responsiveness
- Reduce complexity for single-user deployment
- Preserve legacy code for potential future restoration

### Authentication System (Issues #63, #64, Oct 2025)
**Backend (Issue #63)**:
- Bcrypt password hashing (12 rounds)
- Rate limiting (5 attempts, 30-min block)
- Role-based access (admin/user)
- Account status management (isActive)
- Last login tracking (lastLoginAt)

**Frontend (Issue #64)**:
- Professional login UI (gradient background, centered card)
- React Hook Form + Zod validation
- Password visibility toggle
- Suspense-wrapped for Next.js 15
- Responsive design (mobile + desktop)
- Middleware-based route protection

---

**Remember**: Professional code, no AI attribution, track everything in GitHub!
