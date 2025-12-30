# Target Architecture

> This document describes the target file structure and architecture after implementing all features.
> Use this as a reference when starting from init state.

## File Structure (Target State)

### Backend (`server/src/`)

```
server/src/
├── app.ts                       # Fastify app with autoload, SSE timeouts
├── types.ts                     # Shared type definitions
│
├── domain/
│   └── test-users.ts           # Test user definitions
│
├── plugins/
│   ├── cors.ts                 # CORS configuration
│   ├── sensible.ts             # HTTP helpers (@fastify/sensible)
│   └── support.ts              # Auth plugin (userId injection)
│
├── providers/llm/
│   ├── types.ts                # LLMProvider interface
│   ├── anthropic.provider.ts  # Anthropic implementation
│   ├── openai.provider.ts     # OpenAI implementation
│   ├── gemini.provider.ts     # Gemini implementation
│   ├── custom.provider.ts     # Custom OpenAI-compatible
│   ├── system-prompts.ts      # System prompt definitions
│   └── index.ts               # Factory + provider cache
│
├── repositories/
│   └── chat.repository.ts     # Data access layer (persistent storage)
│
├── services/
│   ├── chat.service.ts        # Business logic + ChatError
│   ├── llm-config.service.ts  # LLM config, API keys, model cache (all-in-one)
│   └── storage.service.ts     # Generic JSON file storage utilities
│
└── routes/
    ├── root.ts                # GET /
    ├── user/
    │   └── index.ts           # GET /user
    ├── chats/
    │   └── index.ts           # Chat CRUD + streaming (/chats endpoints)
    └── models/
        └── index.ts           # Models listing + unified config endpoint
```

### Frontend (`web/src/`) - Feature-Based Architecture

```
web/src/
├── App.tsx                     # ErrorBoundary, QueryClient, Router
├── index.tsx                   # React entry point
├── index.css                   # Tailwind + semantic tokens
│
├── features/                   # ✨ FEATURE-BASED ORGANIZATION
│   ├── chat/                   # Chat feature (TO BE MIGRATED - see CHAT_FEATURE_MIGRATION_PLAN.md)
│   │   ├── components/
│   │   │   ├── chat-sidebar.tsx
│   │   │   ├── chat-input-box.tsx
│   │   │   ├── chat-message-list.tsx
│   │   │   ├── message.tsx
│   │   │   ├── message-content.tsx
│   │   │   └── typing-indicator.tsx
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   └── useSelectedChat.ts
│   │   ├── api/
│   │   │   ├── queries.ts          # chatsOptions, useChatsQuery
│   │   │   └── mutations.ts        # useCreateChatMutation, useDeleteChatMutation
│   │   ├── types.ts                # Chat, Message, ChatSummary, LLMStreamChunk
│   │   └── index.ts                # Barrel exports
│   │
│   ├── models/                 # ✅ COMPLETE
│   │   ├── components/
│   │   │   ├── model-selector.tsx
│   │   │   └── api-key-config-dialog.tsx
│   │   ├── api/
│   │   │   ├── queries.ts          # modelsOptions, useModelsQuery
│   │   │   └── mutations.ts        # Provider mutations
│   │   ├── types.ts                # LLMProviderType, LLMModel, ModelsResponse
│   │   └── index.ts                # Barrel exports
│   │
│   └── project-plan/           # ✅ COMPLETE
│       ├── components/
│       │   ├── project-plan-preview.tsx    # Accordion with expand/collapse all
│       │   └── project-plan-skeleton.tsx   # Loading shimmer
│       ├── lib/
│       │   └── plan-parser.ts              # JSON extraction + validation
│       ├── types.ts                         # ProjectPlan, Workstream, Deliverable
│       └── index.ts                         # Barrel exports
│
├── components/                 # ✨ SHARED COMPONENTS ONLY
│   ├── layout/
│   │   ├── navbar.tsx
│   │   └── error-fallback.tsx
│   ├── skeletons/
│   │   └── message-skeleton.tsx
│   └── ui/                     # shadcn primitives
│       ├── button.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── accordion.tsx
│       ├── tabs.tsx
│       ├── dialog.tsx
│       ├── badge.tsx
│       ├── form.tsx
│       └── ...
│
├── lib/                        # ✨ SHARED UTILITIES ONLY
│   ├── utils.ts                # cn() utility
│   ├── query-client.ts         # TanStack Query configuration
│   ├── api-client.ts           # Axios instance
│   ├── error-utils.ts          # Error message extraction
│   └── color-scheme.tsx        # Dark mode context
│
├── data/                       # ✨ GLOBAL DATA LAYER (minimal)
│   ├── client.ts               # Axios instance (used by all features)
│   ├── query-keys.ts           # Global query keys (deprecated - features own their keys)
│   └── query-options.ts        # Global query options (deprecated - moved to features)
│
├── types/                      # ✨ GLOBAL TYPES ONLY
│   └── common.ts               # User type (shared across features)
│
└── pages/
    └── home-page.tsx           # Main chat interface
```

