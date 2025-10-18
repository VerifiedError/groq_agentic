# Session Management Enhancements

## Objective
Add advanced session management features including export/import, sharing, branching, message editing, and search.

## Features to Implement

### 1. Session Export/Import
- [ ] Export session as JSON
  - Include all messages
  - Include session metadata
  - Include model settings
  - Include images (base64)
- [ ] Export as Markdown
  - Readable format
  - Code blocks preserved
  - Images as links
- [ ] Export as PDF (optional)
  - Professional formatting
  - Include branding
- [ ] Import session from JSON
  - Validate schema
  - Handle version differences
  - Merge or replace options
- [ ] Bulk export (zip file)
  - Select multiple sessions
  - Export as archive
  - Include index file

### 2. Session Sharing
- [ ] Generate shareable link
  - Public URL (read-only)
  - Optional password protection
  - Expiration time (1 day, 1 week, never)
  - View count tracking
- [ ] Share modal UI
  - Copy link button
  - QR code generator
  - Social media buttons (optional)
- [ ] Shared session viewer
  - New route: /shared/[token]
  - Read-only view
  - No editing
  - Hide user info
- [ ] Manage shared sessions
  - List all shared links
  - Revoke access
  - Update expiration
  - View analytics (views, clicks)

### 3. Conversation Branching
- [ ] Branch from any message
  - Click "Branch from here"
  - Create new session
  - Copy all messages up to that point
  - Continue with different path
- [ ] Branch visualization
  - Show parent session
  - Show child branches
  - Tree diagram (optional)
- [ ] Branch comparison
  - Side-by-side view
  - Highlight differences
  - Show divergence point

### 4. Message Editing
- [ ] Edit user messages
  - Click to edit inline
  - Save changes
  - Regenerate assistant response (optional)
- [ ] Edit assistant messages
  - Click to edit
  - Mark as manually edited
  - Option: Regenerate from this point
- [ ] Delete messages
  - Delete single message
  - Delete from this point onward
  - Confirmation required
- [ ] Message history
  - Track edits
  - Show edit timestamps
  - Revert to previous version

### 5. Message Search
- [ ] Search within session
  - Text search
  - Regex support (optional)
  - Highlight matches
  - Navigate between results
- [ ] Search across sessions
  - Global search
  - Filter by date range
  - Filter by model
  - Show context (surrounding messages)
- [ ] Advanced filters
  - By role (user/assistant/system)
  - By length (min/max tokens)
  - By cost (min/max)
  - Contains images
  - Has reasoning

### 6. Session Organization
- [ ] Folders/Tags
  - Create folders
  - Move sessions to folders
  - Color-coded tags
  - Filter by folder/tag
- [ ] Favorites/Starred
  - Star important sessions
  - Quick access to starred
  - Sort by starred first
- [ ] Archive
  - Archive old sessions
  - Hidden from main list
  - Restore from archive
  - Auto-archive after X days

### 7. Session Templates
- [ ] Create template from session
  - Save session as template
  - Template description
  - Include system prompt
  - Include initial messages
- [ ] Use template
  - Select template
  - Create new session from template
  - Customize before creation
- [ ] Template library
  - Public templates
  - User templates
  - Share templates (optional)

### 8. Collaboration Features (Optional)
- [ ] Multi-user sessions
  - Invite collaborators
  - Real-time updates (WebSocket)
  - User avatars/names
  - Who's typing indicator
- [ ] Comments on messages
  - Add annotations
  - Reply to specific messages
  - Mark as resolved
- [ ] Session permissions
  - Owner, Editor, Viewer roles
  - Read-only mode
  - Edit restrictions

## Database Schema Updates

### Add SharedSession table:
```prisma
model SharedSession {
  id            String   @id @default(cuid())
  sessionId     String   @map("session_id")
  token         String   @unique
  password      String?
  expiresAt     DateTime? @map("expires_at")
  viewCount     Int      @default(0) @map("view_count")
  createdAt     DateTime @default(now()) @map("created_at")

  session       AgenticSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("shared_sessions")
}
```

