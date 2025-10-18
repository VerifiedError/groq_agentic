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

### Clearing Vercel Cache

When environment variables are updated or you need to force a fresh deployment without stale cache:

**Clear Cache:**
```bash
vercel cache purge
```

**Redeploy with Fresh Cache:**
```bash
# Get latest deployment URL
vercel ls --yes | head -1

# Redeploy that deployment
vercel redeploy <deployment-url>
```

**Complete Cache Clear & Redeploy (One Command):**
```bash
# Clear cache and redeploy latest
vercel cache purge && vercel redeploy $(vercel ls --yes | head -1 | head -1)
```

**Why Clear Cache:**
- Environment variables changed (NEXTAUTH_URL, API keys, etc.)
- Force fresh build without cached dependencies
- Clear CDN cache for static assets
- Resolve "stale code" issues after deployment

**What Gets Cleared:**
- ✅ CDN cache (static files, pages)
- ✅ Data cache (API responses, ISR)
- ✅ Build cache (forces complete rebuild)

**Example Use Cases:**
- After adding `NEXTAUTH_URL` environment variable
- After updating database connection strings
- When deployment uses old code despite new commit
- When authentication cookies aren't working

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

**Playground** - Open source AI playground with Next.js 15, Groq Compound AI, and built-in thinking/reasoning display.

### Tech Stack
- **Framework**: Next.js 15.5.5 (App Router, Turbopack)
- **UI**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (Vercel/Production), SQLite (Docker/Local)
- **Auth**: NextAuth.js v4 (credentials, bcrypt, self-registration)
- **AI**: Groq SDK (streaming responses with reasoning)
- **Architecture**: Single-page chat interface (simplified from multi-session)
- **Design**: Clean white background with black borders (high-contrast)

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
- **Self-registration** at `/register` (new users get 'user' role)

### Application Structure

