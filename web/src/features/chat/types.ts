export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
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
  hasActiveStream?: boolean;
}

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
  modelId: string;
}

export type LLMStreamChunkType = 'connected' | 'init' | 'text' | 'done' | 'error';

export interface LLMStreamChunk {
  type: LLMStreamChunkType;
  content?: string;
  error?: string;
  messageId?: string;
  chatId?: string;
}

export interface ChatRequest {
  chatId?: string;
  message?: string;
}

export interface ChatListResponse {
  chats: ChatSummary[];
}