### Feature-Based Architecture Rules

**Code Organi zation:**
- Each feature is **self-contained** with its own components, hooks, API, and types
- **Shared code** only goes in top-level folders (`components/`, `lib/`, `types/`)
- **Rule of 3**: Extract to shared only when used by 3+ features

**Import Patterns:**
```typescript
// ✅ Feature imports from own folder
import { useChat } from '../hooks/useChat';

// ✅ Import from other features
import { ModelSelector, useModelsQuery } from '../features/models';

// ✅ Import shared components
import { Button } from '../components/ui/button';

// ❌ Don't reach into other feature internals
import { ChatMessage } from '../../chat/components/message';
```

**Benefits:**
- **Easier navigation**: Everything for a feature in one place
- **Easier deletion**: Remove entire feature folder
- **Clearer ownership**: Feature boundaries are explicit
- **Better scalability**: Features can be developed independently

---

## Key Architectural Patterns

### Backend: Clean Architecture

```
Routes (HTTP) → Services (Business Logic) → Repositories (Data Access)
                     ↓
              Providers (External: LLM)
```

**Dependencies point inward**: Routes depend on Services, Services depend on Repositories.

### Frontend: Composable Hooks

```
HomePage → useChat (orchestration + SSE streaming)
             ↓
        ├── useChatsQuery (TanStack Query) - List chat summaries
        ├── useChatQuery (TanStack Query) - Get full chat with messages
        ├── useCreateChatMutation (TanStack Query)
        └── useSelectedChat - Selected chat persistence (localStorage)
```

### LLM Provider: Strategy Pattern

```
getProvider() → Factory → AnthropicProvider
                       → OpenAIProvider
                       → GeminiProvider
                       → CustomProvider (OpenAI-compatible)

All implement LLMProvider interface
```

**Custom Provider**: Supports any OpenAI-compatible API endpoint with configurable base URL, API key, model ID, and custom headers.

---

## Data Flow Diagrams

### Chat Message Flow

```
User types message
  ↓
useChat.sendMessage()
  ↓
useStreamingMessage.sendMessage()
  ↓
POST /chats/:id/stream (SSE)
  ↓
chatRepository.addMessage() [user message]
  ↓
getProvider() → provider.streamCompletion()
  ↓
SSE chunks: connected → text → text → ... → done
  ↓
Frontend accumulates chunks
  ↓
chatRepository.addMessage() [assistant message]
  ↓
queryClient.invalidateQueries() [refetch messages]
  ↓
UI updates with saved message
```

### Provider Switching Flow

```
User selects model in ModelSelector
  ↓
useChat receives new modelId (local state)
  ↓
PUT /models/config with { type: 'setUserConfig', provider, modelId }
  ↓
llmConfigService.setUserConfig() saves preference
  ↓
Next message uses selected model
  ↓
POST /chats/:id/stream with { modelId: 'selected-model' }
  ↓
getProvider() resolves to correct provider based on modelId
```

---

## Type Synchronization

### Critical Types (Must Mirror)

| Type | Backend | Frontend |
|------|---------|----------|
| MessageRole | `server/src/types.ts` | `web/src/types/chat.ts` |
| Message | `server/src/types.ts` | `web/src/types/chat.ts` |
| Chat | `server/src/types.ts` | `web/src/types/chat.ts` |
| LLMProviderType | `server/src/types.ts` | `web/src/types/chat.ts` |
| LLMStreamChunk | `server/src/types.ts` | `web/src/types/chat.ts` |
| StreamMessageRequest | `server/src/types.ts` | `web/src/types/chat.ts` |

**Workflow**: Update backend → Mirror to frontend → Grep usages → Update handlers → Build both

---

## Feature Checklist

### Core Requirements
- [x] Chat CRUD (create, list, get, delete)
- [x] Message persistence
- [x] LLM streaming responses
- [x] Multiple LLM providers (Anthropic, OpenAI, Gemini, Custom)
- [x] Provider switching
- [x] Chat history persistence

### Bonus Features
- [x] Model selector UI
- [x] Project plan detection + parsing
- [x] Project plan accordion preview
- [x] Provider configuration dialog
- [x] Custom LLM support (OpenAI-compatible)