```
app/
├── api/
│   ├── chat/route.ts                     # Main streaming chat (SSE)
│   ├── models/route.ts                   # Fetch models from DB
│   ├── models/refresh/route.ts           # Sync models from Groq API
│   ├── auth/
│   │   ├── [...nextauth]/route.ts        # NextAuth handler
│   │   └── register/route.ts             # User registration API *[NEW]*
│   └── admin/                            # Admin-only routes
│       ├── users/route.ts                # User management
│       ├── models/route.ts               # Model management
│       └── stats/route.ts                # System statistics
├── page.tsx                              # Root chat interface (Playground)
├── login/page.tsx                        # Login (white/black design) *[UPDATED]*
└── register/page.tsx                     # Registration page *[NEW]*

components/
├── agentic/
│   ├── reasoning-display.tsx             # Thinking/reasoning UI
│   └── reasoning-card.tsx                # Individual reasoning step
├── auth/
│   ├── login-form.tsx                    # Login form (black borders) *[UPDATED]*
│   ├── register-form.tsx                 # Registration form *[NEW]*
│   └── password-input.tsx                # Reusable password field *[UPDATED]*
├── admin/
│   ├── admin-dashboard.tsx               # Admin panel
│   ├── user-management-tab.tsx           # User CRUD
│   └── model-management-tab.tsx          # Model CRUD
└── playground/
    └── model-settings-modal.tsx          # Model settings

lib/
├── version.ts                            # APP_NAME, APP_VERSION, APP_TAGLINE *[UPDATED]*
├── auth.ts                               # NextAuth config (bcrypt, rate limiting)
├── auth/
│   ├── password.ts                       # Password hashing utilities
│   └── login-rate-limit.ts               # Rate limiting system
├── admin-utils.ts                        # Client-safe admin helpers
├── admin-middleware.ts                   # Server-side admin checks
├── groq.ts                               # Groq SDK + pricing
└── reasoning-parser.ts                   # Extract <think> tags
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

### 2. Authentication & Registration (Secure, Production-Ready)
- **Self-registration** at `/register` - Users can create accounts
  - Username, email, password, confirm password validation
  - Zod schema validation (username: 3-20 chars, alphanumeric, email format)
  - Bcrypt password hashing (12 rounds)
  - Uniqueness checks (username/email)
  - New users automatically assigned 'user' role
  - Clean white/black UI design
- **Username/password login** at `/login`
  - Bcrypt password verification
  - Rate limiting: 5 failed attempts → 30-minute block
  - Auto-redirect to registration page
- **Role-based access**: admin/user roles
- **Account management**: isActive flag, lastLoginAt tracking
- **JWT sessions**: httpOnly cookies, 7-day expiry
- **Protected routes**: Middleware redirects to /login if unauthenticated
- **Suspense-wrapped pages**: Next.js 15 compliant

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

### 5. UI Design System (Clean White/Black Theme)
- **Background**: White (#FFFFFF) or light gray (#F9FAFB)
- **Borders**: Black (#000000), 2px solid
- **Input Fields**:
  - White background with 2px black borders
  - Focus state: Gray-900 ring with subtle shadow
  - Border radius: 8px (rounded-lg)
- **Buttons**:
  - Primary: Black background, white text
  - Hover: Gray-800 (#1F2937)
  - Disabled: Gray-400
- **Typography**:
  - Headings: Gray-900 (#111827)
  - Body text: Gray-600 (#4B5563)
  - Muted text: Gray-500 (#6B7280)
  - Placeholders: Gray-500
- **Design Principles**:
  - High contrast for accessibility
  - Clean, professional appearance
  - No gradients on auth pages
  - Consistent 2px borders
  - Sharp, modern aesthetic

### 6. Responsive Design
- **Mobile-first**: 16px font, 44px touch targets, safe areas
- **Desktop-optimized**: Larger header, spacious layout, hover states
- **Global CSS utilities**: Safe area insets, touch scrolling, no zoom on focus

### 7. Admin Dashboard (Admin-Only)
- **Access Control**: Only visible to users with `role === 'admin'`
- **Shield Icon Button**: Purple shield in header (mobile & desktop)
- **Three Tabs**:
  - **System Stats**: User counts, message counts, total cost, token usage, top models
  - **User Management**: View/edit/delete users, toggle roles (admin/user), toggle active status
  - **Model Management**: View all models, toggle active/inactive, sync from Groq API
- **API Routes** (all require admin auth):
  - `GET /api/admin/users` - List all users with filters
  - `POST /api/admin/users` - Create new user
  - `PATCH /api/admin/users/[id]` - Update user role/status
  - `DELETE /api/admin/users/[id]` - Delete user
  - `GET /api/admin/stats` - System statistics
  - `GET /api/admin/models` - All models (including inactive)
  - `PATCH /api/admin/models/[id]` - Update model status/pricing
- **Security**: Returns 403 Forbidden if non-admin tries to access

---

## 🗂️ Archived Features (REMOVED from Git - Issue #69)

These features were removed in the major simplification (commit `eed2a80`) and cleaned up from the repository (commit for Issue #69):

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

**Note**: All archived code (26 files) was removed from git tracking in Issue #69 to clean up the repository. Files still exist locally in `DO_NOT_DELETE/` directory (gitignored) for reference.

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

### Database Migrations Workflow (IMPORTANT - NO DATA LOSS!)

**Adding New Fields (Safe - Preserves Data)**:

When adding new fields to existing models, ALWAYS provide default values to prevent data loss:

```prisma
// ✅ CORRECT: Adding fields with defaults
model User {
  // ... existing fields ...
  subscriptionTier String  @default("free")  // New field with default
  apiCallCount     Int     @default(0)       // New nullable field
  preferences      String? @default("{}")    // Optional field with default
}
```

```prisma
// ❌ WRONG: Adding required fields without defaults
model User {
  // ... existing fields ...
  subscriptionTier String  // ERROR: Existing rows will fail!
}
```

**Local Development Workflow**:
1. Stop dev server (`Ctrl+C` or close terminal)
2. Edit `prisma/schema.prisma` (add fields with `@default()`)
3. Run `npx prisma migrate dev --name add_user_subscription`
4. Run `npx prisma generate` (regenerates Prisma client)
5. Restart server with `app.bat`

**What Happens**:
- Creates `prisma/migrations/TIMESTAMP_add_user_subscription/migration.sql`
- SQL: `ALTER TABLE "User" ADD COLUMN "subscriptionTier" TEXT NOT NULL DEFAULT 'free'`
- **Existing users automatically get `subscriptionTier = 'free'`** (NO DATA LOSS!)
- Prisma client regenerated with new types

**Vercel Deployment (Automatic)**:
- Vercel runs `prisma migrate deploy` during build
- Only applies NEW migrations (skips already-applied)
- Production data is PRESERVED
- No manual intervention needed

**Migration Commands**:
```bash
# Local development
npx prisma migrate dev --name descriptive_name   # Create & apply migration
npx prisma generate                               # Regenerate client

