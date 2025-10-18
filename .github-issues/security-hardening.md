# Security Hardening & Vulnerability Fixes

## Objective
Implement comprehensive security measures to protect against common web vulnerabilities, secure user data, implement proper authentication/authorization, and ensure GDPR/privacy compliance.

## Background
Current implementation has basic authentication but needs hardening for production:
- Input validation and sanitization
- XSS/CSRF protection
- SQL injection prevention
- Rate limiting on all endpoints
- Content Security Policy
- Secure session management
- Data encryption
- Audit logging

## Features to Implement

### 1. Authentication Security
- [ ] Password security
  - [ ] Enforce strong password requirements (min 12 chars, uppercase, lowercase, number, special)
  - [ ] Password strength meter on registration
  - [ ] Prevent common passwords (top 10,000 list)
  - [ ] Password history (prevent reuse of last 5 passwords)
  - [ ] Implement password reset flow with email verification
  - [ ] Password expiry (90 days for admins, optional for users)
- [ ] Multi-Factor Authentication (MFA)
  - [ ] TOTP support (Google Authenticator, Authy)
  - [ ] Backup codes (10 one-time codes)
  - [ ] SMS fallback (optional, via Twilio)
  - [ ] Recovery email
  - [ ] Enforce MFA for admin accounts
- [ ] Session security
  - [ ] Secure session cookies (httpOnly, secure, sameSite=strict)
  - [ ] Session rotation on privilege escalation
  - [ ] Concurrent session limits (max 5 per user)
  - [ ] Session invalidation on password change
  - [ ] IP-based session validation (optional)
  - [ ] Device fingerprinting for suspicious login detection
- [ ] Account security
  - [ ] Account lockout after 10 failed attempts (1 hour)
  - [ ] Email verification on registration
  - [ ] Security questions for password reset (optional)
  - [ ] Login notifications (email on new device)
  - [ ] Account activity log (last 50 logins)

### 2. Input Validation & Sanitization
- [ ] Server-side validation
  - [ ] Validate all inputs with Zod schemas
  - [ ] Sanitize HTML in user messages
  - [ ] Strip dangerous tags (<script>, <iframe>, etc.)
  - [ ] Validate file uploads (type, size, content)
  - [ ] Validate image data URLs (prevent data exfiltration)
- [ ] SQL injection prevention
  - [ ] Use Prisma parameterized queries (already done)
  - [ ] No raw SQL queries without sanitization
  - [ ] Validate all database inputs
  - [ ] Use type-safe Prisma client
- [ ] XSS prevention
  - [ ] Sanitize user-generated content before rendering
  - [ ] Use DOMPurify for HTML sanitization
  - [ ] Escape special characters in markdown
  - [ ] Content Security Policy headers
  - [ ] X-XSS-Protection header
- [ ] CSRF protection
  - [ ] CSRF tokens on all state-changing requests
  - [ ] SameSite cookie attribute (strict)
  - [ ] Verify Origin/Referer headers
  - [ ] Double-submit cookie pattern

### 3. API Security
- [ ] Rate limiting (enhanced)
  - [ ] Global rate limit: 100 req/min per IP
  - [ ] Auth endpoints: 5 req/15min per IP
  - [ ] Chat endpoint: 20 req/min per user
  - [ ] Upload endpoint: 10 req/hour per user
  - [ ] Distributed rate limiting (Redis-based)
  - [ ] Rate limit headers (X-RateLimit-Remaining)
- [ ] API authentication
  - [ ] JWT validation on all protected routes
  - [ ] API key support for integrations (optional)
  - [ ] Bearer token authentication
  - [ ] Token expiry (7 days, refresh at 5 days)
  - [ ] Revoke tokens on logout
- [ ] Request validation
  - [ ] Validate Content-Type header
  - [ ] Validate request size (max 10MB)
  - [ ] Reject malformed JSON
  - [ ] Validate all query parameters
  - [ ] Sanitize file paths (prevent directory traversal)
