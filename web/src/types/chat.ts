// ============ Core Types ============
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string; // ISO timestamp
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
  modelId: string;
}

// ============ LLM Types ============
// CRITICAL: Only provider names are hardcoded as types
// Model lists MUST be fetched from provider APIs dynamically
export type LLMProviderType = 'anthropic' | 'openai' | 'gemini';

export interface LLMModel {
  id: string;           // Provider-specific model ID (e.g., 'claude-sonnet-4-20250514')
  name: string;         // Human-readable name (e.g., 'Claude Sonnet 4')
  provider: LLMProviderType;
  maxTokens: number;    // Maximum context window
  createdAt: string;    // ISO timestamp of model creation
  ownedBy?: string;     // Organization that owns the model (e.g., "openai", "google")
}

export type LLMStreamChunkType = 'connected' | 'text' | 'done' | 'error';

export interface LLMStreamChunk {
  type: LLMStreamChunkType;
  content?: string;    // For 'text' type
  error?: string;      // For 'error' type
  messageId?: string;  // For 'connected' and 'done' types
}

// ============ Project Plan Types ============
export interface Deliverable {
  title: string;
  description: string;
}

export interface Workstream {
  title: string;
  description: string;
  deliverables: Deliverable[];
}

export interface ProjectPlan {
  workstreams: Workstream[];
}

// ============ API Request/Response Types ============
export interface CreateChatRequest {
  modelId?: string;  // Uses default if not provided
}

export interface StreamMessageRequest {
  content: string;
  modelId?: string;  // Override chat's default model
}

export interface ChatListResponse {
  chats: ChatSummary[];
}

export interface ModelsResponse {
  models: LLMModel[];
  defaultModelId: string;
}
