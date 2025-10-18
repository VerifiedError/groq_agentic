# Admin Dashboard - Complete Application Control Center

## Objective
Create a comprehensive admin dashboard with full control over users, sessions, models, system health, analytics, security, and configuration. A one-stop control center for application management.

## Background
Current admin capabilities are limited:
- No centralized admin interface
- No user management UI
- No system monitoring dashboard
- No analytics visualization
- Limited control over application settings

## Features to Implement

### 1. Dashboard Overview (Home Tab)
- [ ] System health metrics
  - [ ] Server status (uptime, last restart)
  - [ ] Database status (connection, query count, slow queries)
  - [ ] API status (response times, error rate)
  - [ ] Memory usage (heap, RSS)
  - [ ] CPU usage
  - [ ] Disk usage
- [ ] Real-time statistics
  - [ ] Active users (online now)
  - [ ] Total users (lifetime)
  - [ ] Active sessions (current conversations)
  - [ ] Messages sent today/week/month
  - [ ] Images uploaded today/week/month
  - [ ] API requests/min (live chart)
- [ ] Quick actions
  - [ ] Restart server (if self-hosted)
  - [ ] Clear cache (Redis, browser)
  - [ ] Refresh models from Groq API
  - [ ] Run database maintenance
  - [ ] Export audit logs
  - [ ] Broadcast system message to all users
- [ ] Recent activity feed
  - [ ] Last 20 actions (user logins, session creates, errors)
  - [ ] Live updating (every 5 seconds)
  - [ ] Filter by type (logins, errors, sessions, etc.)
  - [ ] Click to view details

### 2. User Management Tab
- [ ] User list
  - [ ] Table with columns: ID, Username, Email, Role, Status, Last Login, Created
  - [ ] Sortable columns
  - [ ] Search by username/email
  - [ ] Filter by role (admin, user)
  - [ ] Filter by status (active, inactive, locked)
  - [ ] Pagination (50 per page)
  - [ ] Bulk actions (select multiple users)
- [ ] User actions
  - [ ] View user details (profile, sessions, activity)
  - [ ] Edit user (username, email, role)
  - [ ] Change user password (as admin)
  - [ ] Activate/deactivate account
  - [ ] Lock/unlock account
  - [ ] Delete user (with confirmation, cascade to sessions)
  - [ ] Impersonate user (view as user, for debugging)
  - [ ] View user's sessions
  - [ ] View user's audit log
- [ ] User creation
  - [ ] Create new user (username, email, password, role)
  - [ ] Send welcome email (optional)
  - [ ] Set initial password (or auto-generate)
  - [ ] Require password change on first login
- [ ] Bulk operations
  - [ ] Export users to CSV
  - [ ] Import users from CSV
  - [ ] Bulk activate/deactivate
  - [ ] Bulk role change
  - [ ] Bulk delete (with confirmation)
- [ ] User analytics
  - [ ] Most active users (by message count)
  - [ ] Most sessions created
  - [ ] Most tokens consumed
  - [ ] Highest cost users
  - [ ] Inactive users (no login in 30 days)
  - [ ] New users this week/month

### 3. Session Management Tab
- [ ] Session list (all users)
  - [ ] Table: ID, User, Model, Title, Messages, Cost, Tokens, Created, Updated
  - [ ] Search by title/user
  - [ ] Filter by model
  - [ ] Filter by date range
  - [ ] Sort by cost, tokens, messages, date
  - [ ] Pagination (50 per page)
- [ ] Session actions
  - [ ] View session details (full conversation)
  - [ ] Edit session title
  - [ ] Delete session (with confirmation)
  - [ ] Export session to JSON/Markdown
  - [ ] Share session (generate read-only link)
  - [ ] Flag inappropriate content
  - [ ] View session analytics (cost breakdown, token usage)
- [ ] Session analytics
  - [ ] Total sessions created
  - [ ] Sessions by model (pie chart)
  - [ ] Sessions by day (line chart, last 30 days)
  - [ ] Average messages per session
  - [ ] Average cost per session
  - [ ] Most popular models
  - [ ] Vision vs. text sessions ratio
- [ ] Bulk operations
  - [ ] Export sessions to CSV
  - [ ] Delete old sessions (> 6 months)
  - [ ] Archive sessions (move to archive table)
  - [ ] Bulk delete by user