# Check status
npx prisma migrate status                         # List pending migrations

# Production (Vercel does this automatically)
npx prisma migrate deploy                         # Apply pending migrations

# ⚠️ DANGER: Only use locally, NEVER in production
npx prisma migrate reset                          # Deletes all data and re-runs migrations
```

**Best Practices**:

✅ **DO**:
- Always add `@default()` for new non-nullable fields
- Use descriptive migration names: `add_user_preferences`, `add_model_pricing`
- Test migrations locally before pushing to GitHub
- Commit migration files to git (Vercel needs them)
- Use `@default(now())` for DateTime fields
- Use `@default(0)` for numeric fields
- Use `@default("")` or `@default("{}")` for strings

❌ **DON'T**:
- Never run `prisma migrate reset` in production (DELETES ALL DATA!)
- Never manually delete migration files after deploying
- Never change existing migrations (create new ones instead)
- Never deploy without testing migrations locally
- Never add required fields without defaults (breaks existing rows)

**Example: Adding Multiple Fields**:
```prisma
model AgenticSession {
  // ... existing fields ...

  // New fields (safe to add)
  starred       Boolean  @default(false)
  folder        String   @default("Uncategorized")
  customTitle   String?  // Optional, no default needed
  lastEditedAt  DateTime @default(now())
}
```

```bash
# Create migration
npx prisma migrate dev --name add_session_organization_fields

# Migration creates SQL like:
# ALTER TABLE "AgenticSession" ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false;
# ALTER TABLE "AgenticSession" ADD COLUMN "folder" TEXT NOT NULL DEFAULT 'Uncategorized';
# ALTER TABLE "AgenticSession" ADD COLUMN "customTitle" TEXT;
# ALTER TABLE "AgenticSession" ADD COLUMN "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

**Symptoms of Outdated Client**:
- Slow API responses (10+ seconds)
- TypeScript errors for new fields
- Database queries fail
- "Unknown field" errors

**Fix**: Stop server, run `npx prisma generate`, restart server

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
   - Check for bcrypt/native module imports in client components
9. **Node force-kill**: NEVER run `taskkill /F /IM node.exe` (kills CLI)
10. **Windows exFAT local builds**: See section below for workarounds

---

## 🪟 Windows Development: exFAT Filesystem Issue

**Problem**: Local builds fail with `EISDIR: illegal operation on a directory, readlink` on Windows when project is on an exFAT-formatted drive (common on D:, E:, external drives).

**Root Cause**:
- exFAT filesystems don't support symbolic links
- Next.js/Webpack requires symlinks for module resolution
- Catch-all routes like `[...nextauth]` trigger `readlink` operations

**Symptoms**:
```
Error: EISDIR: illegal operation on a directory, readlink 'd:\agentic\app\api\auth\[...nextauth]\route.ts'
```

**Solutions (Choose One)**:

### Option 1: Vercel-First Deployment (RECOMMENDED)
Skip local builds entirely and use Vercel's Linux-based build system:

```bash
# Deploy directly (Vercel builds on Linux, no exFAT issue)
vercel --prod --yes

# Or use the deployment script
powershell -ExecutionPolicy Bypass -File vercel-update.ps1
```

**Advantages**:
- No local configuration changes needed
- Faster deployment (no local build time)
- Same environment as production

**Disadvantages**:
- Can't test production builds locally
- Must commit changes to test

### Option 2: Windows Subsystem for Linux (WSL2)
Develop in WSL2 where filesystems support symlinks:

```bash
# In WSL2 terminal
cd /mnt/d/agentic  # Access Windows D: drive
npm run build       # Works in WSL2
```

**Advantages**:
- Can test production builds locally
- True Linux environment
- Better performance for Node.js

**Disadvantages**:
- Requires WSL2 installation
- File permissions complexity

### Option 3: Move Project to NTFS Drive
If your C: drive is NTFS-formatted:

```powershell
# Check filesystem type
Get-Volume D | Select-Object FileSystemType
Get-Volume C | Select-Object FileSystemType

# If C: is NTFS, move project
robocopy d:\agentic c:\agentic /E /MOVE
```

