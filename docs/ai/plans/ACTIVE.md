# ACTIVE PLAN: Full Stack LLM Chat Application

**Status**: IN_PROGRESS
**Started**: 2025-12-29
**Phase**: Phase 6 - Stream Manager Service

---

## Overview
Build a full-stack LLM chat application with:
- Multi-provider LLM support (Anthropic/OpenAI/Gemini)
- Persistent chat history with Server-Sent Events (SSE) streaming
- Inline project plan previews (collapsible workstreams/deliverables)
- Model selector UI (bonus feature)
- Streamdown-powered markdown rendering

## Key Decisions
| Decision | Choice |
|----------|--------|
| Primary LLM | **Anthropic Claude** (claude-sonnet-4-20250514) |
| Plan Format | **Fenced code block** (```project-plan with JSON) |
| Model Selector | **Yes** (bonus feature) |
| Chat Titles | **Auto-generate** from first message (~30 chars) |
| Markdown Renderer | **Streamdown** (Vercel) for streaming support |

---

## Implementation Progress Log

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1 | Foundation & Types | ✅ DONE | Types, deps, Tailwind config |
| 2 | Backend Implementation | ✅ DONE | Providers, services, routes |
| 3 | Frontend Components | ✅ DONE | Components, hooks, React Query |
| 3 | Feature Refactoring | ✅ DONE | Migrated to features/ structure |
| 4 | Project Plan Preview | ✅ DONE | Added project-plan feature with streaming |
| 5 | LLM Config Service | ✅ DONE | Centralized API key management |
| 6 | Stream Manager | ✅ DONE | Multi-subscriber SSE streaming |
| 7 | Final Polish | ⏳ PENDING | Next commit |

---

## Current Phase: Phase 6 - Stream Manager Service

### What Was Done
- ✅ Added `stream-manager.service.ts` for multi-subscriber SSE streams
- ✅ Added `custom.provider.ts` for custom LLM provider support
- ✅ Added `features/chat/api/streaming.ts` for client-side streaming
- ✅ Removed singular `/chat` route (merged into `/chats`)
- ✅ Updated `/chats` route to use stream manager
- ✅ Integrated custom provider into LLM provider index

### Files Reorganized
- `web/src/data/queries/chats.ts` → `web/src/features/chat/api/queries.ts`
- `web/src/data/mutations/chats.ts` → `web/src/features/chat/api/mutations.ts`
- `web/src/data/queries/models.ts` → `web/src/features/models/api/queries.ts`
- `web/src/hooks/useChat.ts` → `web/src/features/chat/hooks/useChat.ts`
- `web/src/hooks/useStreamingMessage.ts` → `web/src/features/chat/hooks/useStreamingMessage.ts`
- `web/src/components/model-selector.tsx` → `web/src/features/models/components/ModelSelector.tsx`

### Next Steps
- Add project plan preview feature
- Complete component migration
- Add LLM configuration service