### 4. Model Management Tab
- [ ] Model list
  - [ ] Table: ID, Display Name, Context Window, Input Pricing, Output Pricing, Vision, Active
  - [ ] Search by name
  - [ ] Filter by vision capability
  - [ ] Filter by active status
  - [ ] Sort by pricing
- [ ] Model actions
  - [ ] Add new model (manual entry)
  - [ ] Edit model (pricing, display name, context window)
  - [ ] Activate/deactivate model
  - [ ] Delete model (if no sessions using it)
  - [ ] Refresh from Groq API (sync all models)
  - [ ] Set model visibility (public, admin-only)
- [ ] Model analytics
  - [ ] Usage by model (bar chart)
  - [ ] Cost by model (pie chart)
  - [ ] Tokens consumed by model
  - [ ] Popular models this week/month
  - [ ] Underutilized models
- [ ] Pricing management
  - [ ] Update pricing for all models
  - [ ] Set custom pricing for specific users (override)
  - [ ] Cost alerts (notify when user exceeds $X)
  - [ ] Free tier limits (max tokens per day)

### 5. Analytics & Insights Tab
- [ ] Usage statistics
  - [ ] Total API calls (lifetime, this month, today)
  - [ ] Messages sent (lifetime, this month, today)
  - [ ] Images uploaded (lifetime, this month, today)
  - [ ] Total cost (lifetime, this month, today)
  - [ ] Total tokens (input, output, cached)
  - [ ] Average response time (API)
  - [ ] Error rate (% of failed requests)
- [ ] Charts and visualizations
  - [ ] Messages over time (line chart, last 30 days)
  - [ ] Cost over time (area chart, last 30 days)
  - [ ] Sessions created over time (bar chart, last 30 days)
  - [ ] Active users over time (line chart, last 30 days)
  - [ ] Model usage distribution (pie chart)
  - [ ] Hour-of-day heatmap (when users are most active)
  - [ ] Day-of-week usage (bar chart)
- [ ] Cost analytics
  - [ ] Total cost breakdown (by model, by user, by feature)
  - [ ] Cost per user (average, median, top 10)
  - [ ] Cost trends (increasing, stable, decreasing)
  - [ ] Cost forecasting (projected monthly cost)
  - [ ] Budget alerts (warn when approaching limit)
- [ ] Performance metrics
  - [ ] API response times (p50, p95, p99)
  - [ ] Database query times (p50, p95, p99)
  - [ ] Slow API endpoints (> 1s)
  - [ ] Slow database queries (> 500ms)
  - [ ] Cache hit rate (if Redis enabled)
  - [ ] Error rate by endpoint
