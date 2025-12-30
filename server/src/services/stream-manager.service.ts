import type { ServerResponse } from 'http';
import type { LLMStreamChunk } from '../types';

/**
 * Active Stream Manager Service
 *
 * Manages in-memory buffers for active LLM streams, enabling:
 * - Multiple clients to subscribe to the same stream
 * - Client reconnection without losing accumulated content
 * - Backend-LLM stream independence from client connections
 */

interface ActiveStream {
  chatId: string;
  messageId: string;
  accumulatedContent: string;
  isComplete: boolean;
  error?: string;
  subscribers: Set<ServerResponse>;
}

class StreamManager {
  private streams = new Map<string, ActiveStream>();

  /**
   * Start a new stream for a chat
   */
  startStream(chatId: string, messageId: string): void {
    if (this.streams.has(chatId)) {
      return;
    }

    this.streams.set(chatId, {
      chatId,
      messageId,
      accumulatedContent: '',
      isComplete: false,
      subscribers: new Set(),
    });
  }

  /**
   * Append a chunk of content to a stream and broadcast to subscribers
   */
  appendChunk(chatId: string, content: string): void {
    const stream = this.streams.get(chatId);
    if (!stream || stream.isComplete) {
      return;
    }

    stream.accumulatedContent += content;

    const chunk: LLMStreamChunk = { type: 'text', content };
    this.broadcast(chatId, chunk);
  }

  /**
   * Subscribe a client to a stream
   * Returns the accumulated content so far (for reconnection)
   */
  subscribe(
    chatId: string,
    res: ServerResponse
  ): { accumulated: string; messageId: string; isComplete: boolean } | null {
    const stream = this.streams.get(chatId);
    if (!stream) {
      return null;
    }

    stream.subscribers.add(res);

    res.on('close', () => {
      this.unsubscribe(chatId, res);
    });

    return {
      accumulated: stream.accumulatedContent,
      messageId: stream.messageId,
      isComplete: stream.isComplete,
    };
  }

  /**
   * Unsubscribe a client from a stream
   */
  unsubscribe(chatId: string, res: ServerResponse): void {
    const stream = this.streams.get(chatId);
    if (stream) {
      stream.subscribers.delete(res);
    }
  }

  /**
   * Complete a stream successfully
   * Returns the full accumulated content
   */
  completeStream(chatId: string): string {
    const stream = this.streams.get(chatId);
    if (!stream) {
      return '';
    }

    stream.isComplete = true;

    const chunk: LLMStreamChunk = {
      type: 'done',
      messageId: stream.messageId,
    };
    this.broadcast(chatId, chunk);

    this.endSubscribers(chatId);

    const content = stream.accumulatedContent;
    this.streams.delete(chatId);

    return content;
  }

  /**
   * Mark a stream as failed
   */
  failStream(chatId: string, error: string): string {
    const stream = this.streams.get(chatId);
    if (!stream) {
      return '';
    }

    stream.isComplete = true;
    stream.error = error;

    const chunk: LLMStreamChunk = { type: 'error', error };
    this.broadcast(chatId, chunk);

    this.endSubscribers(chatId);

    const content = stream.accumulatedContent;
    this.streams.delete(chatId);

    return content;
  }

  /**
   * Check if a stream is active for a chat
   */
  hasActiveStream(chatId: string): boolean {
    const stream = this.streams.get(chatId);
    return stream !== undefined && !stream.isComplete;
  }

  /**
   * Get the active stream for a chat (if any)
   */
  getActiveStream(chatId: string): ActiveStream | null {
    return this.streams.get(chatId) || null;
  }

  /**
   * Broadcast a chunk to all subscribers of a stream
   */
  private broadcast(chatId: string, chunk: LLMStreamChunk): void {
    const stream = this.streams.get(chatId);
    if (!stream) {
      return;
    }

    const data = `data: ${JSON.stringify(chunk)}\n\n`;
    for (const subscriber of stream.subscribers) {
      try {
        subscriber.write(data);
      } catch {
        stream.subscribers.delete(subscriber);
      }
    }
  }

  /**
   * End all subscriber connections for a stream
   */
  private endSubscribers(chatId: string): void {
    const stream = this.streams.get(chatId);
    if (!stream) {
      return;
    }

    for (const subscriber of stream.subscribers) {
      try {
        subscriber.end();
      } catch {
        // Ignore errors on close
      }
    }
    stream.subscribers.clear();
  }
}

export const streamManager = new StreamManager();