**Advantages**:
- Full Windows compatibility
- Can run local builds

**Disadvantages**:
- Requires available space on C:
- May need to reconfigure paths

### Option 4: Reformat Drive to NTFS
**⚠️ WARNING: This erases ALL data on the drive!**

```powershell
# DANGER: Backup all data first!
# Format-Volume -DriveLetter D -FileSystem NTFS
```

**Recommended Approach**: Use **Option 1** (Vercel-First) for simplicity and speed.

---

## 📖 Recent Major Changes

### Registration System & Rebranding (Commit `d6245af`, Oct 2025)
**What Changed**:
- Added user registration system with `/register` page
- Rebranded from "Agentic" to "Playground - Open Source AI Playground"
- Complete GUI overhaul: White background with black borders (2px)
- Updated authentication UI with clean, professional design

**Backend**:
- `app/api/auth/register/route.ts` - Registration API endpoint
  - Zod validation (username, email, password, confirmPassword)
  - Username/email uniqueness checks
  - Bcrypt password hashing (12 rounds)
  - Auto-assigns 'user' role to new registrations

**Frontend**:
- `app/register/page.tsx` - Registration page with white/black design
- `components/auth/register-form.tsx` - Registration form component
  - Username: 3-20 chars, alphanumeric + underscore
  - Email: valid format validation
  - Password: 8+ chars minimum
  - Confirm password matching
  - Auto-redirect to login on success
- `components/auth/password-input.tsx` - Enhanced with `borderColor` prop
  - Supports 'black' or 'gray' borders for different themes

**UI/UX Overhaul**:
- `app/login/page.tsx` - White card with 2px black border
- `components/auth/login-form.tsx` - Black bordered inputs, black buttons
  - Added "Register" link at bottom
  - Removed gradient backgrounds
  - Focus states with gray-900 ring
- `app/page.tsx` - Updated headers to "Playground"
- `lib/version.ts` - Updated APP_NAME and added APP_TAGLINE

**Design System**:
- Background: White (#FFFFFF) / Light gray (#F9FAFB)
- Borders: Black (#000000), 2px solid
- Buttons: Black background, white text
- High-contrast, professional, accessible design

### Repository Cleanup (Issue #69, Oct 2025)
**What Changed**:
- Removed 26 archived files from git tracking (`DO_NOT_DELETE/`, `docs/`, `mcp_servers/`)
- Added professional README.md with comprehensive documentation
- Updated `.gitignore` to exclude development directories
- Documented Windows exFAT filesystem issue and workarounds
- Updated CLAUDE.md with recent fixes and deployment workflow

**Why**:
- Clean up GitHub repository for production
- Make project more accessible to new contributors
- Document known issues and solutions
- Improve project professionalism

### Build System Fixes (Commits `e526235`, `9faf55f`, Oct 2025)
**Issue #1: Windows exFAT Build Error (e526235)**:
- Problem: `EISDIR: illegal operation on a directory` on exFAT drives
- Root Cause: exFAT doesn't support symlinks required by Webpack
- Solution: Use Vercel-first deployment (Linux build system)
- Added webpack config (doesn't fix locally, but good practice)

**Issue #2: Bcrypt Client-Side Import Error (9faf55f)**:
- Problem: `Module not found: Can't resolve 'fs'` during Vercel build
- Root Cause: `isAdmin` helper imported bcrypt into client bundle
- Solution: Created `lib/admin-utils.ts` for client-safe helpers
- Separated server-only code (`admin-middleware.ts`) from client code

**Files Changed**:
- `lib/admin-utils.ts` - New file with client-safe `isAdmin` helper
- `lib/admin-middleware.ts` - Removed `isAdmin` (server-only now)
- `app/page.tsx` - Updated import to use `lib/admin-utils`
- `next.config.ts` - Added webpack symlinks fix (for future)

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

### Admin Dashboard (Issues #65-#68, Oct 2025)
**Features Added**:
- System statistics dashboard (user/message counts, costs, top models)
- User management (CRUD operations, role assignment, account status)
- Model management (view all models, toggle active/inactive, sync from Groq)
- Shield icon button in header (purple, visible only to admins)
- Protected API routes with `requireAdmin()` middleware
- Real-time data refresh and filtering

---

**Remember**: Professional code, no AI attribution, track everything in GitHub!
