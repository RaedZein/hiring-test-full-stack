# ACTIVE PLAN: Full Stack LLM Chat Application

**Status**: IN_PROGRESS
**Started**: 2025-12-29
**Phase**: Phase 3 - Feature-Based Architecture Refactoring

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
| 4 | Project Plan Preview | ⏳ PENDING | Next commit |

---

## Current Phase: Phase 3 - Feature-Based Architecture Refactoring

### What Was Done
- ✅ Moved queries/mutations to `features/chat/api/` and `features/models/api/`
- ✅ Moved hooks to `features/chat/hooks/`
- ✅ Moved ModelSelector to `features/models/components/`
- ✅ Created feature-based folder structure

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
