# Target Architecture

> This document describes the target file structure and architecture after implementing all features.
> Use this as a reference when starting from init state.

## File Structure (Target State)

### Backend (`server/src/`)

```
server/src/
Γö£ΓöÇΓöÇ app.ts                       # Fastify app with autoload, SSE timeouts
Γö£ΓöÇΓöÇ server.ts                    # Server entry point with dotenv
Γö£ΓöÇΓöÇ types.ts                     # Shared type definitions
Γöé
Γö£ΓöÇΓöÇ domain/
Γöé   ΓööΓöÇΓöÇ test-users.ts           # Test user definitions
Γöé
Γö£ΓöÇΓöÇ plugins/
Γöé   Γö£ΓöÇΓöÇ cors.ts                 # CORS configuration
Γöé   Γö£ΓöÇΓöÇ sensible.ts             # HTTP helpers (@fastify/sensible)
Γöé   ΓööΓöÇΓöÇ support.ts              # Auth plugin (userId injection)
Γöé
Γö£ΓöÇΓöÇ providers/llm/
Γöé   Γö£ΓöÇΓöÇ types.ts                # LLMProvider interface
Γöé   Γö£ΓöÇΓöÇ anthropic.provider.ts  # Anthropic implementation
Γöé   Γö£ΓöÇΓöÇ openai.provider.ts     # OpenAI implementation
Γöé   Γö£ΓöÇΓöÇ gemini.provider.ts     # Gemini implementation
Γöé   Γö£ΓöÇΓöÇ custom.provider.ts     # Custom OpenAI-compatible
Γöé   Γö£ΓöÇΓöÇ index.ts               # Factory + cache
Γöé   Γö£ΓöÇΓöÇ model-config.ts        # User model configuration
Γöé   Γö£ΓöÇΓöÇ user-config.ts         # Per-user API keys
Γöé   ΓööΓöÇΓöÇ model-cache.ts         # Model list caching
Γöé
Γö£ΓöÇΓöÇ repositories/
Γöé   ΓööΓöÇΓöÇ chat.repository.ts     # Data access layer (Map-based)
Γöé
Γö£ΓöÇΓöÇ services/
Γöé   ΓööΓöÇΓöÇ chat.service.ts        # Business logic + ChatError
Γöé
ΓööΓöÇΓöÇ routes/
    Γö£ΓöÇΓöÇ root.ts                # GET /
    Γö£ΓöÇΓöÇ user/
    Γöé   ΓööΓöÇΓöÇ index.ts           # GET /user
    Γö£ΓöÇΓöÇ chat/
    Γöé   ΓööΓöÇΓöÇ index.ts           # Chat CRUD + streaming
    ΓööΓöÇΓöÇ config/
        ΓööΓöÇΓöÇ index.ts           # Provider/model configuration
```

### Frontend (`web/src/`)

```
web/src/
Γö£ΓöÇΓöÇ App.tsx                     # ErrorBoundary, QueryClient, Router
Γö£ΓöÇΓöÇ index.tsx                   # React entry point
Γö£ΓöÇΓöÇ index.css                   # Tailwind + semantic tokens
Γöé
Γö£ΓöÇΓöÇ types/
Γöé   Γö£ΓöÇΓöÇ chat.ts                # Mirrors server/src/types.ts
Γöé   ΓööΓöÇΓöÇ project-plan.ts        # ProjectPlan interface
Γöé
Γö£ΓöÇΓöÇ lib/
Γöé   Γö£ΓöÇΓöÇ utils.ts               # cn() utility
Γöé   Γö£ΓöÇΓöÇ constants.ts           # STORAGE_KEYS, API_CONFIG
Γöé   Γö£ΓöÇΓöÇ color-scheme.tsx       # Dark mode context
Γöé   ΓööΓöÇΓöÇ parseProjectPlan.ts   # Extract JSON from markdown
Γöé
Γö£ΓöÇΓöÇ data/
Γöé   Γö£ΓöÇΓöÇ client.ts              # Axios instance
Γöé   Γö£ΓöÇΓöÇ queryKeys.ts           # Centralized query keys
Γöé   ΓööΓöÇΓöÇ queries/
Γöé       Γö£ΓöÇΓöÇ user.ts            # useUserQuery
Γöé       Γö£ΓöÇΓöÇ chat.ts            # useChatsQuery, useMessagesQuery, mutations
Γöé       Γö£ΓöÇΓöÇ config.ts          # useConfigQuery
Γöé       ΓööΓöÇΓöÇ models.ts          # useModelsQuery, API key mutations
Γöé
Γö£ΓöÇΓöÇ hooks/
Γöé   Γö£ΓöÇΓöÇ useChat.ts             # Main orchestration hook
Γöé   ΓööΓöÇΓöÇ useStreamingMessage.ts # SSE consumer
Γöé
Γö£ΓöÇΓöÇ components/
Γöé   Γö£ΓöÇΓöÇ navbar.tsx
Γöé   Γö£ΓöÇΓöÇ chat-sidebar.tsx       # Chat list with "New Chat" button
Γöé   Γö£ΓöÇΓöÇ chat-input-box.tsx     # Input with streaming controls
Γöé   Γö£ΓöÇΓöÇ message.tsx            # MessageContainer, MessageContent
Γöé   Γöé
Γöé   Γö£ΓöÇΓöÇ chat/
Γöé   Γöé   Γö£ΓöÇΓöÇ ModelSelector.tsx           # Provider/model dropdown
Γöé   Γöé   Γö£ΓöÇΓöÇ ProjectPlanPreview.tsx      # Accordion with Motion
Γöé   Γöé   Γö£ΓöÇΓöÇ ProjectPlanSkeleton.tsx     # Loading state
Γöé   Γöé   ΓööΓöÇΓöÇ ProviderConfigDialog.tsx    # API key config
Γöé   Γöé
Γöé   ΓööΓöÇΓöÇ ui/                     # shadcn components
Γöé       Γö£ΓöÇΓöÇ button.tsx
Γöé       Γö£ΓöÇΓöÇ input.tsx
Γöé       Γö£ΓöÇΓöÇ select.tsx
Γöé       Γö£ΓöÇΓöÇ accordion.tsx
Γöé       Γö£ΓöÇΓöÇ tabs.tsx
Γöé       Γö£ΓöÇΓöÇ dialog.tsx
Γöé       Γö£ΓöÇΓöÇ spinner.tsx
Γöé       ΓööΓöÇΓöÇ ...
Γöé
ΓööΓöÇΓöÇ pages/
    ΓööΓöÇΓöÇ home-page.tsx          # Main chat interface
```

