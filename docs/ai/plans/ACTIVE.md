# ACTIVE PLAN: Full Stack LLM Chat Application

**Status**: IN_PROGRESS
**Started**: 2025-12-29
**Phase**: Phase 1 - Foundation (Types & Infrastructure)

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

| Phase | Task | Status | Files | Notes |
|-------|------|--------|-------|-------|
| 1 | Copy plan to ACTIVE.md | Γ£à DONE | `docs/ai/plans/ACTIVE.md` | Current file |
| 1 | Fetch library docs (Context7) | ≡ƒöä IN PROGRESS | - | TanStack Query, Anthropic SDK, Fastify, Streamdown |
| 1 | Install backend deps | ΓÅ│ PENDING | `server/package.json` | @anthropic-ai/sdk, openai, @google/generative-ai, dotenv, zod |
| 1 | Install frontend deps | ΓÅ│ PENDING | `web/package.json` | streamdown, sonner, shadcn components |
| 1 | Create backend types | ΓÅ│ PENDING | `server/src/types.ts` | All shared types |
| 1 | Create frontend types | ΓÅ│ PENDING | `web/src/types/chat.ts` | Mirror backend types |
| 1 | Update Tailwind config | ΓÅ│ PENDING | `web/src/index.css` | Add Streamdown source |
| 1 | Create .env.example | ΓÅ│ PENDING | `server/.env.example` | API keys template |
| 1 | Verify TS compilation | ΓÅ│ PENDING | Both projects | `npm run build:ts` |

---

## Current Phase: Phase 1 - Foundation

### Objectives
- Establish shared type definitions between backend and frontend
- Install all required dependencies
- Configure Tailwind for Streamdown
- Create environment variable template

### Files to Create (Phase 1)
- `server/src/types.ts` - Backend types
- `web/src/types/chat.ts` - Frontend types (mirrored)
- `server/.env.example` - Environment template

### Files to Modify (Phase 1)
- `server/package.json` - Add dependencies
- `web/package.json` - Add dependencies
- `web/src/index.css` - Add Streamdown Tailwind source

---

## Commit Strategy

**Current Commit (Prepared for Phase 1)**:
```
feat: setup foundation - types, deps, and Tailwind config

- Add shared type definitions (Message, Chat, LLMModel, LLMStreamChunk, ProjectPlan)
- Install backend dependencies (@anthropic-ai/sdk, openai, @google/generative-ai, dotenv, zod)
- Install frontend dependencies (streamdown, sonner, shadcn/ui components)
- Configure Tailwind to use Streamdown styles
- Create .env.example template for API keys
- Mirror types between server/src/types.ts and web/src/types/chat.ts

Files:
  server/src/types.ts
  web/src/types/chat.ts
  server/package.json
  server/package-lock.json
  web/package.json
  web/package-lock.json
  web/src/index.css
  server/.env.example
```

---

## Reference Documentation

- **Master Plan**: `.claude/plans/fancy-questing-koala.md`
- **Architecture**: `docs/ai/ARCHITECTURE.md`
- **Patterns**: `.cursor/rules/backend.mdc`, `.cursor/rules/frontend.mdc`
- **Commands**: `docs/ai/runbook/COMMANDS.md`
