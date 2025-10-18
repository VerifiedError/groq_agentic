# Phase 4: Cost Tracking & Analytics Dashboard

## Objective
Implement comprehensive cost tracking and analytics for all AI interactions, with real-time token counting, cost calculation, and visual analytics dashboard.

## Background
Database already tracks totalCost, inputTokens, outputTokens, cachedTokens per session. Need UI components to display this data and calculate costs in real-time.

## Features to Implement

### 1. Real-Time Cost Calculation
- [ ] Token counting for each message
- [ ] Cost calculation based on model pricing
- [ ] Input tokens vs output tokens tracking
- [ ] Cached tokens detection (Groq prompt caching)
- [ ] Running total per session
- [ ] Running total per user (all time)

### 2. Message-Level Cost Display
- [ ] Cost badge on each assistant message
- [ ] Tooltip showing breakdown:
  - Input tokens: X ($Y)
  - Output tokens: X ($Y)
  - Cached tokens: X ($Y saved)
  - Total: $Z
- [ ] Color coding:
  - Green: < $0.01
  - Yellow: $0.01 - $0.10
  - Red: > $0.10

### 3. Session Cost Summary
- [ ] Session drawer shows cost per session
- [ ] Sort sessions by:
  - Most recent
  - Highest cost
  - Most tokens
  - Most messages
- [ ] Filter sessions:
  - By date range
  - By cost range
  - By model
- [ ] Session cost badge colors

### 4. Analytics Dashboard
- [ ] New route: /analytics (admin and user)
- [ ] User Analytics:
  - Total sessions count
  - Total cost (all time)
  - Total tokens (all time)
  - Average cost per session
  - Average cost per message
  - Most used models
  - Cost trend over time (chart)
- [ ] Admin Analytics:
  - All users' total cost
  - Cost per user (table)
  - Most expensive users
  - Most expensive models
  - System-wide usage trends

### 5. Cost Visualization
- [ ] Line chart: Cost over time
- [ ] Bar chart: Cost per model
- [ ] Pie chart: Token distribution (input/output/cached)
- [ ] Bar chart: Messages per day
- [ ] Use recharts or chart.js library
- [ ] Mobile-optimized charts
- [ ] Export data as CSV

### 6. Cost Alerts & Limits
- [ ] User-defined cost limits:
  - Daily limit
  - Weekly limit
  - Monthly limit
  - Per-session limit
- [ ] Warning at 80% of limit
- [ ] Block at 100% of limit
- [ ] Email notifications (optional)
- [ ] Admin override for limits

### 7. Cost Optimization Suggestions
- [ ] Analyze usage patterns
- [ ] Suggest cheaper models for simple tasks
- [ ] Highlight cached token savings
- [ ] Recommend prompt caching strategies
- [ ] Show potential savings

### 8. Cost History Export
- [ ] Export cost data as CSV
- [ ] Export session data as JSON
- [ ] Date range selection
- [ ] Model filter
- [ ] Email export (optional)

## Token Counting Library

