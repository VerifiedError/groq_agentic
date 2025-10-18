# Phase 3: Advanced Model Settings Expansion

## Objective
Expand the ModelSettingsModal component to include all advanced settings from the archived playground implementation, optimized for mobile-first PWA design.

## Background
Currently, ModelSettingsModal only has basic settings (temperature, maxTokens, topP, webSearch). The archived playground had extensive settings including file parsers, AI providers, formatting rules, system prompts, chat memory, and presets.

## Features to Implement

### 1. Model Management
- [ ] Model Enable/Disable Toggle - Toggle switch to enable/disable specific model
- [ ] Custom Model Label - Text input for custom model naming
- [ ] Persist state in database

### 2. File Parser Engine Selector
- [ ] Parser Dropdown (Auto, Jina, Firecrawl, Exa)
- [ ] Parser Configuration (API keys, test connection)
- [ ] Mobile: Bottom sheet, Desktop: Dropdown

### 3. AI Provider Selector
- [ ] Provider Dropdown (Auto, Groq, OpenRouter)
- [ ] Provider Configuration (API keys, pricing info)
- [ ] Show available models per provider

### 4. Formatting Rules
- [ ] Multi-line textarea (2000 char limit)
- [ ] Live character counter
- [ ] Token counter estimate
- [ ] Common formatting presets dropdown

### 5. System Prompt
- [ ] Toggle: Default / Custom
- [ ] Custom prompt textarea (1000 char limit)
- [ ] System prompt library (templates)
- [ ] Save custom prompts

### 6. Chat Memory
- [ ] Slider: 0-50 messages
- [ ] Token estimate display
- [ ] Cost estimate
- [ ] Smart truncation options

### 7. Preset System
- [ ] Preset dropdown (default + user presets)
- [ ] Save current settings as preset
- [ ] Load preset with confirmation
- [ ] Manage presets (edit, delete, export)

### 8. Advanced Actions
- [ ] Apply to All button (with confirmation)
- [ ] Reset to Defaults button
- [ ] Remove Model button (admin only)

### 9. Mobile Optimizations
- [ ] Collapsible sections (accordion UI)
- [ ] Bottom sheets for selectors
- [ ] Focus mode for textareas
- [ ] Touch-friendly (44px min targets)

### 10. Settings Persistence
- [ ] Create ModelUserSettings table
- [ ] API routes for CRUD operations
- [ ] Auto-save with debounce
- [ ] Error handling with retry

## Files to Create

- app/api/settings/models/route.ts
- app/api/settings/models/[id]/route.ts
- app/api/settings/presets/route.ts
- app/api/settings/presets/[id]/route.ts
- lib/token-counter.ts
- components/playground/preset-selector.tsx
- components/playground/formatting-editor.tsx
- components/playground/system-prompt-editor.tsx

## Files to Modify

- components/playground/model-settings-modal.tsx
- app/page.tsx
- prisma/schema.prisma

## Testing Checklist

### Mobile:
- [ ] All sections collapsible
- [ ] Touch targets >= 44px
- [ ] Bottom sheets smooth
- [ ] Focus mode works
- [ ] Fits 100dvh

### Desktop:
- [ ] All settings visible
- [ ] Dropdowns have descriptions
- [ ] Hover states work
- [ ] Keyboard navigation

### Functionality:
- [ ] Save/load from database
- [ ] Presets work correctly
- [ ] Apply to All works
- [ ] Reset works
- [ ] Auto-save works
- [ ] Token counters accurate

## Estimated Time
12-16 hours total

## Priority
Medium-High

## Related
Issue #70 - Parent issue
