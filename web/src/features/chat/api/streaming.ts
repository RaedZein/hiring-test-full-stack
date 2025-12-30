import type { LLMStreamChunk } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface StreamChunk {
  type: 'message' | 'content';
  messageId: string;
  content: string;
}

/**
 * Converts SSE ReadableStream to AsyncIterable for TanStack Query's streamedQuery
 * Yields text content chunks that will be accumulated by the reducer
 */
async function* sseToAsyncIterable(
  response: Response
): AsyncGenerator<StreamChunk, void, undefined> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentAssistantId: string | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const chunkData: LLMStreamChunk = JSON.parse(line.slice(6));

          switch (chunkData.type) {
            case 'connected':
            case 'init':
              currentAssistantId = chunkData.messageId || crypto.randomUUID();
              yield {
                type: 'message',
                messageId: currentAssistantId,
                content: chunkData.content || '',
              };
              break;

            case 'text':
              if (chunkData.content && currentAssistantId) {
                yield {
                  type: 'content',
                  messageId: currentAssistantId,
                  content: chunkData.content,
                };
              }
              break;

            case 'done':
              currentAssistantId = null;
              return;

            case 'error':
              throw new Error(chunkData.error || 'Stream error');
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Stream function for TanStack Query's streamedQuery
 */
export async function streamChatMessages(chatId: string): Promise<AsyncIterable<StreamChunk>> {
  const response = await fetch(`${API_BASE}/chats/${chatId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'richard',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Stream failed: ${response.statusText}`);
  }

  return sseToAsyncIterable(response);
}

/**
 * Stream function for sending a new message
 */
export async function streamNewMessage(
  chatId: string,
  message: string
): Promise<AsyncIterable<StreamChunk>> {
  const response = await fetch(`${API_BASE}/chats/${chatId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'richard',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Stream failed: ${response.statusText}`);
  }

  return sseToAsyncIterable(response);
}

export type { StreamChunk };
