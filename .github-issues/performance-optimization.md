# Performance Optimization & Scalability

## Objective
Optimize application performance for production usage with large datasets, improve load times, implement caching strategies, and ensure scalability for growing user base.

## Background
Current implementation works well for small datasets but needs optimization for:
- Large session histories (100+ sessions per user)
- Long conversation threads (50+ messages)
- Image-heavy conversations (multiple vision model sessions)
- Concurrent users
- Mobile network conditions

## Features to Implement

### 1. Database Query Optimization
- [ ] Add database indexes for common queries
  - [ ] Index on `AgenticSession.userId` (already exists, verify)
  - [ ] Index on `AgenticMessage.sessionId` (already exists, verify)
  - [ ] Composite index on `AgenticSession(userId, updatedAt)` for sorted lists
  - [ ] Index on `User.email` for auth lookups (verify uniqueness)
  - [ ] Index on `AgenticSession.createdAt` for date filtering
- [ ] Implement query pagination
  - [ ] Session list: Load 20 at a time, infinite scroll
  - [ ] Message list: Load 50 at a time, scroll to load more
  - [ ] API routes: Add `?page=1&limit=20` support
  - [ ] Cursor-based pagination for real-time updates
- [ ] Optimize N+1 queries
  - [ ] Review all Prisma queries for includes
  - [ ] Use `select` instead of full object loading where possible
  - [ ] Batch load messages when switching sessions
  - [ ] Implement DataLoader pattern for repeated queries
- [ ] Add query result caching
  - [ ] Redis cache for session lists (5 min TTL)
  - [ ] LRU cache for recent messages (10 min TTL)
  - [ ] Cache invalidation on create/update/delete
  - [ ] Cache warming for logged-in users

### 2. Frontend Performance
- [ ] Code splitting and lazy loading
  - [ ] Lazy load SessionDrawer component
  - [ ] Lazy load ModelSettingsModal component
  - [ ] Lazy load ImageUpload component (only for vision models)
  - [ ] Lazy load ReasoningDisplay component
  - [ ] Dynamic imports for heavy libraries (date-fns, etc.)
- [ ] React optimization
  - [ ] Memoize expensive computations with `useMemo`
  - [ ] Memoize callbacks with `useCallback`
  - [ ] Use `React.memo` for pure components
  - [ ] Virtual scrolling for long message lists (react-window)
  - [ ] Debounce input fields (session search, settings)
- [ ] Image optimization
  - [ ] Compress images before base64 encoding (max 1MB)
  - [ ] Use Next.js Image component where applicable
  - [ ] Lazy load images with Intersection Observer
  - [ ] Thumbnail generation (128x128) for image gallery
  - [ ] Progressive JPEG/WebP loading
- [ ] Bundle optimization
  - [ ] Analyze bundle size with `@next/bundle-analyzer`
  - [ ] Tree-shake unused code
  - [ ] Remove duplicate dependencies
  - [ ] Split vendor bundles
  - [ ] Preload critical resources

### 3. API Response Optimization
- [ ] Response compression
  - [ ] Enable gzip/brotli compression
  - [ ] Compress JSON responses > 1KB
  - [ ] Stream large responses
- [ ] Response caching
  - [ ] Cache-Control headers for static data (models list)
  - [ ] ETag support for conditional requests
  - [ ] Stale-while-revalidate for session data
- [ ] Optimize API payload size
  - [ ] Omit null/undefined fields from JSON
  - [ ] Send only required fields in responses
  - [ ] Use shorter field names in JSON (optional)
  - [ ] Implement GraphQL for flexible queries (future)
- [ ] Connection pooling
  - [ ] Prisma connection pool configuration
  - [ ] Database connection limits
  - [ ] Connection retry logic

### 4. Streaming & Real-Time Performance
- [ ] Optimize SSE streaming
  - [ ] Reduce chunk size for faster initial render
  - [ ] Implement backpressure handling
  - [ ] Graceful reconnection on disconnect
  - [ ] Stream compression (if supported)
- [ ] Debounce UI updates
  - [ ] Batch DOM updates for streaming messages
  - [ ] Use requestAnimationFrame for smooth animations
  - [ ] Throttle scroll events
- [ ] Memory management
  - [ ] Clean up old SSE connections
  - [ ] Limit in-memory message buffer (max 100 messages)
  - [ ] Release image blob URLs after use
  - [ ] Garbage collection for closed sessions

### 5. Caching Strategy
- [ ] Server-side caching
  - [ ] Redis for session data (if available)
  - [ ] In-memory LRU cache (fallback)
  - [ ] Cache user data for 15 minutes
  - [ ] Cache model list for 1 hour
- [ ] Client-side caching
  - [ ] Service Worker for offline support (PWA)
  - [ ] Cache API responses in IndexedDB
  - [ ] Cache images in browser cache
  - [ ] Optimistic UI updates with cache
- [ ] Cache invalidation
  - [ ] Timestamp-based invalidation
  - [ ] Event-based invalidation (create/update/delete)
  - [ ] Manual cache clearing (admin panel)
  - [ ] Cache versioning for schema changes

### 6. Loading States & Skeleton Screens
- [ ] Implement skeleton screens
  - [ ] Session list skeleton (5 items)
  - [ ] Message list skeleton (3 items)
  - [ ] Settings modal skeleton
  - [ ] Image upload skeleton
- [ ] Loading indicators
  - [ ] Spinner for API requests
  - [ ] Progress bar for file uploads
  - [ ] Streaming dots for AI responses
  - [ ] Toast notifications for background operations
