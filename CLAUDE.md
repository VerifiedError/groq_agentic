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

**One-Click Deployment:**
```bash
vercel-update.bat  # Commit, push, and deploy to Vercel
```

**What it does:**
1. Checks git status for uncommitted changes
2. Prompts for commit message (if changes exist)
3. Commits all changes with provided message
4. Pushes to GitHub `master` branch
5. Triggers automatic Vercel deployment
6. Opens Vercel dashboard for monitoring

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

**Agentic** - AI chat application with Next.js 15, Groq Compound AI, session management, cost tracking, and Sandpack IDE for code artifacts.

### Tech Stack
- **Framework**: Next.js 15.5.5 (App Router, Turbopack)
- **UI**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (Vercel/Production), SQLite (Docker/Local)
- **Auth**: NextAuth.js v4 (credentials)
- **AI**: Groq SDK (Compound models, Vision models)
- **IDE**: Sandpack (in-browser code execution)

### Database Schema

**4 Main Models:**
1. **User** - Accounts (username/email, apiKey)
2. **AgenticSession** - Chat sessions (model, cost tracking, token counts)
3. **AgenticMessage** - Messages (role, content, toolCalls, attachments, reasoning)
4. **GroqModel** - Available models (pricing, vision flag, context window)

**Additional Models:**
- **Artifact** - Code artifacts (React/HTML/JS, multi-file, Sandpack)
- **ModelPreset** - Saved model configurations

### Application Structure

```
app/
├── api/
│   ├── agentic/route.ts              # Streaming chat (SSE)
│   ├── playground/route.ts           # Playground chat (SSE)
│   ├── models/route.ts               # Fetch models from DB
│   ├── models/refresh/route.ts       # Sync models from Groq API
│   ├── artifacts/[id]/chat/route.ts  # Artifact chat (structured edits)
│   └── auth/[...nextauth]/route.ts   # NextAuth handler
├── page.tsx                          # Main chat interface
├── playground/page.tsx               # Playground (OpenRouter-style)
└── login/page.tsx                    # Login (username/password)

components/agentic/
├── session-sidebar.tsx               # Session list
├── session-header.tsx                # Title and stats
├── new-session-button.tsx            # Model selection
└── vision-message.tsx                # Formatted vision responses

components/playground/
├── artifact-viewer.tsx               # Sandpack IDE modal
├── artifact-chat.tsx                 # IDE chat interface
├── artifact-changes-preview.tsx      # Diff preview
└── workspace-ide.tsx                 # Autonomous builder

lib/
├── auth.ts                           # NextAuth config (bcrypt)
├── groq.ts                           # Groq SDK + pricing
├── artifact-protocol.ts              # Artifact creation/edit types
├── artifact-parser.ts                # XML/JSON parser
└── workspace-protocol.ts             # Command parser
```

---

## 🔑 Key Features

### 1. Streaming AI Responses (SSE)
- User message saved immediately
- Groq API streams via `groq.chat.completions.create({ stream: true })`
- Chunks sent as `data: {content, done, usage}`
- Assistant message saved with cost tracking on completion

### 2. Cost Tracking
- Per-message and per-session tracking
- Token counts: `prompt_tokens`, `completion_tokens`, `cached_tokens`
- Pricing from `GROQ_PRICING` (lib/groq.ts) or database
- Tool costs calculated from `executed_tools` array

### 3. Authentication (NextAuth.js)
- Username/password login (bcrypt hashing)
- Hardcoded credentials for single-user deployment
- JWT sessions, protected routes
- Auto-redirects to `/login` if unauthenticated

### 4. Model Management
- **GET /api/models** - Fetch active models from DB
- **POST /api/models/refresh** - Sync from Groq API
- Vision models auto-detected (llava, vision, llama-4, llama-3.2-11b/90b)
- Fallback to hardcoded `GROQ_PRICING` if DB empty

### 5. Vision Models
- Image uploads (max 5 images, 4MB each)
- Multi-modal messages: `[{type: 'text'}, {type: 'image_url'}]`
- Custom `VisionMessage` component (color swatches, structured sections)
- Validation: vision model required when uploading images

### 6. Code Artifacts (Sandpack IDE)
- **Auto-detection** from AI code blocks
- **Templates**: React, 3D Game (Whisker World), 2D Platformer, Dashboard, Landing Page
- **Features**: Multi-file, NPM dependencies, live preview, console
- **Artifact Chat**: AI modifies code with XML edit commands (`<artifact-edit>`)
- **Diff Preview**: Line-by-line changes before applying

### 7. Autonomous Workspace Builder
- Click "Interactive App" → AI builds full application
- **Command Protocol**: `[THOUGHT]`, `[CREATE]`, `[EDIT]`, `[INSTALL]`, `[COMPLETE]`
- **Operation Log**: Real-time sidebar showing AI actions
- **System Prompt**: 600+ lines of structured instructions

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

### Artifact Protocol

**Creation (XML)**:
```xml
<artifact>
  <metadata>
    <title>Counter App</title>
    <type>react</type>
  </metadata>
  <files>
    <file path="/App.tsx" language="tsx">
      <![CDATA[
      import React, { useState } from 'react';
      export default function App() { /*...*/ }
      ]]>
    </file>
  </files>
</artifact>
```

**Modification (XML)**:
```xml
<artifact-edit>
  <summary>Add reset button</summary>
  <edits>
    <edit>
      <file path="/App.tsx" />
      <action>insert</action>
      <location type="after-line" line="10" />
      <content><![CDATA[<button onClick={() => setCount(0)}>Reset</button>]]></content>
    </edit>
  </edits>
</artifact-edit>
```

**Edit Actions**: `replace`, `insert`, `modify`, `delete`
**Location Types**: `line`, `after-line`, `before-line`, `range`

---

## ⚠️ Common Gotchas

1. **Port conflicts**: Run `app.bat` (auto-handles port 13380 cleanup)
2. **Slow API responses**: Prisma client out of sync → Stop server → `npx prisma generate` → Restart
3. **Database sync issues**: After pulling schema changes → `npx prisma generate` → `npx prisma migrate dev`
4. **Authentication loops**: Ensure `NEXTAUTH_URL` matches actual URL (include port 13380)
5. **Next.js 15 params errors**: Must await params in dynamic routes
6. **Prisma locked errors**: Stop dev server before running `npx prisma generate`
7. **Vercel build failures**: Check for missing `export const dynamic = 'force-dynamic'`
8. **Node force-kill**: NEVER run `taskkill /F /IM node.exe` (kills CLI)

---

## 📖 Additional Documentation

- **Artifact Protocol**: `docs/ARTIFACT_PROTOCOL.md` (535 lines, complete spec)
- **System Prompts**: `lib/artifact-system-prompts.ts`, `lib/workspace-system-prompt.ts`

---

**Remember**: Professional code, no AI attribution, track everything in GitHub!
