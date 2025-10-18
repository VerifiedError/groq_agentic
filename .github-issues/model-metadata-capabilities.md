# Comprehensive Model Metadata & Capability Detection System

## Objective
Implement a complete model metadata system that accurately detects and stores all model capabilities (vision, tools, web search, code execution, browser automation, etc.) from the Groq API, and intelligently enables/disables UI features based on each model's actual capabilities.

## Background

**Current Implementation Issues:**

1. **Incomplete Database Schema**:
   - Only stores: displayName, contextWindow, inputPricing, outputPricing, isVision, isActive
   - Missing: owner, created date, model type, specific capabilities, reasoning support, audio support

2. **Hardcoded Capability Detection**:
   - Vision models detected via pattern matching (error-prone)
   - No detection for: tool support, web search, code execution, browser automation, reasoning, audio
   - Pattern list will become outdated as new models are released

3. **No Smart Feature Toggling**:
   - Users can enable "Web Search" on non-compound models (won't work)
   - Vision model selector doesn't show which models support images
   - No indication if a model supports tools/function calling
   - Settings don't auto-disable unavailable features

4. **Missing Model Metadata**:
   - No model owner/creator information (Meta, Groq, OpenAI, etc.)
   - No model creation/release date
   - No model type categorization (chat, reasoning, vision, audio, guard, TTS, STT)
   - No context window info in model selector

**Goal**: Create a robust, self-updating system that accurately represents each model's capabilities and provides users with clear guidance on what each model can and cannot do.

---

## Features to Implement

### 1. Enhanced Database Schema

Add comprehensive fields to `GroqModel` table to store all capabilities and metadata:

- [ ] **Model Metadata Fields**:
  - [ ] `owner` (String) - Model creator (e.g., "Meta", "Groq", "OpenAI", "DeepSeek")
  - [ ] `createdAt` (DateTime) - Model release date (from API `created` timestamp)
  - [ ] `modelType` (String) - Category: "chat", "reasoning", "vision", "audio-stt", "audio-tts", "guard", "compound"
  - [ ] `description` (String, optional) - Model description for UI tooltip
  - [ ] `isDeprecated` (Boolean) - Marked for deprecation
  - [ ] `deprecationDate` (DateTime, optional) - When model will be removed

- [ ] **Capability Fields**:
  - [ ] `supportsTools` (Boolean) - Supports function/tool calling
  - [ ] `supportsWebSearch` (Boolean) - Can use built-in web search
  - [ ] `supportsCodeExecution` (Boolean) - Can execute Python code
  - [ ] `supportsBrowserAutomation` (Boolean) - Can control browsers
  - [ ] `supportsVisitWebsite` (Boolean) - Can fetch specific URLs
  - [ ] `supportsWolframAlpha` (Boolean) - Can query Wolfram Alpha
  - [ ] `supportsVision` (Boolean) - Can process images (existing field, rename from `isVision`)
  - [ ] `supportsReasoning` (Boolean) - Exposes thinking/reasoning process
  - [ ] `supportsAudio` (Boolean) - Can process audio (STT) or generate audio (TTS)
  - [ ] `supportsStreaming` (Boolean) - Supports SSE streaming responses
  - [ ] `supportsJsonMode` (Boolean) - Supports structured JSON output
  - [ ] `supportsPromptCaching` (Boolean) - Supports prompt caching for cost reduction

- [ ] **Context and Limits**:
  - [ ] `maxInputTokens` (Int) - Maximum input tokens
  - [ ] `maxOutputTokens` (Int) - Maximum output tokens
  - [ ] `maxImageSize` (Int, optional) - Max image size in MB (for vision models)
  - [ ] `maxImageCount` (Int, optional) - Max images per request (for vision models)
  - [ ] `maxAudioDuration` (Int, optional) - Max audio length in seconds (for audio models)

- [ ] **Pricing Details** (enhanced):
  - [ ] `inputPricingCached` (Float, optional) - Cost for cached input tokens (if different)
  - [ ] `audioPricing` (Float, optional) - Cost per character (TTS) or per hour (STT)
  - [ ] `batchDiscount` (Float, optional) - Batch API discount percentage (e.g., 0.5 for 50% off)

- [ ] **Performance Metrics** (optional, future):
  - [ ] `avgLatencyMs` (Float) - Average response time
  - [ ] `tokensPerSecond` (Float) - Avg generation speed
  - [ ] `uptime` (Float) - Model availability percentage

### 2. Intelligent Model Capability Detection

Implement smart detection logic that analyzes Groq API responses and model patterns:

- [ ] **API-Based Detection**:
  - [ ] Fetch model list from `groq.models.list()`
  - [ ] Extract `owned_by` field → map to `owner`
  - [ ] Extract `created` timestamp → convert to `createdAt`
  - [ ] Extract `context_window` → store as `contextWindow`
  - [ ] Check if API provides capability flags (future-proof)

- [ ] **Pattern-Based Capability Detection**:
  - [ ] **Compound Models** (`groq/compound*`):
    - supportsTools: true
    - supportsWebSearch: true
    - supportsCodeExecution: true
    - supportsBrowserAutomation: true
    - supportsVisitWebsite: true
    - supportsWolframAlpha: true
    - modelType: "compound"

  - [ ] **Vision Models**:
    - Pattern: `/vision|llava|llama-4-scout|llama-4-maverick|llama-3\.2-(11b|90b)/i`
    - supportsVision: true
    - modelType: "vision"
    - Llama 4 models also: supportsTools: true

  - [ ] **Reasoning Models**:
    - Pattern: `/deepseek-r1|gpt-oss|qwen.*qwq/i`
    - supportsReasoning: true
    - modelType: "reasoning"

  - [ ] **Audio Models**:
    - Pattern: `/whisper/i` → STT, modelType: "audio-stt"
    - Pattern: `/playai-tts/i` → TTS, modelType: "audio-tts"
    - supportsAudio: true

  - [ ] **Guard Models**:
    - Pattern: `/llama-guard|prompt-guard/i`
    - modelType: "guard"
    - Special purpose (safety/filtering)

  - [ ] **Chat Models** (default):
    - All others: modelType: "chat"
    - supportsTools: Check documentation (most modern models support tools)

- [ ] **Owner Detection**:
  - [ ] Parse `owned_by` or `id` prefix:
    - `meta-llama/*` → "Meta"
    - `groq/*` → "Groq"
    - `openai/*` → "OpenAI"
    - `qwen/*` → "Alibaba Cloud"
    - `moonshotai/*` → "Moonshot AI"
    - `playai-*` → "PlayAI"
    - Others → Extract from prefix or default to "Community"

- [ ] **Tool Support Detection**:
  - [ ] Check model documentation reference
  - [ ] Default: true for models with context > 8192 (modern models)
  - [ ] Explicitly false for: whisper, playai-tts, llama-guard, prompt-guard

- [ ] **Fallback Strategy**:
  - [ ] If API doesn't provide capability data, use pattern matching
  - [ ] Log warning for unknown models
  - [ ] Default to conservative capabilities (most disabled)
  - [ ] Allow admin override in database

### 3. Dynamic Pricing Sync

Fetch and sync pricing from Groq API or fallback to hardcoded map:

- [ ] **API Pricing Fetch** (if available):
  - [ ] Check if Groq API exposes pricing endpoint
  - [ ] Fetch pricing data during model refresh
  - [ ] Update `inputPricing`, `outputPricing` fields

- [ ] **Fallback to Hardcoded Pricing**:
  - [ ] Use existing `GROQ_PRICING` map in `lib/groq-utils.ts`
  - [ ] Keep pricing map up-to-date (manual updates for new models)
  - [ ] Log warning when pricing not found for a model

- [ ] **Pricing Special Cases**:
  - [ ] TTS models: Store price per 1M characters in `audioPricing`
  - [ ] STT models: Store price per audio hour in `audioPricing`
  - [ ] Batch API: Store batch discount in `batchDiscount`
  - [ ] Cached tokens: Store cached pricing in `inputPricingCached` (future)

- [ ] **Zero-Cost Models**:
  - [ ] groq/compound, groq/compound-mini: Free (during preview)
  - [ ] deepseek-r1-distill-*: Free (during preview)
  - [ ] llava-v1.5-7b: Free
  - [ ] whisper-*: Check if still free or minimal cost

### 4. UI Model Selector Enhancements

Improve model selector to display capabilities and guide users:

- [ ] **Model Dropdown UI**:
  - [ ] Show model icon/emoji based on type:
    - 🧠 Reasoning models
    - 👁️ Vision models
    - 🎙️ Audio (STT) models
    - 🔊 Audio (TTS) models
    - 🛡️ Guard models
    - ⚡ Compound models
    - 💬 Chat models

  - [ ] Display context window in subtitle:
    - "Llama 3.3 70B Versatile"
    - "131K tokens • $0.59/$0.79 per 1M"

  - [ ] Show capability badges:
    - [Tools] [Vision] [Web Search] [Code] [Fast]

  - [ ] Group models by type:
    - Compound (recommended for complex tasks)
    - Vision
    - Reasoning
    - Chat (general purpose)
    - Audio
    - Specialized (guard, etc.)

- [ ] **Model Card/Tooltip**:
  - [ ] Hover over model → Show tooltip with:
    - Owner (e.g., "by Meta")
    - Context window
    - Capabilities (checkmarks for supported features)
    - Pricing (input/output per 1M tokens)
    - Description (if available)
    - "Learn more" link to Groq docs

- [ ] **Model Filtering**:
  - [ ] Filter by capability:
    - "Vision models only"
    - "Models with web search"
    - "Free models only"
  - [ ] Filter by price range (slider)
  - [ ] Filter by context window (min/max)
  - [ ] Search by model name or owner

- [ ] **Model Recommendations**:
  - [ ] If user uploads image → Suggest vision models
  - [ ] If user enables web search → Show only compound models
  - [ ] If user needs reasoning → Highlight reasoning models
  - [ ] If user wants free → Filter to zero-cost models

### 5. Smart Feature Auto-Disable

Automatically enable/disable settings based on selected model's capabilities:

- [ ] **Web Search Setting**:
  - [ ] If `!model.supportsWebSearch`: Disable toggle, show tooltip "Not supported by this model"
  - [ ] If model switches to non-compound: Auto-disable web search, show toast notification
  - [ ] If user tries to enable: Show error "This model doesn't support web search. Try groq/compound."

- [ ] **Code Execution Setting** (future):
  - [ ] If `!model.supportsCodeExecution`: Disable, show tooltip
  - [ ] Only enable for compound models

- [ ] **Browser Automation Setting** (future):
  - [ ] If `!model.supportsBrowserAutomation`: Disable
  - [ ] Only enable for compound models

- [ ] **Image Upload**:
  - [ ] If `!model.supportsVision`: Hide image upload component entirely
  - [ ] Show message: "Switch to a vision model to upload images"
  - [ ] Suggest vision models with button to switch

- [ ] **Tool/Function Calling** (future):
  - [ ] If `!model.supportsTools`: Disable custom tool definition
  - [ ] Show warning if user tries to use tools

- [ ] **Reasoning Display**:
  - [ ] If `model.supportsReasoning`: Auto-enable reasoning display
  - [ ] Show "Thinking..." indicator while model reasons
  - [ ] Parse `<think>` tags from response

- [ ] **Validation on Submit**:
  - [ ] Before sending request, validate:
    - If images attached → Check `supportsVision`
    - If web search enabled → Check `supportsWebSearch`
    - If tools defined → Check `supportsTools`
  - [ ] Show clear error message and suggest compatible models

### 6. Model Categorization & Grouping

Organize models into logical categories for easier discovery:

- [ ] **Model Categories**:
  - [ ] **Recommended** (top 3-5 models based on usage/quality)
    - groq/compound (best for complex tasks)
    - llama-3.3-70b-versatile (best general chat)
    - llama-4-scout-17b (best vision + speed)

  - [ ] **Compound** (AI systems with built-in tools)
    - groq/compound
    - groq/compound-mini

  - [ ] **Vision** (image understanding)
    - llama-4-maverick-17b (advanced, tools)
    - llama-4-scout-17b (fast, tools)
    - llama-3.2-90b-vision (high-performance)
    - llama-3.2-11b-vision (efficient)
    - llava-v1.5-7b (free)

  - [ ] **Reasoning** (shows thinking process)
    - deepseek-r1-distill-llama-70b (free preview)
    - deepseek-r1-distill-qwen-32b (free preview)
    - openai/gpt-oss-120b
    - openai/gpt-oss-20b
    - qwen-qwq-32b

  - [ ] **Chat** (general purpose)
    - llama-3.3-70b-versatile (flagship)
    - llama-3.1-8b-instant (fast)
    - qwen-2.5-32b
    - moonshotai/kimi-k2-instruct
    - gemma2-9b-it

  - [ ] **Audio** (speech processing)
    - whisper-large-v3 (STT)
    - whisper-large-v3-turbo (STT, faster)
    - playai-tts (TTS, English)
    - playai-tts-arabic (TTS, Arabic)

  - [ ] **Specialized** (safety, security)
    - llama-guard-4-12b (content moderation)
    - llama-prompt-guard-2-86m (prompt injection detection)
    - llama-prompt-guard-2-22m (lightweight guard)

- [ ] **Category-Based UI**:
  - [ ] Collapsible sections in dropdown (like VS Code command palette)
  - [ ] Category headers (e.g., "🌐 Compound Models (Web, Code, Tools)")
  - [ ] Search across all categories
  - [ ] Remember last category viewed

### 7. Model Metadata Display

Show comprehensive model information to users:

- [ ] **Model Info Panel** (expandable section below model selector):
  - [ ] **Overview**:
    - Name, Owner, Release Date
    - Model Type (Chat, Vision, Reasoning, etc.)
    - Status (Active, Preview, Deprecated)

  - [ ] **Capabilities**:
    - ✅ Tool Calling
    - ✅ Web Search (built-in)
    - ✅ Code Execution (Python)
    - ✅ Vision (images)
    - ❌ Browser Automation
    - ❌ Wolfram Alpha

  - [ ] **Specifications**:
    - Context Window: 131,072 tokens
    - Max Input: 120,000 tokens
    - Max Output: 8,000 tokens
    - Max Images: 5 (20MB total)

  - [ ] **Pricing**:
    - Input: $0.59 per 1M tokens
    - Output: $0.79 per 1M tokens
    - Cached Input: $0.12 per 1M tokens (if supported)
    - Batch Discount: 50% off (if supported)

  - [ ] **Performance** (optional):
    - Speed: ~150 tokens/second
    - Avg Latency: 200ms
    - Uptime: 99.9%

- [ ] **Comparison View** (future):
  - [ ] Side-by-side comparison of 2-3 models
  - [ ] Compare capabilities, pricing, performance
  - [ ] Highlight differences
  - [ ] "Switch to this model" button

### 8. Admin Model Management

Give admins control over model visibility and settings:

- [ ] **Admin Dashboard Model Tab** (extends Issue #80):
  - [ ] View all models with full metadata
  - [ ] Edit model fields:
    - Display name (custom naming)
    - Description (tooltip text)
    - isActive (show/hide from users)
    - isDeprecated (mark for removal)
    - Capabilities (manual override)
    - Pricing (manual override if API wrong)

  - [ ] Bulk operations:
    - Activate/deactivate multiple models
    - Update pricing from API (refresh)
    - Mark deprecated models

  - [ ] Model usage analytics:
    - Most popular models
    - Cost by model
    - Error rate by model
    - Avg response time by model

- [ ] **Manual Capability Override**:
  - [ ] Allow admin to manually set capabilities
  - [ ] Useful if API detection is wrong
  - [ ] Flag indicating "manually overridden"
  - [ ] Revert to auto-detected values button

- [ ] **Deprecation Workflow**:
  - [ ] Mark model as deprecated
  - [ ] Set deprecation date
  - [ ] Show warning to users: "This model will be removed on {date}"
  - [ ] Suggest alternative models
  - [ ] Automatically deactivate on deprecation date

### 9. Capability-Based Recommendations

Intelligently suggest models based on user's task:

- [ ] **Context-Aware Suggestions**:
  - [ ] If user message mentions "image", "picture", "photo" → Suggest vision models
  - [ ] If user mentions "search web", "latest", "current" → Suggest compound models
  - [ ] If user mentions "think", "reason", "explain step by step" → Suggest reasoning models
  - [ ] If user pastes code → Suggest models good at code (llama-3.3-70b, qwen-2.5-coder)

- [ ] **In-App Recommendations**:
  - [ ] "💡 Tip: Try groq/compound for web search capabilities"
  - [ ] "💡 For images, switch to llama-4-scout-17b (fast + vision)"
  - [ ] "💡 Need step-by-step reasoning? Try deepseek-r1-distill-llama-70b"

- [ ] **Model Comparison Helper**:
  - [ ] "Compare similar models" button
  - [ ] Show side-by-side: llama-3.3-70b vs llama-3.1-8b
  - [ ] Highlight: "3.1-8b is 10x faster but less accurate"

### 10. Testing & Validation

Comprehensive testing of capability detection and feature toggling:

- [ ] **Database Migration Tests**:
  - [ ] Test migration runs without errors
  - [ ] Verify all new fields have correct types
  - [ ] Test default values
  - [ ] Test indexes created successfully

- [ ] **Model Refresh Tests**:
  - [ ] Test groq.models.list() API call
  - [ ] Test capability detection for each category:
    - Compound models → all tools enabled
    - Vision models → supportsVision true
    - Reasoning models → supportsReasoning true
    - Audio models → supportsAudio true
    - Chat models → appropriate defaults
  - [ ] Test owner detection (Meta, Groq, OpenAI, etc.)
  - [ ] Test pricing sync (from API or fallback)
  - [ ] Test unknown model handling (conservative defaults)

- [ ] **UI Feature Toggle Tests**:
  - [ ] Select llama-3.3-70b → Web search disabled, tooltip shown
  - [ ] Select groq/compound → Web search enabled
  - [ ] Select llama-4-scout → Image upload shown
  - [ ] Select llama-3.1-8b → Image upload hidden
  - [ ] Upload image on chat model → Validation error shown
  - [ ] Enable web search on chat model → Auto-switch to compound (or error)

- [ ] **Model Selector UI Tests**:
  - [ ] Verify icons shown for each category
  - [ ] Verify capability badges displayed
  - [ ] Verify tooltips show correct metadata
  - [ ] Verify grouping by category works
  - [ ] Verify search filters models correctly
  - [ ] Verify price filter works

- [ ] **End-to-End Tests**:
  - [ ] Create session with compound model → Web search works
  - [ ] Create session with vision model → Image upload works
  - [ ] Create session with reasoning model → Thinking displayed
  - [ ] Switch model mid-session → Features update correctly
  - [ ] Try to use unsupported feature → Error shown

- [ ] **Performance Tests**:
  - [ ] Model refresh completes in < 5s
  - [ ] Model selector dropdown renders in < 100ms
  - [ ] Capability detection runs in < 50ms per model
  - [ ] Model metadata loads from DB in < 100ms

---

## Database Schema Updates

### Update `GroqModel` table:

```prisma
model GroqModel {
  id                      String   @id // e.g., 'llama-3.3-70b-versatile'
  displayName             String   @map("display_name")

  // Metadata
  owner                   String   @default("Unknown") // Meta, Groq, OpenAI, etc.
  modelType               String   @default("chat") @map("model_type") // chat, vision, reasoning, audio-stt, audio-tts, guard, compound
  description             String?  // User-facing description
  isDeprecated            Boolean  @default(false) @map("is_deprecated")
  deprecationDate         DateTime? @map("deprecation_date")
  releaseDate             DateTime? @map("release_date") // From API 'created' field

  // Context and Limits
  contextWindow           Int      @map("context_window")
  maxInputTokens          Int?     @map("max_input_tokens")
  maxOutputTokens         Int?     @map("max_output_tokens")
  maxImageSize            Int?     @map("max_image_size") // MB
  maxImageCount           Int?     @map("max_image_count")
  maxAudioDuration        Int?     @map("max_audio_duration") // seconds

  // Capabilities
  supportsTools           Boolean  @default(false) @map("supports_tools")
  supportsWebSearch       Boolean  @default(false) @map("supports_web_search")
  supportsCodeExecution   Boolean  @default(false) @map("supports_code_execution")
  supportsBrowserAutomation Boolean @default(false) @map("supports_browser_automation")
  supportsVisitWebsite    Boolean  @default(false) @map("supports_visit_website")
  supportsWolframAlpha    Boolean  @default(false) @map("supports_wolfram_alpha")
  supportsVision          Boolean  @default(false) @map("supports_vision")
  supportsReasoning       Boolean  @default(false) @map("supports_reasoning")
  supportsAudio           Boolean  @default(false) @map("supports_audio")
  supportsStreaming       Boolean  @default(true) @map("supports_streaming")
  supportsJsonMode        Boolean  @default(false) @map("supports_json_mode")
  supportsPromptCaching   Boolean  @default(false) @map("supports_prompt_caching")

  // Pricing
  inputPricing            Float    @map("input_pricing")
  outputPricing           Float    @map("output_pricing")
  inputPricingCached      Float?   @map("input_pricing_cached")
  audioPricing            Float?   @map("audio_pricing") // Per 1M chars (TTS) or per hour (STT)
  batchDiscount           Float?   @map("batch_discount") // e.g., 0.5 for 50% off

  // Performance (optional, future)
  avgLatencyMs            Float?   @map("avg_latency_ms")
  tokensPerSecond         Float?   @map("tokens_per_second")
  uptime                  Float?   @default(99.9)

  // Admin overrides
  capabilitiesOverridden  Boolean  @default(false) @map("capabilities_overridden")

  // Status
  isActive                Boolean  @default(true) @map("is_active")

  // Timestamps
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  @@index([modelType])
  @@index([owner])
  @@index([isActive])
  @@index([isDeprecated])
  @@map("groq_models")
}
```

---

## API Routes to Create/Modify

### Modify `/api/models/refresh/route.ts`:

**Changes**:
1. Fetch model list from `groq.models.list()`
2. Extract metadata: `id`, `owned_by`, `created`, `context_window`
3. Detect capabilities using pattern matching (see Feature 2)
4. Sync pricing from API (if available) or use `GROQ_PRICING` map
5. Categorize models into types (compound, vision, reasoning, audio, guard, chat)
6. Upsert all fields to database
7. Return detailed sync report (models added, updated, capabilities detected)

### Create `/api/models/[id]/route.ts` (Admin only):

**Endpoints**:
- `GET /api/models/[id]` - Get single model with full metadata
- `PATCH /api/models/[id]` - Update model (admin override capabilities, pricing, description)
- `DELETE /api/models/[id]` - Soft delete (set isActive = false)

### Modify `/api/models/route.ts`:

**Changes**:
1. Add query parameters:
   - `?type=vision` - Filter by modelType
   - `?capabilities=vision,tools` - Filter by capabilities
   - `?minContext=100000` - Filter by min context window
   - `?maxPrice=1.0` - Filter by max output pricing
   - `?owner=Meta` - Filter by owner
2. Return full model metadata (all fields)
3. Group models by category in response

---

## Files to Create

- `lib/model-capability-detector.ts` - Capability detection logic
  - `detectModelCapabilities(modelId: string, apiData: any): Capabilities`
  - `detectModelType(modelId: string): ModelType`
  - `detectModelOwner(modelId: string, ownedBy?: string): string`
  - `CAPABILITY_PATTERNS` - Regex patterns for each capability

- `lib/model-categories.ts` - Model categorization
  - `MODEL_CATEGORIES` - Category definitions with icons/descriptions
  - `categorizeModel(model: GroqModel): string[]`
  - `getRecommendedModels(capabilities?: string[]): GroqModel[]`

- `components/playground/model-selector-enhanced.tsx` - Enhanced model dropdown
  - Grouped by category
  - Icons and badges
  - Tooltips with metadata
  - Search and filters

- `components/playground/model-info-panel.tsx` - Model details display
  - Capabilities checklist
  - Specs (context, limits)
  - Pricing breakdown
  - Performance metrics

- `components/playground/model-recommendation.tsx` - Smart suggestions
  - Context-aware tips
  - Alternative model suggestions
  - Capability-based recommendations

- `components/admin/model-management.tsx` - Admin model editor
  - Model list with all metadata
  - Edit capabilities (override)
  - Edit pricing (override)
  - Deprecation management

---

## Files to Modify

### `prisma/schema.prisma`:
- Add all new fields to `GroqModel` (see Database Schema Updates)
- Add indexes for filtering (modelType, owner, isActive, isDeprecated)
- Run migration: `npx prisma migrate dev --name add_model_capabilities`

### `lib/groq-utils.ts`:
- Add model type enum: `export type ModelType = "chat" | "vision" | "reasoning" | "audio-stt" | "audio-tts" | "guard" | "compound"`
- Add capability interface: `export interface ModelCapabilities { supportsTools: boolean, ... }`
- Update `isVisionModel()` to use database field instead of hardcoded list
- Add `getModelCapabilities(modelId: string): Promise<ModelCapabilities>`

### `app/api/models/refresh/route.ts`:
- Implement enhanced capability detection (see Feature 2)
- Add owner detection logic
- Add model type categorization
- Add pricing sync (API or fallback)
- Return detailed sync report

### `app/page.tsx`:
- Replace simple model selector with enhanced version
- Add model info panel (expandable)
- Add feature auto-disable logic:
  - If `!model.supportsWebSearch`: Disable web search toggle
  - If `!model.supportsVision`: Hide image upload
  - If `model.supportsReasoning`: Auto-enable reasoning display
- Add validation before sending message (check capabilities)
- Add model recommendation toast notifications

### `components/playground/model-settings-modal.tsx`:
- Add capability checks for each setting
- Disable unavailable settings with tooltip
- Show warning if model doesn't support enabled features
- Add "Learn about this model" link

---

## Testing Checklist

### Database Migration:
- [ ] Migration runs without errors
- [ ] All new fields created with correct types
- [ ] Indexes created successfully
- [ ] Existing data preserved (isVision → supportsVision)
- [ ] Default values applied correctly

### Model Refresh:
- [ ] Successfully fetches models from `groq.models.list()`
- [ ] Correctly detects capabilities for:
  - [ ] groq/compound (all tools)
  - [ ] groq/compound-mini (all tools)
  - [ ] llama-4-scout-17b (vision + tools)
  - [ ] llama-4-maverick-17b (vision + tools)
  - [ ] llama-3.2-11b-vision (vision only)
  - [ ] llama-3.2-90b-vision (vision only)
  - [ ] llava-v1.5-7b (vision only)
  - [ ] deepseek-r1-distill-llama-70b (reasoning)
  - [ ] deepseek-r1-distill-qwen-32b (reasoning)
  - [ ] openai/gpt-oss-120b (reasoning)
  - [ ] whisper-large-v3 (audio STT)
  - [ ] playai-tts (audio TTS)
  - [ ] llama-guard-4-12b (guard)
  - [ ] llama-3.3-70b-versatile (chat)
- [ ] Correctly categorizes models by type
- [ ] Correctly detects owner (Meta, Groq, OpenAI, etc.)
- [ ] Pricing synced correctly (from API or fallback)
- [ ] Unknown models get conservative defaults
- [ ] Deprecated models marked correctly

### UI Model Selector:
- [ ] Models grouped by category
- [ ] Icons shown for each type
- [ ] Capability badges displayed
- [ ] Context window shown
- [ ] Pricing shown
- [ ] Tooltips show full metadata
- [ ] Search filters models
- [ ] Category filters work
- [ ] Price filter works
- [ ] "Recommended" section shows top models

### Feature Auto-Disable:
- [ ] Web search disabled for chat models
- [ ] Web search enabled for compound models
- [ ] Image upload hidden for chat models
- [ ] Image upload shown for vision models
- [ ] Reasoning display auto-enabled for reasoning models
- [ ] Tooltips explain why features are disabled
- [ ] Validation prevents sending incompatible requests

### Model Info Panel:
- [ ] Displays correct metadata
- [ ] Capabilities checklist accurate
- [ ] Specs (context, limits) shown
- [ ] Pricing breakdown correct
- [ ] Expandable/collapsible
- [ ] "Learn more" link works

### Admin Model Management:
- [ ] Model list shows all metadata
- [ ] Edit capabilities works (override)
- [ ] Edit pricing works (override)
- [ ] Deprecation workflow works
- [ ] Bulk operations work
- [ ] Usage analytics accurate

### End-to-End:
- [ ] Select compound model → Enable web search → Send message → Works
- [ ] Select vision model → Upload image → Send message → Works
- [ ] Select reasoning model → Send message → Thinking displayed
- [ ] Select chat model → Try to enable web search → Disabled/error
- [ ] Switch model mid-session → Features update correctly
- [ ] Refresh models → New models appear, capabilities detected

### Performance:
- [ ] Model refresh < 5s
- [ ] Model selector dropdown < 100ms render
- [ ] Capability detection < 50ms per model
- [ ] Model metadata load < 100ms
- [ ] No UI lag when switching models

---

## Acceptance Criteria

- [ ] Database schema updated with 25+ new fields
- [ ] All Groq models have accurate capability flags
- [ ] Model refresh detects capabilities automatically
- [ ] Pricing synced from API or fallback map
- [ ] Model selector shows grouped, categorized models
- [ ] Icons, badges, and tooltips displayed correctly
- [ ] Feature auto-disable works for all capabilities
- [ ] Validation prevents incompatible requests
- [ ] Model info panel shows comprehensive metadata
- [ ] Admin can override capabilities and pricing
- [ ] Deprecation workflow functional
- [ ] All tests passing
- [ ] No regressions in existing functionality
- [ ] Documentation updated (CLAUDE.md)

---

## Dependencies

None (uses existing libraries)

---

## Estimated Time

**Total: 16-24 hours**
- Database schema + migration: 2-3 hours
- Capability detection logic: 4-6 hours
- Model categorization: 2-3 hours
- UI enhancements (selector, info panel): 4-6 hours
- Feature auto-disable logic: 2-3 hours
- Admin model management: 2-3 hours
- Testing and validation: 3-4 hours

---

## Priority

**High** - Critical for accurate model usage and user guidance

---

## Related Issues

- Issue #70 - Parent issue (Restore Full Playground Functionality)
- Issue #71 - Phase 3 (Model settings - depends on capabilities)
- Issue #76 - Advanced AI Features (tool use, web search, code execution)
- Issue #80 - Admin Dashboard (model management tab)

---

## Notes

- This is a foundational improvement that benefits all future features
- Accurate capability detection prevents user frustration
- Smart feature toggling improves UX significantly
- Model metadata helps users make informed choices
- Admin overrides provide flexibility for edge cases
- Future-proof design accommodates new capabilities easily