### Implementation Options:
1. **tiktoken** (OpenAI's tokenizer)
   - Most accurate for GPT models
   - npm: `tiktoken`
   - Wasm bundle for browser

2. **gpt-tokenizer** (Lightweight)
   - Simpler API
   - npm: `gpt-tokenizer`
   - Good estimates

3. **Custom Estimator** (Fast)
   - Rough estimate: tokens ≈ chars / 4
   - No dependencies
   - Less accurate

**Recommendation**: Use gpt-tokenizer for balance

## Database Schema Updates

### Add to AgenticMessage:
```prisma
model AgenticMessage {
  // ... existing fields ...
  cost          Float    @default(0)
  inputTokens   Int      @default(0) @map("input_tokens")
  outputTokens  Int      @default(0) @map("output_tokens")
  cachedTokens  Int      @default(0) @map("cached_tokens")
}
```

### Add to AgenticSession:
```prisma
model AgenticSession {
  // ... existing fields ...
  totalCost     Float    @default(0) @map("total_cost")
  inputTokens   Int      @default(0) @map("input_tokens")
  outputTokens  Int      @default(0) @map("output_tokens")
  cachedTokens  Int      @default(0) @map("cached_tokens")
}
```

### Add UserCostLimit:
```prisma
model UserCostLimit {
  id            String   @id @default(cuid())
  userId        Int      @unique @map("user_id")
  dailyLimit    Float    @default(1.0) @map("daily_limit")
  weeklyLimit   Float    @default(5.0) @map("weekly_limit")
  monthlyLimit  Float    @default(20.0) @map("monthly_limit")
  sessionLimit  Float    @default(0.5) @map("session_limit")
  emailAlerts   Boolean  @default(true) @map("email_alerts")

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_cost_limits")
}
```

## API Routes to Create

- GET /api/analytics/user - User's analytics summary
- GET /api/analytics/admin - Admin system analytics
- GET /api/analytics/export - Export cost data (CSV/JSON)
- PATCH /api/analytics/limits - Update cost limits
- GET /api/analytics/check-limit - Check if under limit

## Files to Create

- app/analytics/page.tsx - Analytics dashboard
- components/analytics/cost-chart.tsx - Line chart component
- components/analytics/model-distribution.tsx - Pie chart
- components/analytics/usage-stats.tsx - Stats cards
- components/analytics/cost-limit-settings.tsx - Limit configuration
- components/agentic/message-cost-badge.tsx - Cost badge
- lib/cost-calculator.ts - Token counting and cost calculation
- lib/token-counter.ts - Token estimation utility

## Files to Modify

- app/api/chat/route.ts - Add cost tracking to responses
- app/api/sessions/[id]/messages/route.ts - Track message costs
- app/page.tsx - Show message cost badges
- components/agentic/session-drawer.tsx - Show session costs
- prisma/schema.prisma - Add cost fields and limits table

## Cost Calculation Logic

```typescript
// Example from lib/cost-calculator.ts
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number,
  modelId: string
): number {
  const pricing = GROQ_PRICING[modelId]
  if (!pricing) return 0

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricing
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricing
  const cachedCost = (cachedTokens / 1_000_000) * pricing.cachedPricing || 0

  return inputCost + outputCost + cachedCost
}
```

## Testing Checklist

### Functionality:
- [ ] Token counting accurate (within 5%)
- [ ] Cost calculation correct
- [ ] Session totals sum correctly
- [ ] User totals sum correctly
- [ ] Limits enforced properly
- [ ] Alerts trigger at 80%
- [ ] Block at 100% limit

### UI/UX:
- [ ] Cost badges visible but not intrusive
- [ ] Charts responsive (mobile & desktop)
- [ ] Export works (CSV/JSON)
- [ ] Analytics dashboard loads fast
- [ ] Color coding clear
- [ ] Tooltips informative

### Mobile:
- [ ] Charts fit viewport
- [ ] Touch-friendly controls
- [ ] Horizontal scroll for wide tables
- [ ] Bottom sheets for filters

### Desktop:
- [ ] Charts use full width
- [ ] Tables sortable
- [ ] Hover states for insights
- [ ] Keyboard navigation

## Acceptance Criteria

- [ ] Real-time cost tracking implemented
- [ ] Message-level cost display
- [ ] Session cost summary
- [ ] Analytics dashboard (user & admin)
- [ ] Cost visualization charts
- [ ] Cost limits and alerts
- [ ] Export functionality
- [ ] Mobile-optimized
- [ ] Database persistence

## Dependencies

- gpt-tokenizer (or tiktoken)
- recharts (or chart.js)

## Estimated Time

**Total: 8-12 hours**
- Token counting: 2-3 hours
- Cost calculation: 1-2 hours
- UI components: 3-4 hours
- Analytics dashboard: 3-4 hours
- Testing: 1-2 hours

## Priority

**Medium** - Nice to have for cost-conscious users

## Related

- Issue #70 - Parent issue
- Issue #71 - Phase 3 (Advanced Settings)