### Quality Requirements
- [ ] TypeScript strict mode
- [ ] Error boundaries
- [ ] Loading states
- [ ] Error handling
- [ ] Motion animations
- [ ] Dark mode support
- [ ] Responsive design (not required but nice)

---

## Configuration Architecture

### Critical Rules

**❌ NO HARDCODED MODEL LISTS** - All models MUST be fetched from provider APIs:
- **Anthropic**: `client.models.list()` → GET /v1/models
- **OpenAI**: `client.models.list()` → GET /models
- **Gemini**: `client.models.list()` → OpenAI-compatible endpoint

**✅ ONLY Provider Names Hardcoded**: `type LLMProviderType = 'anthropic' | 'openai' | 'gemini' | 'custom'`

### Storage Structure

**Note**: Current implementation uses global storage (single-user mode). Future multi-user support would require per-user storage.

```
server/data/
├── llm-config.json          # Global LLM configuration (API keys, model cache, user preferences)
└── chats.json               # All chats (persistent storage)
```

**Storage Details**:
- `llm-config.json`: Contains encrypted API keys, cached model lists, selected provider/model
- `chats.json`: All chat data with messages (persistent across server restarts)
- Files are stored in `server/data/` directory (gitignored)

### Environment Variables

```bash
# Optional: Default provider configuration (used for initialization)
DEFAULT_LLM_PROVIDER=anthropic        # System default provider
DEFAULT_API_KEY=<key>                 # Default API key (if provided)
DEFAULT_BASE_URL=<url>                # For custom provider
DEFAULT_MODEL=<model-id>              # Default model ID

# API Key Encryption
API_KEYS_SECRET=<secret>              # Secret for encryption (defaults to dev secret if not set)

# System API Keys (optional, can be configured via UI)
ANTHROPIC_API_KEY=<key>
OPENAI_API_KEY=<key>
GOOGLE_AI_API_KEY=<key>
```

**Note**: Environment variables are optional. API keys can be configured via the UI, and the system will initialize from env vars if no config file exists.

### API Key Encryption

- **Algorithm**: AES-256-GCM
- **Key Derivation**: scrypt from `API_KEYS_SECRET` (32-byte key)
- **Storage**: `server/data/llm-config.json` (global storage)
- **Format**: Encrypted strings stored in config object (encrypted format: `iv:authTag:data`)

### Model Caching

- **Storage**: Model lists cached in `llm-config.json` with `lastFetched` timestamps
- **Behavior**: Models are cached indefinitely until manually refreshed (no automatic TTL expiration)
- **Invalidation**: Manual refresh via API key update or cache clear
- **Graceful Degradation**: Cached models are served if available, even if stale

### Configuration Endpoints

```typescript
GET  /models                         // List all models from all providers + status
PUT  /models/config                  // Unified config endpoint (type-based discriminator)
```

**Unified Config Endpoint** (`PUT /models/config`):
- Uses type discriminator pattern in request body
- Supported types:
  - `{ type: 'setApiKey', provider, apiKey }` - Set API key for standard provider
  - `{ type: 'deleteApiKey', provider }` - Delete API key for provider
  - `{ type: 'setCustomProvider', baseUrl, apiKey, modelId, modelName, customHeaders? }` - Configure custom provider
  - `{ type: 'deleteCustomProvider' }` - Remove custom provider
  - `{ type: 'setUserConfig', provider, modelId }` - Set user preferences (selected provider/model)

### Provider Model APIs

**Anthropic:**
```typescript
const response = await client.models.list();
// → { data: [{ id, display_name, created_at, ... }] }
```

**OpenAI:**
```typescript
const response = await client.models.list();
// → { data: [{ id, created, owned_by, ... }] }
```

**Gemini (OpenAI-compatible):**
```typescript
const client = new OpenAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});
const response = await client.models.list();
// → { data: [{ id, created, owned_by: "google", ... }] }
```

**Custom Provider (OpenAI-compatible):**
```typescript
const client = new OpenAI({
  baseURL: '<custom-base-url>',
  apiKey: '<custom-api-key>',
  defaultHeaders: { /* custom headers */ }
});
const response = await client.models.list();
// → { data: [{ id, created, owned_by, ... }] }
```

Supports any OpenAI-compatible API endpoint with optional custom headers.

---

## Dependencies to Install

### Backend
```bash
cd server
npm install @anthropic-ai/sdk openai @google/generative-ai dotenv
```

### Frontend
```bash
cd web
npm install motion streamdown sonner react-error-boundary @uidotdev/usehooks
npx shadcn@latest add accordion select tabs
```

---

This architecture document serves as a reference for AI agents starting from init state to understand what the final implementation should look like.

