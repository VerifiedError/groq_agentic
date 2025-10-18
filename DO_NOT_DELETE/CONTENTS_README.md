# DO_NOT_DELETE Folder Contents

This folder contains files and directories that were moved from the project root during cleanup on October 17, 2025.

## Why These Were Moved

To keep the root directory clean and focused on development files only, the following non-essential files were archived here for review.

## Contents

### 1. Test & Debug Files
- **`test-mcp-tools.mjs`** - MCP server testing script
  - Used for testing Model Context Protocol integration
  - Can be restored if MCP debugging is needed

### 2. MCP Server Files ⚠️ RESTORED TO ROOT
- ~~**`mcp_servers/`**~~ - **RESTORED** to root directory (required by Docker)
- ~~**`.mcp.json`**~~ - **RESTORED** to root directory (required by Docker)
- These files are needed for MCP (Model Context Protocol) functionality in Docker
- They were initially moved but then restored because they're referenced in the Dockerfile

### 3. Playwright Screenshots & Testing
- **`.playwright-mcp/`** - Playwright MCP integration screenshots (~3MB)
  - Contains 14 PNG files:
    - `enhanced-reasoning-display-test.png`
    - `local-playground-*.png`
    - `model-pricing-*.png`
    - `openrouter-*.png`
    - `playground-*.png`
  - These were test/debug screenshots during development
  - Can be deleted if not needed for reference

### 4. Empty/Unused Directories
- **`artifact_workspaces/`** - Empty directory
  - Was created for artifact workspace feature
  - Currently empty, may be needed in future

### 5. Claude Code Settings
- **`.claude/`** - Claude Code local settings
  - Contains `settings.local.json`
  - Local IDE configuration (not needed in repository)
  - Can be restored if needed for IDE-specific settings

### 6. Environment File Backups
- **`.env.backup`** - Backup of `.env` file
- **`.env.local.backup`** - Backup of `.env.local` file
- ⚠️ **Contains sensitive data** - do not commit to git
- Keep these safe for reference, but active files remain in root

### 7. Documentation
- **`README.md`** - Original project README
  - Moved because `CLAUDE.md` is now the primary documentation
  - Can be restored if GitHub-style README is needed

### 8. Corrupted/Temporary Files
- **`DÛ+!w?çóe-øm`** - Strange file with corrupted name (0 bytes)
  - Appears to be a temporary or corrupted file
  - Safe to delete

## What Remains in Root

The root directory now contains only:

### Essential Development Files
- `CLAUDE.md` ✅ (primary documentation)
- `docker-update.bat` ✅ (deployment script)
- `package.json`, `package-lock.json` (dependencies)
- `tsconfig.json`, `next.config.ts` (TypeScript/Next.js config)
- `tailwind.config.ts`, `postcss.config.mjs` (styling)
- `eslint.config.mjs` (linting)
- `next-env.d.ts` (TypeScript definitions)
- `.env.local.template` (environment template)

### Docker Files
- `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- `docker-start.bat`, `docker-start.sh`

### Source Code Directories
- `app/`, `components/`, `lib/`, `stores/`, `prisma/`
- `public/`, `types/`, `docs/`

### Build/Dependencies (gitignored)
- `node_modules/`, `.next/`, `.git/`

## Restoration Instructions

To restore any file/folder:

```bash
# Restore a specific file
mv DO_NOT_DELETE/filename.ext ./

# Restore a directory
mv DO_NOT_DELETE/directory/ ./

# Example: Restore MCP server
mv DO_NOT_DELETE/mcp_servers/ ./
mv DO_NOT_DELETE/.mcp.json ./
```

## Safe to Delete?

### Definitely Keep
- `.env.backup`, `.env.local.backup` (sensitive backups)
- `README.md` (may want for GitHub)
- `.claude/` (IDE settings)

### Review Before Deleting
- `test-mcp-tools.mjs` (may need for testing)
- `mcp_servers/` (may need MCP functionality)
- `.mcp.json` (MCP configuration)

### Safe to Delete
- `.playwright-mcp/` (just screenshots, 3MB)
- `artifact_workspaces/` (empty directory)
- `DÛ+!w?çóe-øm` (corrupted file)

## Notes

- All moved files are preserved exactly as they were
- No data was lost - everything is backed up here
- The root directory is now clean and focused on development
- This folder can be deleted after reviewing contents, or kept for reference
