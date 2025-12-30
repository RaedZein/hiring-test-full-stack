# Tekkr Full Stack Hiring Challenge

_👋 Welcome to this full stack hiring challenge! ✨_

## Solution Overview

This document outlines the complete implementation of the LLM-based chat application with all required features and bonus functionality.

### ✅ Implemented Features

**Core Requirements:**
- ✅ LLM-based chat interface with streaming responses (Server-Sent Events)
- ✅ Multi-chat management (create, switch, delete chats)
- ✅ Persistent chat history across page reloads
- ✅ Inline project plan previews (collapsible workstreams/deliverables)
- ✅ Error handling and loading states
- ✅ Multi-provider LLM support (Anthropic, OpenAI, Gemini, Custom)

**Bonus Features:**
- ✅ Visual model selector UI with dynamic model fetching
- ✅ API key configuration dialog for each provider
- ✅ Custom OpenAI-compatible provider support (e.g., OpenRouter, Ollama)
- ✅ Real-time streaming with connection management

---

## Architecture & Approach

### System Architecture

The application follows **clean architecture** principles with clear separation of concerns:

```
Frontend (React)          Backend (Fastify)
├── Features/            ├── Routes/        (HTTP handlers)
│   ├── chat/           ├── Services/      (Business logic)
│   ├── models/         ├── Repositories/  (Data access)
│   └── project-plan/   └── Providers/     (LLM integration)
```

### Key Design Decisions

1. **Strategy Pattern for LLMs**: All providers implement a common `LLMProvider` interface, making it trivial to swap providers
2. **Feature-Based Frontend**: Organized by domain features rather than technical layers for better maintainability
3. **Type-First Development**: Shared types between frontend/backend ensure type safety end-to-end
4. **File-Based Storage**: JSON files in `server/data/` for persistence (no database required)
5. **SSE Streaming**: Server-Sent Events for real-time response streaming with reconnection support

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript 5.8, React Router 6, TanStack Query v5 |
| **UI Components** | shadcn/ui (Radix), Tailwind CSS 3, Motion (animations) |
| **Backend** | Fastify 5, TypeScript, Node.js |
| **LLM SDKs** | Anthropic SDK, OpenAI SDK, Google Generative AI |
| **Markdown** | Streamdown (streaming markdown renderer) |

---

## Development Process

### AI-Assisted Development Workflow

This solution was built using **AI coding assistants** (Cursor + Claude Code) with structured development guidelines:

#### 1. Agent Guidelines & Rules

- **Centralized Planning**: All agents use `docs/ai/plans/ACTIVE.md` as single source of truth
- **Structured Rules**: `.cursor/rules/` directory with patterns for frontend, backend, planning, and structure
- **Type Safety**: Strict TypeScript with exhaustive type checking (no `any`, no `@ts-ignore`)

#### 2. MCP (Model Context Protocol) Tools

**Serena MCP** - Code intelligence and navigation:
- Symbol-level code understanding (`find_symbol`, `find_referencing_symbols`)
- Pattern search across codebase
- Used for understanding existing patterns and maintaining consistency

**Context7 MCP** - Library documentation:
- Real-time docs for TanStack Query, Fastify, SDKs
- Fallback to web search when MCP unavailable

**RepoMapper** - Repository mapping:
- Generated `docs/ai/maps/REPO_MAP.md` for navigation
- Python script fallback for structure visualization

#### 3. Documentation-Driven Development

- **ARCHITECTURE.md**: Target file structure and data flows
- **AGENTS.md**: Guidelines for AI assistants (planning protocol, code standards)
- **COMMANDS.md**: Build/test/quality commands
- **Plans/ACTIVE.md**: Implementation progress tracking with commit logs

#### 4. Development Workflow

```
1. Read ACTIVE.md plan
2. Generate repo map for navigation
3. Use Serena MCP for code understanding
4. Implement feature following architecture patterns
5. Update plan with progress
6. Verify TypeScript compilation (server & web)
7. Commit with descriptive messages
```

---

## Implementation Details

### Feature Implementation Details

#### 1. Multi-Provider LLM Architecture

**Backend** (`server/src/providers/llm/`):
- Abstract `LLMProvider` interface with `streamCompletion()` and `listModels()` methods
- Provider implementations: `AnthropicProvider`, `OpenAIProvider`, `GeminiProvider`, `CustomProvider`
- Factory pattern with caching to avoid redundant initialization
- Unified configuration via `llm-config.service.ts` with encrypted API key storage

**Configuration Flow**:
```
User provides API key → Encrypted storage (AES-256-GCM) → Provider initialization → Model listing
```

#### 2. Chat Management

**Backend** (`server/src/routes/chats/index.ts`):
- `POST /chats` - Create new chat
- `GET /chats` - List all chats for user
- `GET /chats/:id` - Get chat with messages
- `DELETE /chats/:id` - Delete chat
- `POST /chats/:id/stream` - SSE streaming endpoint

**Frontend** (`web/src/features/chat/`):
- `useChat` hook manages chat state and message sending
- `useSelectedChat` hook persists selected chat ID in localStorage
- React Query for caching and optimistic updates
- Real-time streaming with chunk accumulation

#### 3. Project Plan Preview

**Detection**: System prompt instructs LLM to output plans in fenced code blocks:
````markdown
```project-plan
{ "workstreams": [...] }
```
````

**Parsing** (`web/src/features/project-plan/lib/plan-parser.ts`):
- Regex extraction of JSON from markdown
- Zod schema validation
- Type-safe parsing to `ProjectPlan` type