- [ ] Response security
  - [ ] Remove sensitive headers (X-Powered-By)
  - [ ] Add security headers (HSTS, X-Frame-Options, etc.)
  - [ ] Limit error details in production
  - [ ] Don't leak stack traces to client
  - [ ] Redact sensitive data from logs

### 4. Data Encryption
- [ ] Encryption at rest
  - [ ] Encrypt database backups
  - [ ] Encrypt sensitive fields (API keys, tokens)
  - [ ] Use AES-256-GCM for encryption
  - [ ] Secure key management (environment variables)
  - [ ] Rotate encryption keys annually
- [ ] Encryption in transit
  - [ ] Enforce HTTPS (redirect HTTP to HTTPS)
  - [ ] TLS 1.3 minimum
  - [ ] HSTS header (max-age=31536000, includeSubDomains)
  - [ ] Strong cipher suites only
  - [ ] Verify SSL certificates
- [ ] Sensitive data handling
  - [ ] Never log passwords or tokens
  - [ ] Mask sensitive data in logs (email → e***@example.com)
  - [ ] Don't store credit card numbers (if payments added)
  - [ ] Use bcrypt for password hashing (already done, verify rounds=12)
  - [ ] Secure deletion of sensitive data

### 5. File Upload Security
- [ ] File validation
  - [ ] Whitelist allowed MIME types (images only)
  - [ ] Validate file magic bytes (not just extension)
  - [ ] Scan for malware (ClamAV integration, optional)
  - [ ] Limit file size (4MB per file, 20MB total)
  - [ ] Reject executable files (.exe, .sh, .bat)
- [ ] File storage
  - [ ] Store files outside web root
  - [ ] Generate random filenames (prevent overwrite)
  - [ ] Serve files with Content-Disposition: attachment
  - [ ] Set proper CORS headers for file access
  - [ ] Expire old files (delete after 90 days)
- [ ] Image processing
  - [ ] Strip EXIF metadata (privacy)
  - [ ] Re-encode images (remove embedded scripts)
  - [ ] Generate thumbnails server-side
  - [ ] Validate image dimensions (max 8000x8000)

### 6. Content Security Policy (CSP)
- [ ] Implement strict CSP
  - [ ] default-src 'self'
  - [ ] script-src 'self' 'unsafe-inline' (minimize inline scripts)
  - [ ] style-src 'self' 'unsafe-inline'
  - [ ] img-src 'self' data: https:
  - [ ] connect-src 'self' https://api.groq.com
  - [ ] font-src 'self'
  - [ ] frame-ancestors 'none'
  - [ ] upgrade-insecure-requests
- [ ] CSP reporting
  - [ ] report-uri for CSP violations
  - [ ] Monitor violations
  - [ ] Alert on suspicious patterns

### 7. Authorization & Access Control
- [ ] Role-Based Access Control (RBAC)
  - [ ] Admin role: Full access
  - [ ] User role: Own sessions only
  - [ ] Moderator role: View all, edit none (future)
  - [ ] Verify ownership before update/delete
  - [ ] Prevent privilege escalation
- [ ] Resource-level permissions
  - [ ] Users can only access their own sessions
  - [ ] Users can only delete their own messages
  - [ ] Admins can view (not edit) all sessions
  - [ ] Audit log for admin actions
