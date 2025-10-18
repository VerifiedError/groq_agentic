# Comprehensive Testing Suite & E2E Tests

## Objective
Implement comprehensive testing including unit tests, integration tests, E2E tests, and visual regression testing for the entire application.

## Testing Strategy

### 1. Unit Tests (Jest + React Testing Library)
- [ ] Components testing
  - SessionDrawer component
  - ImageUpload component
  - VisionMessage component
  - ModelSettingsModal component
  - ReasoningDisplay component
  - All authentication components
- [ ] Utility functions
  - session-name-generator.ts
  - vision-utils.ts
  - cost-calculator.ts
  - token-counter.ts
  - reasoning-parser.ts
- [ ] API route handlers
  - Mock database calls
  - Test error handling
  - Test authentication checks
  - Test input validation

### 2. Integration Tests
- [ ] API routes with database
  - Session CRUD operations
  - Message CRUD operations
  - User authentication flow
  - Settings persistence
- [ ] State management
  - Zustand store operations
  - State synchronization
  - Optimistic updates
- [ ] Database operations
  - Prisma queries
  - Transaction handling
  - Cascade deletes
  - Index performance

### 3. E2E Tests (Playwright)
- [ ] Authentication flows
  - User registration
  - User login
  - Password reset (if implemented)
  - Logout
  - Session persistence
- [ ] Session management
  - Create new session
  - Switch between sessions
  - Delete session
  - Session name auto-generation
- [ ] Chat functionality
  - Send message
  - Receive streaming response
  - Reasoning display
  - Message persistence
- [ ] Vision models
  - Upload image (file picker)
  - Upload image (camera on mobile)
  - Send message with images
  - View image lightbox
  - Remove images
- [ ] Settings
  - Open settings modal
  - Adjust temperature slider
  - Save settings
  - Settings persist
- [ ] Mobile-specific
  - Session drawer open/close
  - Touch interactions
  - Viewport fit (100dvh)
  - No scrolling issues
  - PWA install
- [ ] Desktop-specific
  - Keyboard navigation
  - Hover states
  - Drag & drop images
  - Responsive layout

### 4. Visual Regression Testing (Percy/Chromatic)
- [ ] Screenshot comparison
  - Login page
  - Home page (empty state)
  - Home page (with messages)
  - Session drawer
  - Settings modal
  - Vision message with images
  - Admin dashboard
- [ ] Cross-browser testing
  - Chrome
  - Firefox
  - Safari
  - Edge
- [ ] Responsive screenshots
  - Mobile (375px)
  - Tablet (768px)
  - Desktop (1920px)

### 5. Performance Testing
- [ ] Lighthouse audits
  - Performance score ≥ 90
  - Accessibility score ≥ 95
  - Best Practices score ≥ 95
  - SEO score ≥ 90
  - PWA score ≥ 90
- [ ] Load testing
  - 100 concurrent users
  - 1000 sessions per user
  - Large messages (10k chars)
  - Many images (5 per message)
- [ ] Database performance
  - Query execution time < 100ms
  - Index usage verification
  - N+1 query detection
- [ ] Frontend performance
  - First Contentful Paint < 1.5s
  - Time to Interactive < 3s
  - Total Blocking Time < 200ms
  - Cumulative Layout Shift < 0.1

### 6. Accessibility Testing (axe-core)
- [ ] Automated checks
  - WCAG 2.1 Level AA compliance
  - Color contrast ratios
  - Keyboard navigation
  - Screen reader compatibility
- [ ] Manual testing
  - Navigate with keyboard only
  - Test with VoiceOver (Mac)
  - Test with NVDA (Windows)
  - Test with TalkBack (Android)

### 7. Security Testing
- [ ] Authentication
  - SQL injection attempts
  - XSS attempts
  - CSRF protection
  - Rate limiting
- [ ] Authorization
  - User can only access own data
  - Admin-only routes protected
  - API endpoint protection
- [ ] Data validation
  - Input sanitization
  - File upload validation
  - Image size limits
  - SQL injection prevention

### 8. Mobile Testing (BrowserStack/Sauce Labs)
- [ ] iOS devices
  - iPhone SE (375px)
  - iPhone 12/13/14 (390px)
  - iPhone 14 Pro Max (430px)
  - iPad (768px)
- [ ] Android devices
  - Samsung Galaxy S21 (360px)
  - Google Pixel 5 (393px)
  - OnePlus 9 (412px)
  - Samsung Galaxy Tab (800px)
- [ ] Mobile browsers
  - Safari (iOS)
  - Chrome (Android)
  - Firefox (Android)
  - Samsung Internet

## Test Coverage Goals

- Unit tests: ≥ 80% code coverage
- Integration tests: All critical paths
- E2E tests: All user flows
- Visual regression: All pages/states
- Performance: All pages pass Lighthouse
- Accessibility: 100% WCAG AA compliance

## CI/CD Integration

- [ ] GitHub Actions workflow
  - Run unit tests on PR
  - Run integration tests on PR
  - Run E2E tests on merge to main
  - Visual regression on merge
  - Lighthouse CI on deploy
- [ ] Pre-commit hooks
  - Run unit tests
  - Run linting
  - Run type checking
- [ ] Pre-push hooks
  - Run all tests
  - Check test coverage

## Files to Create

- jest.config.js - Jest configuration
- playwright.config.ts - Playwright configuration
- tests/unit/ - Unit test files
- tests/integration/ - Integration test files
- tests/e2e/ - E2E test files
- tests/fixtures/ - Test data fixtures
- tests/helpers/ - Test utility functions
- .github/workflows/test.yml - CI workflow
- lighthouse.config.js - Lighthouse CI config

## Testing Libraries

- jest - Unit testing framework
- @testing-library/react - React component testing
- @testing-library/user-event - User interaction simulation
- @playwright/test - E2E testing
- @axe-core/playwright - Accessibility testing
- jest-axe - A11y unit testing
- msw - API mocking
- @percy/playwright - Visual regression (optional)

## Example Test Structure

```typescript
// tests/unit/session-name-generator.test.ts
describe('generateSessionName', () => {
  it('generates name from question', () => {
    const name = generateSessionName('How do I use React hooks?')
    expect(name).toBe('How do I use React hooks')
  })

  it('truncates long messages', () => {
    const longMessage = 'a'.repeat(100)
    const name = generateSessionName(longMessage)
    expect(name.length).toBeLessThanOrEqual(60)
  })
})

// tests/e2e/session.spec.ts
test('create and delete session', async ({ page }) => {
  await page.goto('http://localhost:13380')
  await page.click('[data-testid="new-chat"]')
  await page.fill('[data-testid="message-input"]', 'Hello')
  await page.click('[data-testid="send-button"]')
  await page.waitForSelector('[data-testid="assistant-message"]')
  // ... rest of test
})
```

## Acceptance Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Code coverage ≥ 80%
- [ ] Lighthouse scores ≥ 90
- [ ] WCAG AA compliant
- [ ] No security vulnerabilities
- [ ] CI/CD integrated

## Estimated Time

**Total: 20-30 hours**
- Unit tests: 8-10 hours
- Integration tests: 4-6 hours
- E2E tests: 6-8 hours
- Visual regression: 2-3 hours
- Performance testing: 2-3 hours
- CI/CD setup: 2-3 hours

## Priority

**High** - Essential for production readiness

## Related

- Issue #70 - Parent issue