- [ ] Optimistic UI updates
  - [ ] Show message immediately before API confirmation
  - [ ] Show session immediately before creation
  - [ ] Revert on API error with toast

### 7. Network Optimization
- [ ] Reduce API calls
  - [ ] Batch multiple requests into one
  - [ ] WebSocket for real-time updates (future)
  - [ ] Polling → Server-Sent Events where applicable
  - [ ] Prefetch data on hover (session preview)
- [ ] Retry logic
  - [ ] Exponential backoff for failed requests
  - [ ] Retry failed image uploads
  - [ ] Queue failed API calls for retry
  - [ ] Network error recovery
- [ ] Offline support
  - [ ] Service Worker for offline functionality
  - [ ] Queue messages for sending when online
  - [ ] Offline indicator in UI
  - [ ] Sync data when reconnected

### 8. Mobile Performance
- [ ] Reduce mobile bundle size
  - [ ] Mobile-specific bundle (smaller)
  - [ ] Defer non-critical scripts
  - [ ] Preconnect to API domain
- [ ] Touch optimization
  - [ ] Passive event listeners for touch/scroll
  - [ ] Reduce re-renders on scroll
  - [ ] Hardware acceleration for animations
  - [ ] Debounce resize events
- [ ] Network-aware loading
  - [ ] Detect slow network (navigator.connection)
  - [ ] Load lower quality images on slow networks
  - [ ] Reduce polling frequency on slow networks
  - [ ] Show warning for offline state

### 9. Database Scalability
- [ ] Implement soft deletes
  - [ ] Add `deletedAt` field to sessions
  - [ ] Filter out deleted sessions from queries
  - [ ] Cron job for hard delete after 30 days
- [ ] Archive old data
  - [ ] Move sessions older than 1 year to archive table
  - [ ] Compress archived messages
  - [ ] Export to cold storage (S3)
- [ ] Database maintenance
  - [ ] VACUUM for PostgreSQL
  - [ ] Analyze query performance
  - [ ] Monitor slow queries
  - [ ] Database size monitoring

### 10. Monitoring & Profiling
- [ ] Performance monitoring
  - [ ] Vercel Analytics integration
  - [ ] Core Web Vitals tracking (LCP, FID, CLS)
  - [ ] Custom performance metrics
  - [ ] API response time tracking
- [ ] Error tracking
  - [ ] Sentry integration (optional)
  - [ ] Console error monitoring
  - [ ] Failed request logging
  - [ ] User-reported issues
- [ ] Profiling tools
  - [ ] React DevTools Profiler
  - [ ] Chrome DevTools Performance tab
  - [ ] Lighthouse audits (monthly)
  - [ ] Bundle analysis (weekly)

## Files to Create

- `lib/cache.ts` - Caching utilities (LRU, Redis client)
- `lib/db-cache.ts` - Database query caching layer
- `lib/image-optimizer.ts` - Image compression and optimization
- `lib/performance-monitor.ts` - Performance tracking utilities
- `components/common/skeleton-loader.tsx` - Reusable skeleton component
- `components/common/virtual-list.tsx` - Virtual scrolling component
- `hooks/use-intersection-observer.ts` - Lazy loading hook
- `hooks/use-debounce.ts` - Debounce hook
- `hooks/use-optimistic.ts` - Optimistic UI hook
- `middleware/cache.ts` - Response caching middleware

## Files to Modify

- `prisma/schema.prisma` - Add indexes, soft delete fields
- `app/api/sessions/route.ts` - Add pagination, caching
- `app/api/chat/route.ts` - Optimize streaming
- `app/page.tsx` - Add virtual scrolling, lazy loading
- `components/agentic/session-drawer.tsx` - Add pagination
- `stores/agentic-session-store.ts` - Add cache layer
- `next.config.ts` - Bundle optimization settings

## Testing Checklist

### Performance Tests:
- [ ] Lighthouse score > 90 (all metrics)
- [ ] Load time < 2s on 3G network
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s

### Load Tests:
- [ ] 100 sessions load in < 2s
- [ ] 500 messages render in < 1s
- [ ] 50 concurrent users supported
- [ ] Database queries < 100ms (95th percentile)
- [ ] API responses < 200ms (average)

### Mobile Tests:
- [ ] Works on slow 3G network
- [ ] No janky scrolling (60fps)
- [ ] Touch targets ≥ 44px
- [ ] No layout shifts (CLS < 0.1)
- [ ] Battery usage acceptable

## Acceptance Criteria

- [ ] Lighthouse Performance score > 90
- [ ] Load time < 2s on fast 3G
- [ ] All API responses < 500ms
- [ ] Database queries optimized (indexes, pagination)
- [ ] Client-side caching implemented
- [ ] Virtual scrolling for long lists
- [ ] Code splitting for all heavy components
- [ ] Image optimization working
- [ ] No performance regressions
- [ ] Core Web Vitals passing

## Dependencies

- `redis` (optional) - Server-side caching
- `lru-cache` - In-memory caching
- `react-window` - Virtual scrolling
- `sharp` (optional) - Image optimization
- `@next/bundle-analyzer` - Bundle analysis
- `next-pwa` (optional) - Service Worker

## Estimated Time

**Total: 16-24 hours**
- Database optimization: 4-6 hours
- Frontend optimization: 4-6 hours
- API optimization: 2-3 hours
- Caching implementation: 3-4 hours
- Mobile optimization: 2-3 hours
- Monitoring setup: 1-2 hours
- Testing and profiling: 2-4 hours

## Priority

**High** - Critical for production scalability and user experience

## Related

- Issue #70 - Parent issue
- Issue #74 - Testing (performance tests)
- Issue #75 - UI/UX (loading states)
