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
  streamStatus?: 'active' | 'complete' | null;
  partialContent?: string;
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
export type LLMProviderType = 'anthropic' | 'openai' | 'gemini' | 'custom';

export interface LLMModel {
  id: string;           // Provider-specific model ID (e.g., 'claude-sonnet-4-20250514')
  name: string;         // Human-readable name (e.g., 'Claude Sonnet 4')
  provider: LLMProviderType;
  maxTokens: number;    // Maximum context window
  createdAt: string;    // ISO timestamp of model creation
  ownedBy?: string;     // Organization that owns the model (e.g., "openai", "google")
}

export type LLMStreamChunkType = 'connected' | 'init' | 'text' | 'done' | 'error';

export interface LLMStreamChunk {
  type: LLMStreamChunkType;
  content?: string;    // For 'text' and 'init' types
  error?: string;      // For 'error' type
  messageId?: string;  // For 'connected' and 'done' types
  chatId?: string;     // For 'init' type (reconnection support)
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
export interface ChatRequest {
  chatId?: string;
  message?: string;
}

export interface ChatListResponse {
  chats: ChatSummary[];
}

export interface ModelsResponse {
  models: LLMModel[];
  defaultModelId: string;
  providerStatuses?: ProviderStatus[];
  customProvider?: CustomProviderStatus;
  selectedProvider?: LLMProviderType;
  selectedModelId?: string;
}

// ============ API Request Types ============
export interface SetProviderRequest {
  apiKey: string;
  baseUrl?: string;
  modelId?: string;
  modelName?: string;
  customHeaders?: string;
}

export interface SetUserConfigRequest {
  provider: LLMProviderType;
  modelId: string;
}

// ============ API Configuration Types ============
export interface CustomProviderConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
  modelName: string;
  customHeaders?: Record<string, string>;
}

export interface ProviderStatus {
  provider: LLMProviderType;
  isConfigured: boolean;
  displayName: string;
}

export interface CustomProviderStatus {
  baseUrl: string;
  modelId: string;
  modelName: string;
  isConfigured: boolean;
  hasCustomHeaders: boolean;
}