### Add SessionFolder table:
```prisma
model SessionFolder {
  id            String   @id @default(cuid())
  userId        Int      @map("user_id")
  name          String
  color         String   @default("#3B82F6")
  createdAt     DateTime @default(now()) @map("created_at")

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session_folders")
}
```

### Update AgenticSession:
```prisma
model AgenticSession {
  // ... existing fields ...
  folderId      String?  @map("folder_id")
  tags          String?  // JSON array
  isStarred     Boolean  @default(false) @map("is_starred")
  isArchived    Boolean  @default(false) @map("is_archived")
  parentId      String?  @map("parent_id") // For branching

  folder        SessionFolder? @relation(fields: [folderId], references: [id])
  parent        AgenticSession? @relation("SessionBranches", fields: [parentId], references: [id])
  branches      AgenticSession[] @relation("SessionBranches")
}
```

## API Routes to Create

- POST /api/sessions/[id]/export - Export session (JSON/MD/PDF)
- POST /api/sessions/import - Import session from file
- POST /api/sessions/[id]/share - Create shareable link
- GET /api/sessions/[id]/shared/[token] - Get shared session
- DELETE /api/sessions/[id]/shared/[token] - Revoke share
- POST /api/sessions/[id]/branch - Branch from message
- PATCH /api/sessions/[id]/messages/[messageId] - Edit message
- DELETE /api/sessions/[id]/messages/[messageId] - Delete message
- GET /api/sessions/search - Search across sessions
- POST /api/folders - Create folder
- PATCH /api/folders/[id] - Update folder
- DELETE /api/folders/[id] - Delete folder

## Files to Create

- app/shared/[token]/page.tsx - Shared session viewer
- components/agentic/session-export-modal.tsx - Export UI
- components/agentic/session-share-modal.tsx - Share UI
- components/agentic/message-editor.tsx - Inline message editor
- components/agentic/session-search.tsx - Search UI
- components/agentic/folder-manager.tsx - Folder organization
- components/agentic/session-tree-view.tsx - Branch visualization
- lib/session-export.ts - Export utilities
- lib/session-import.ts - Import validation

## Files to Modify

- components/agentic/session-drawer.tsx - Add folders, search, export
- app/page.tsx - Add edit/delete message options
- app/api/sessions/route.ts - Add search parameter
- prisma/schema.prisma - Add new tables

## Testing Checklist

### Export/Import:
- [ ] JSON export includes all data
- [ ] Markdown export readable
- [ ] Import validates schema
- [ ] Large sessions export/import correctly
- [ ] Images preserved

### Sharing:
- [ ] Shared link works
- [ ] Password protection works
- [ ] Expiration enforced
- [ ] View count accurate
- [ ] Revoke works

### Branching:
- [ ] Branch creates new session
- [ ] Messages copied correctly
- [ ] Parent-child relationship tracked
- [ ] Tree view accurate

### Editing:
- [ ] Edit saves correctly
- [ ] Regenerate works
- [ ] Delete works
- [ ] History tracked

### Search:
- [ ] Text search accurate
- [ ] Filters work
- [ ] Results highlighted
- [ ] Fast for large datasets

## Acceptance Criteria

- [ ] All 8 feature groups implemented
- [ ] Mobile-optimized UI
- [ ] Database persistence
- [ ] API endpoints secured
- [ ] Export/import validated
- [ ] Sharing privacy-safe
- [ ] Performance optimized
- [ ] No data loss

## Dependencies

- qrcode (for QR generation)
- jsPDF (for PDF export, optional)

## Estimated Time

**Total: 16-20 hours**
- Export/Import: 3-4 hours
- Sharing: 3-4 hours
- Branching: 2-3 hours
- Editing: 2-3 hours
- Search: 3-4 hours
- Organization: 2-3 hours
- Templates: 1-2 hours
- Testing: 2-3 hours

## Priority

**Low-Medium** - Power user features

## Related

- Issue #70 - Parent issue