- [ ] User engagement
  - [ ] Daily Active Users (DAU)
  - [ ] Weekly Active Users (WAU)
  - [ ] Monthly Active Users (MAU)
  - [ ] Retention rate (users who return after 7 days)
  - [ ] Churn rate (users who haven't logged in 30 days)
  - [ ] New user growth rate

### 6. Security & Audit Tab
- [ ] Audit log viewer
  - [ ] Table: Timestamp, User, Action, Resource, IP, Status
  - [ ] Search by user, action, resource
  - [ ] Filter by date range
  - [ ] Filter by status (success, failure)
  - [ ] Filter by action type (login, logout, create, update, delete)
  - [ ] Export to CSV
  - [ ] Real-time updates (live feed)
- [ ] Security events
  - [ ] Failed login attempts (last 24 hours)
  - [ ] Locked accounts (list)
  - [ ] Suspicious activity (100+ requests/min from single IP)
  - [ ] Unauthorized access attempts
  - [ ] Password change history
  - [ ] MFA setup/disable events
- [ ] IP management
  - [ ] Whitelist IPs (allow specific IPs only)
  - [ ] Blacklist IPs (block specific IPs)
  - [ ] Rate limit overrides (increase limit for trusted IPs)
  - [ ] View requests by IP (top IPs by request count)
  - [ ] Block suspicious IPs automatically
- [ ] Security settings
  - [ ] Enforce strong passwords (toggle)
  - [ ] Require MFA for all users (toggle)
  - [ ] Session timeout (minutes)
  - [ ] Max concurrent sessions per user
  - [ ] Password expiry (days)
  - [ ] Failed login threshold (attempts before lock)
  - [ ] Account lock duration (minutes)
- [ ] Security scanning
  - [ ] Run npm audit (show results)
  - [ ] Run OWASP ZAP scan (scheduled weekly)
  - [ ] View recent security scan results
  - [ ] Download security reports

### 7. Configuration Tab
- [ ] Application settings
  - [ ] Site name
  - [ ] Site description
  - [ ] Logo URL
  - [ ] Favicon URL
  - [ ] Primary color (theme)
  - [ ] Contact email
  - [ ] Support URL
- [ ] Feature flags
  - [ ] Enable registration (toggle)
  - [ ] Enable vision models (toggle)
  - [ ] Enable file uploads (toggle)
  - [ ] Enable session sharing (toggle)
  - [ ] Enable code execution (toggle)
  - [ ] Enable web search (toggle)
  - [ ] Enable dark mode (toggle)
- [ ] API settings
  - [ ] Groq API key (masked, with "Test" button)
  - [ ] Global rate limits (requests/min)
  - [ ] Upload size limits (MB)
  - [ ] Max images per message
  - [ ] Max tokens per request
  - [ ] Default model
  - [ ] Enable prompt caching (toggle)
- [ ] Email settings (future)
  - [ ] SMTP server
  - [ ] SMTP port
  - [ ] SMTP username
  - [ ] SMTP password (masked)
  - [ ] From email address
  - [ ] Enable email notifications (toggle)
  - [ ] Test email (send test email)
- [ ] Storage settings (future)
  - [ ] Storage provider (Local, S3, Cloudflare R2)
  - [ ] S3 bucket name
  - [ ] S3 region
  - [ ] S3 credentials (masked)
  - [ ] Max storage per user (GB)
  - [ ] File retention period (days)

### 8. Database Management Tab
- [ ] Database overview
  - [ ] Database size (MB)
  - [ ] Table sizes (MB per table)
  - [ ] Row counts (per table)
  - [ ] Index usage
  - [ ] Slow queries (> 500ms)
  - [ ] Connection pool status
- [ ] Database actions
  - [ ] Run migrations (apply pending)
  - [ ] Rollback migration (undo last)
  - [ ] Backup database (manual trigger)
  - [ ] Restore from backup (upload .sql)
  - [ ] VACUUM (PostgreSQL optimization)
  - [ ] ANALYZE (update statistics)
  - [ ] Reset database (dev only, with confirmation)
- [ ] Query analyzer
  - [ ] Run custom SQL query (read-only)
  - [ ] View query execution plan
  - [ ] Top 10 slowest queries
  - [ ] Query performance history
- [ ] Data cleanup
  - [ ] Delete sessions older than X days
  - [ ] Delete messages older than X days
  - [ ] Archive old data (move to archive table)
  - [ ] Delete inactive users (no login in 1 year)
  - [ ] Clear audit logs older than 90 days

### 9. Logs & Monitoring Tab
- [ ] Application logs
  - [ ] View recent logs (last 1000 lines)
  - [ ] Filter by level (debug, info, warn, error)
  - [ ] Search logs
  - [ ] Download logs (last 24 hours)
  - [ ] Clear logs (dev only)
  - [ ] Live log streaming
- [ ] Error tracking
  - [ ] Recent errors (last 100)
  - [ ] Error details (stack trace, request info)
  - [ ] Error frequency chart
  - [ ] Most common errors
  - [ ] Error alerts (email on critical error)
- [ ] Performance monitoring
  - [ ] API response times (last 24 hours)
  - [ ] Database query times (last 24 hours)
  - [ ] Memory usage over time
  - [ ] CPU usage over time
  - [ ] Request volume over time
  - [ ] Slow endpoints (> 1s response time)
- [ ] Uptime monitoring
  - [ ] Uptime percentage (last 7 days, 30 days, 90 days)
  - [ ] Downtime incidents (list)
  - [ ] Health check status (API, database, Redis)
  - [ ] Last deployment time
  - [ ] Current version

### 10. System Tools Tab
- [ ] Maintenance tools
  - [ ] Clear cache (application, browser)
  - [ ] Rebuild search indexes (if implemented)
  - [ ] Optimize database
  - [ ] Generate sitemap (if public pages exist)
  - [ ] Warm up cache (preload common data)
- [ ] Developer tools
  - [ ] GraphQL Playground (if GraphQL implemented)
  - [ ] API documentation (Swagger/OpenAPI)
  - [ ] Database schema viewer
  - [ ] Environment variables viewer (masked secrets)
  - [ ] Feature flag tester
- [ ] Import/Export
  - [ ] Export all users to JSON/CSV
  - [ ] Export all sessions to JSON
  - [ ] Import users from CSV
  - [ ] Import sessions from JSON
  - [ ] Backup all data (full dump)
  - [ ] Restore from backup
- [ ] System notifications
  - [ ] Send notification to all users (toast/email)
  - [ ] Schedule maintenance window
  - [ ] Display banner on homepage
  - [ ] Send changelog to users
- [ ] Testing tools
  - [ ] Test email sending
  - [ ] Test API endpoints
  - [ ] Test database connection
  - [ ] Test Redis connection
  - [ ] Test Groq API connection
  - [ ] Simulate user actions (for testing)

## UI Design

### Layout:
```
┌─────────────────────────────────────────────────────────┐
│ Admin Dashboard                                    [User]│
├─────────────────────────────────────────────────────────┤
│ [Overview] [Users] [Sessions] [Models] [Analytics]      │
│ [Security] [Config] [Database] [Logs] [Tools]           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 System Health                                        │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │ Uptime   │ Users    │ Sessions │ Errors   │          │
│  │ 99.9%    │ 1,234    │ 567      │ 3        │          │
│  └──────────┴──────────┴──────────┴──────────┘          │
│                                                          │
│  📈 Activity (Last 7 Days)                               │
│  [Line chart showing messages, sessions, users]         │
│                                                          │
│  ⚡ Quick Actions                                        │
│  [Refresh Models] [Clear Cache] [Export Logs]           │
│                                                          │
│  📋 Recent Activity                                      │
│  • user123 logged in from 192.168.1.1                   │
│  • admin created new session "React Help"               │
│  • user456 uploaded image to session abc123             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Design System:
- **Colors**: Professional dark theme (dark gray background, white/blue accents)
- **Charts**: Recharts or Chart.js for visualizations
- **Tables**: TanStack Table for advanced tables (sorting, filtering, pagination)
- **Icons**: Lucide React icons
- **Layout**: Responsive (mobile: stacked tabs, desktop: horizontal tabs)
- **Accessibility**: Keyboard navigation, screen reader support, ARIA labels

## Database Schema Updates

### Add AdminSettings table:
```prisma
model AdminSettings {
  id                String   @id @default(cuid())
  siteName          String   @default("Playground")
  siteDescription   String?
  enableRegistration Boolean @default(true)
  enableVisionModels Boolean @default(true)
  enableFileUploads Boolean  @default(true)
  maxUploadSizeMB   Int      @default(4)
  maxImagesPerMsg   Int      @default(5)
  globalRateLimit   Int      @default(100) // requests per minute
  sessionTimeoutMin Int      @default(10080) // 7 days in minutes
  updatedAt         DateTime @updatedAt

  @@map("admin_settings")
}
```

### Add SystemMetrics table (for time-series data):
```prisma
model SystemMetrics {
  id              String   @id @default(cuid())
  timestamp       DateTime @default(now())
  activeUsers     Int      @default(0)
  totalSessions   Int      @default(0)
  messagesCount   Int      @default(0)
  apiRequests     Int      @default(0)
  errorCount      Int      @default(0)
  avgResponseTime Float    @default(0) // milliseconds
  memoryUsageMB   Float    @default(0)
  cpuUsagePercent Float    @default(0)

  @@index([timestamp])
  @@map("system_metrics")
}
```

## API Routes to Create

- GET /api/admin/dashboard - Dashboard stats
- GET /api/admin/users - List all users
- GET /api/admin/users/[id] - Get user details
- PATCH /api/admin/users/[id] - Update user
- DELETE /api/admin/users/[id] - Delete user
- GET /api/admin/sessions - List all sessions (all users)
- DELETE /api/admin/sessions/[id] - Delete any session
- GET /api/admin/models - List models with usage stats
- GET /api/admin/analytics - Analytics data
- GET /api/admin/audit-log - Audit log entries
- GET /api/admin/security/events - Security events
- POST /api/admin/security/block-ip - Block IP address
- GET /api/admin/config - Get configuration
- PATCH /api/admin/config - Update configuration
- GET /api/admin/database/stats - Database statistics
- POST /api/admin/database/backup - Trigger backup
- GET /api/admin/logs - Application logs
- GET /api/admin/metrics - System metrics

## Files to Create

- app/admin/page.tsx - Admin dashboard page
- app/admin/layout.tsx - Admin layout with tabs
- components/admin/dashboard-overview.tsx - Overview tab
- components/admin/user-management.tsx - User management tab
- components/admin/session-management.tsx - Session management tab
- components/admin/model-management.tsx - Model management tab
- components/admin/analytics-dashboard.tsx - Analytics tab
- components/admin/security-audit.tsx - Security tab
- components/admin/configuration.tsx - Config tab
- components/admin/database-tools.tsx - Database tab
- components/admin/logs-viewer.tsx - Logs tab
- components/admin/system-tools.tsx - Tools tab
- components/admin/charts/line-chart.tsx - Reusable line chart
- components/admin/charts/bar-chart.tsx - Reusable bar chart
- components/admin/charts/pie-chart.tsx - Reusable pie chart
- components/admin/tables/user-table.tsx - Advanced user table
- components/admin/tables/session-table.tsx - Advanced session table
- lib/admin/metrics-collector.ts - Collect system metrics
- lib/admin/analytics.ts - Analytics calculations
- middleware/admin-only.ts - Admin route protection

## Files to Modify

- middleware.ts - Add admin route protection
- app/page.tsx - Add "Admin Dashboard" link in header (if admin)
- lib/auth.ts - Add isAdmin() helper

## Testing Checklist

### Functionality Tests:
- [ ] All tabs load correctly
- [ ] All charts display data
- [ ] All tables sortable/filterable
- [ ] User CRUD operations work
- [ ] Session CRUD operations work
- [ ] Model CRUD operations work
- [ ] Configuration updates persist
- [ ] Analytics data accurate
- [ ] Audit log captures all events
- [ ] Security features work (IP blocking, rate limits)

### Permission Tests:
- [ ] Non-admins cannot access /admin
- [ ] Admins see admin dashboard link
- [ ] Users see regular interface only
- [ ] Admin actions logged in audit log

### Performance Tests:
- [ ] Dashboard loads in < 2s
- [ ] Large tables (1000+ rows) performant
- [ ] Charts render smoothly
- [ ] Real-time updates don't cause lag

## Acceptance Criteria

- [ ] All 10 tabs implemented and functional
- [ ] Charts and visualizations working
- [ ] User management fully operational
- [ ] Session management fully operational
- [ ] Analytics accurate and insightful
- [ ] Security features operational
- [ ] Configuration updates working
- [ ] Database tools functional
- [ ] Logs viewer working
- [ ] System tools operational
- [ ] Mobile responsive
- [ ] Admin-only access enforced
- [ ] All actions logged in audit log

## Dependencies

- recharts or chart.js - Charts and visualizations
- @tanstack/react-table - Advanced tables
- date-fns - Date formatting and manipulation
- lucide-react - Icons (already in project)

## Estimated Time

**Total: 30-40 hours**
- Dashboard overview: 4-6 hours
- User management: 6-8 hours
- Session management: 4-6 hours
- Model management: 3-4 hours
- Analytics dashboard: 6-8 hours
- Security & audit: 4-6 hours
- Configuration: 2-3 hours
- Database tools: 3-4 hours
- Logs & monitoring: 3-4 hours
- System tools: 3-4 hours
- Testing: 4-6 hours

## Priority

**High** - Critical for application management and monitoring

## Related

- Issue #70 - Parent issue
- Issue #71 - Phase 3 (Settings modal improvements)
- Issue #72 - Phase 4 (Cost tracking - feeds into analytics)
- Issue #74 - Testing (Admin testing)
- Issue #77 - Performance (Monitoring integration)
- Issue #78 - Security (Security tab features)