**Display** (`web/src/features/project-plan/components/project-plan-preview.tsx`):
- Collapsible accordion UI with expand/collapse all
- Inline rendering within message content
- Streaming support (plan appears as it's generated)

#### 4. Model Selector & Configuration

**Backend** (`server/src/routes/models/index.ts`):
- `GET /models` - List available models from all configured providers
- `POST /models/providers/:provider` - Set API key for provider
- `DELETE /models/providers/:provider` - Remove provider configuration
- `POST /models/config` - Set user's selected provider/model

**Frontend** (`web/src/features/models/`):
- `ModelSelector` component displays available models grouped by provider
- `ApiKeyConfigDialog` allows entering API keys for each provider
- Model selection persists across sessions

#### 5. Streaming & Connection Management

**Stream Manager** (`server/src/services/stream-manager.service.ts`):
- Multi-subscriber support for SSE streams
- Connection lifecycle management (connect, disconnect, error)
- Automatic cleanup on client disconnect

**Frontend Streaming** (`web/src/features/chat/api/streaming.ts`):
- EventSource API for SSE connection
- Chunk accumulation and state management
- Reconnection support with exponential backoff

---

## Configuration

### Environment Variables

See `server/.env.example` for required configuration:

- `DEFAULT_LLM_PROVIDER` - Default provider (anthropic/openai/gemini/custom)
- `DEFAULT_API_KEY` - Default API key for provider
- `DEFAULT_BASE_URL` - Base URL for custom provider (optional)
- `DEFAULT_MODEL` - Default model ID (optional)
- `API_KEYS_SECRET` - Encryption secret for stored API keys (optional, has dev fallback)
- `PORT` - Server port (default: 8000)
- `NODE_ENV` - Environment (development/production)

### Development Scripts

- `dev.sh` / `dev.bat` - Start both frontend and backend concurrently
- `npm start` - Individual directory start commands

---

## File Structure Highlights

```
server/src/
├── providers/llm/          # LLM provider implementations (Strategy Pattern)
├── services/
│   ├── chat.service.ts     # Business logic
│   ├── llm-config.service.ts  # API key & config management
│   └── stream-manager.service.ts  # SSE connection management
├── repositories/
│   └── chat.repository.ts  # File-based data access
└── routes/                 # Fastify route handlers

web/src/
├── features/               # Feature-based organization
│   ├── chat/              # Chat UI and logic
│   ├── models/            # Model selector & config
│   └── project-plan/      # Plan preview components
├── components/ui/          # shadcn/ui components
└── data/                   # React Query setup
```

---

## Key Achievements

1. ✅ **Easy Provider Switching**: Strategy pattern makes adding new providers trivial
2. ✅ **Type Safety**: End-to-end TypeScript with synchronized types
3. ✅ **Production-Ready**: Error handling, loading states, connection management
4. ✅ **Developer Experience**: Comprehensive documentation, MCP tooling, structured guidelines
5. ✅ **Bonus Features**: Model selector, custom provider support, enhanced UX

---

Please don't spend much more than 3-4 hours solving this challenge -> if you find yourself spending more time, please stop and submit what you have.

## Instructions

The `web` directory contains all code for the frontend React application.
The `server` directory contains all code for the backend application based on [Fastify](https://fastify.dev/).

To get started:
1. Clone this repository
2. Run `npm install` in both directories to install dependencies. 
3. Then, run `npm start` in both directories to start the backend and the frontend (they will auto-refresh as you change the code). The frontend runs on port 3000, backend on port 8000.

> You can add as many files and endpoints as you want, try to avoid changing existing code unless necessary.
> You can also add dependencies as needed.

### Submission
Once you are done, please push your code to a public GitHub repository and send us the link.

## Your Job

#### Features to Implement
Take the existing app and add the following features:
1. Implement the existing chat window and turn it into an LLM-based chat. Typed messages should be sent to the backend and handled by an LLM of your choice (out of Gemini, OpenAI, and Anthropic).
   - The user must be able to start a new chat by using the "New Chat" button.
   - New chats should show up in the sidebar (the names of the chats don't matter) and the user must be able to switch between chats.
   - When sending a message, there should be a loading indicator, then the response from the LLM should be displayed in the chat window.
   - When reloading the page, all chats should still be available.
2. Implement an inline-preview for project plans.
    - When the user requests a "project plan" from the LLM, there should be an inline preview of the plan in the chat window.
    - The preview should look like the one in the following image (the icons can be ignored, but sections should be expandable/collapsible).
    - It must be possible for the plan to appear in the middle of a message (not just at the end or beginning).

![Project Plan Preview](./project-plan-preview.png)

> 👉 The project plan consists of a variable number of "workstreams" (each with a title and description) that then contain a variable number of "deliverables" (also each with a title and description).

#### Additional Requirements
- When reloading the page, the chat history must be preserved and the same chat must be selected as before the reload.
- Errors should be handled gracefully
- Use `shadcn/ui` frontend components, some of them have already been added (https://ui.shadcn.com/docs).
- Use React Query for interactions with the backend (https://tanstack.com/query/latest).
- It should be very easy for another developer to replace the LLM you used with another one (e.g. from OpenAI to Anthropic).

#### Out of scope
- You do not need to run a database to store data in the backend, in-memory storage is fine.
- Responsiveness or any other optimization for mobile devices is not required.
- It is fine to assume there is only one user (no need for authentication or any sort of user context handling)
- No need to write tests

### Bonus Task
- Add a visual AI Model selector in the chat homepage to allow switching between different models (eg. Gemini 2.5 Flash, GPT-5 mini) for the chat.

### Deliverables
The Deliverable: A Loom video (screen only is fine) showing:
- A 2-5 minute explanation of how you built your solution.
- A link to your repository.
> [!Note] 
> It's not required to show your face. Share your screen, walk us through your code logic, and show us the app working. We care about your clarity of thought, not your presentation skills.