- [ ] API endpoint protection
  - [ ] All endpoints require authentication (except /login, /register)
  - [ ] Admin-only endpoints (/api/models/refresh, /api/admin/*)
  - [ ] Check permissions before database queries
  - [ ] Return 403 Forbidden (not 404) for unauthorized access

### 8. Audit Logging & Monitoring
- [ ] Security audit log
  - [ ] Log all authentication events (login, logout, failed attempts)
  - [ ] Log privilege escalation attempts
  - [ ] Log data access (session views, message reads)
  - [ ] Log data modifications (create, update, delete)
  - [ ] Log admin actions
  - [ ] Store logs in separate table (AuditLog)
- [ ] Log fields
  - [ ] Timestamp
  - [ ] User ID
  - [ ] IP address
  - [ ] User agent
  - [ ] Action (login, create_session, delete_message, etc.)
  - [ ] Resource ID (session ID, message ID)
  - [ ] Status (success, failure)
  - [ ] Error message (if failed)
- [ ] Security monitoring
  - [ ] Alert on suspicious patterns (100+ failed logins)
  - [ ] Alert on privilege escalation attempts
  - [ ] Alert on unusual data access (accessing 100+ sessions)
  - [ ] Monitor for SQL injection attempts
  - [ ] Monitor for XSS attempts

### 9. Dependency Security
- [ ] Dependency scanning
  - [ ] Run `npm audit` weekly
  - [ ] Fix all high/critical vulnerabilities
  - [ ] Update dependencies monthly
  - [ ] Use Dependabot for automated PRs
  - [ ] Review dependency licenses
- [ ] Supply chain security
  - [ ] Verify package integrity (npm lockfile)
  - [ ] Use npm ci (not npm install) in production
  - [ ] Pin dependency versions (no ^)
  - [ ] Review new dependencies before adding
  - [ ] Avoid unmaintained packages
- [ ] Build security
  - [ ] No secrets in code
  - [ ] No secrets in git history
  - [ ] Use environment variables
  - [ ] .env files in .gitignore
  - [ ] Verify deployment secrets

### 10. Privacy & Compliance
- [ ] GDPR compliance
  - [ ] Privacy policy page
  - [ ] Cookie consent banner
  - [ ] Data export (download all user data)
  - [ ] Data deletion (right to be forgotten)
  - [ ] Data retention policy (delete after 2 years)
  - [ ] Data processing agreement
- [ ] User data privacy
  - [ ] Encrypt sensitive user data
  - [ ] Pseudonymize data in logs
  - [ ] No third-party tracking (Google Analytics, etc.)
  - [ ] No data sharing with third parties
  - [ ] Clear data usage disclosure
- [ ] Terms of Service
  - [ ] Acceptable use policy
  - [ ] Content moderation rules
  - [ ] Account termination policy
  - [ ] Liability limitations
  - [ ] DMCA policy (if applicable)

## Database Schema Updates

### Add AuditLog table:
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     Int?     @map("user_id")
  ipAddress  String   @map("ip_address")
  userAgent  String   @map("user_agent")
  action     String   // 'login', 'logout', 'create_session', etc.
  resourceId String?  @map("resource_id")
  status     String   // 'success', 'failure'
  errorMsg   String?  @map("error_message")
  createdAt  DateTime @default(now()) @map("created_at")

  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([createdAt])
  @@index([action])
  @@map("audit_logs")
}
```

### Add SecuritySettings table:
```prisma
model SecuritySettings {
  id                   Int      @id @default(autoincrement())
  userId               Int      @unique @map("user_id")
  mfaEnabled           Boolean  @default(false) @map("mfa_enabled")
  mfaSecret            String?  @map("mfa_secret")
  backupCodes          String?  @map("backup_codes") // JSON array
  loginNotifications   Boolean  @default(true) @map("login_notifications")
  passwordChangedAt    DateTime? @map("password_changed_at")
  passwordHistory      String?  @map("password_history") // JSON array of hashes
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("security_settings")
}
```

### Update User table:
```prisma
model User {
  // Add fields:
  emailVerified        DateTime? @map("email_verified")
  phone                String?
  phoneVerified        DateTime? @map("phone_verified")
  failedLoginAttempts  Int       @default(0) @map("failed_login_attempts")
  lockedUntil          DateTime? @map("locked_until")

  // Add relations:
  securitySettings     SecuritySettings?
  auditLogs            AuditLog[]
}
```

## API Routes to Create

- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password with token
- POST /api/auth/change-password - Change password (authenticated)
- POST /api/auth/mfa/setup - Setup MFA
- POST /api/auth/mfa/verify - Verify MFA code
- POST /api/auth/mfa/disable - Disable MFA
- GET /api/security/audit-log - Get user's audit log
- GET /api/security/sessions - List active sessions
- DELETE /api/security/sessions/[id] - Revoke session
- POST /api/security/export-data - Request data export (GDPR)
- POST /api/security/delete-account - Delete account (GDPR)

## Files to Create

- lib/security/password-validator.ts - Password strength validation
- lib/security/sanitizer.ts - Input sanitization utilities
- lib/security/mfa.ts - MFA setup and verification
- lib/security/audit-log.ts - Audit logging utilities
- lib/security/rate-limiter.ts - Enhanced rate limiting
- lib/security/csp.ts - Content Security Policy headers
- lib/security/encryption.ts - Encryption/decryption utilities
- middleware/security-headers.ts - Security header middleware
- middleware/csp.ts - CSP middleware
- components/auth/mfa-setup.tsx - MFA setup UI
- components/auth/password-strength.tsx - Password strength meter
- components/settings/security-settings.tsx - Security settings page

## Files to Modify

- lib/auth.ts - Add MFA, password validation, audit logging
- lib/auth/password.ts - Add password history, strength validation
- lib/auth/login-rate-limit.ts - Enhance with distributed rate limiting
- middleware.ts - Add security headers, CSP, enhanced logging
- app/api/auth/[...nextauth]/route.ts - Add MFA support
- app/api/sessions/route.ts - Add audit logging, rate limiting
- app/api/chat/route.ts - Add rate limiting, input sanitization
- app/login/page.tsx - Add MFA verification step
- prisma/schema.prisma - Add AuditLog, SecuritySettings tables

## Testing Checklist

### Security Tests:
- [ ] SQL injection prevented (all endpoints)
- [ ] XSS prevented (message content, session names)
- [ ] CSRF tokens validated
- [ ] File upload validation working
- [ ] Rate limiting enforced
- [ ] Password requirements enforced
- [ ] MFA working correctly
- [ ] Session security (httpOnly, secure, sameSite)
- [ ] Authorization checks (users can't access others' data)
- [ ] Audit logging working

### Penetration Testing:
- [ ] Run OWASP ZAP scan
- [ ] Run Burp Suite scan (optional)
- [ ] Test with SQLMap (SQL injection)
- [ ] Test with XSStrike (XSS)
- [ ] Test authentication bypass attempts
- [ ] Test privilege escalation attempts
- [ ] Test file upload vulnerabilities
- [ ] Test CSRF protection

### Compliance Tests:
- [ ] GDPR data export working
- [ ] GDPR data deletion working
- [ ] Privacy policy present
- [ ] Cookie consent working
- [ ] Terms of service present

## Acceptance Criteria

- [ ] All security headers implemented
- [ ] CSP policy enforced (no violations)
- [ ] MFA working for all users
- [ ] Password requirements enforced
- [ ] Rate limiting on all endpoints
- [ ] Audit logging for all critical actions
- [ ] Input validation and sanitization everywhere
- [ ] File upload security validated
- [ ] No high/critical vulnerabilities in npm audit
- [ ] OWASP ZAP scan passes (or issues documented)
- [ ] GDPR compliance features working
- [ ] Security documentation complete

## Dependencies

- `dompurify` - HTML sanitization
- `isomorphic-dompurify` - Server-side DOMPurify
- `speakeasy` - TOTP/MFA support
- `qrcode` - QR code generation for MFA
- `zxcvbn` - Password strength estimation
- `helmet` (optional) - Security headers middleware
- `express-rate-limit` (if using Express)
- `ioredis` (optional) - Distributed rate limiting

## Estimated Time

**Total: 24-32 hours**
- Authentication security: 6-8 hours
- Input validation: 3-4 hours
- API security: 4-6 hours
- Data encryption: 3-4 hours
- File upload security: 2-3 hours
- CSP implementation: 2-3 hours
- Authorization: 2-3 hours
- Audit logging: 3-4 hours
- Privacy compliance: 3-4 hours
- Testing: 4-6 hours

## Priority

**Critical** - Must be completed before production launch

## Related

- Issue #70 - Parent issue
- Issue #74 - Testing (security tests)
- Issue #77 - Performance (rate limiting)