---

## Key Architectural Patterns

### Backend: Clean Architecture

```
Routes (HTTP) ΓåÆ Services (Business Logic) ΓåÆ Repositories (Data Access)
                     Γåô
              Providers (External: LLM)
```

**Dependencies point inward**: Routes depend on Services, Services depend on Repositories.

### Frontend: Composable Hooks

```
HomePage ΓåÆ useChat (orchestration)
             Γåô
        Γö£ΓöÇΓöÇ useChatsQuery (TanStack Query)
        Γö£ΓöÇΓöÇ useMessagesQuery (TanStack Query)
        Γö£ΓöÇΓöÇ useCreateChatMutation (TanStack Query)
        ΓööΓöÇΓöÇ useStreamingMessage (SSE consumer)
```

### LLM Provider: Strategy Pattern

```
getProvider() ΓåÆ Factory ΓåÆ AnthropicProvider
                       ΓåÆ OpenAIProvider
                       ΓåÆ GeminiProvider
                       ΓåÆ CustomProvider

All implement LLMProvider interface
```

---

## Data Flow Diagrams

### Chat Message Flow

```
User types message
  Γåô
useChat.sendMessage()
  Γåô
useStreamingMessage.sendMessage()
  Γåô
POST /chat/stream (SSE)
  Γåô
chatService.addMessage() [user message]
  Γåô
getProvider() ΓåÆ provider.streamResponse()
  Γåô
SSE chunks: connected ΓåÆ text ΓåÆ text ΓåÆ ... ΓåÆ done
  Γåô
Frontend accumulates chunks
  Γåô
chatService.addMessage() [assistant message]
  Γåô
queryClient.invalidateQueries() [refetch messages]
  Γåô
UI updates with saved message
```

### Provider Switching Flow

```
User selects model in ModelSelector
  Γåô
useChat.setSelectedModel(model)
  Γåô
localStorage.setItem('chat-selected-model', model)
  Γåô
useStreamingMessage receives new model
  Γåô
Next message uses selected model
  Γåô
POST /chat/stream with { model: 'selected-model' }
  Γåô
getProvider() resolves to correct provider
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
| StreamChatRequest | `server/src/types.ts` | `web/src/types/chat.ts` |

**Workflow**: Update backend ΓåÆ Mirror to frontend ΓåÆ Grep usages ΓåÆ Update handlers ΓåÆ Build both

---

## Feature Checklist

### Core Requirements
- [ ] Chat CRUD (create, list, get, delete)
- [ ] Message persistence
- [ ] LLM streaming responses
- [ ] Multiple LLM providers (Anthropic, OpenAI, Gemini)
- [ ] Provider switching
- [ ] Chat history persistence

### Bonus Features
- [ ] Model selector UI
- [ ] Project plan detection + parsing
- [ ] Project plan accordion preview
- [ ] Provider configuration dialog
- [ ] Custom LLM support

### Quality Requirements
- [ ] TypeScript strict mode
- [ ] Error boundaries
- [ ] Loading states
- [ ] Error handling
- [ ] Motion animations
- [ ] Dark mode support
- [ ] Responsive design (not required but nice)

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

