import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatDetailOptions, chatsOptions } from '../api/queries';
import type { Message, LLMStreamChunk } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface UseChatResult {
  chat: ReturnType<typeof useQuery<any>>['data'];
  messages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  sendMessage: (content: string) => void;
}

/**
 * Custom hook for managing chat state and streaming
 *
 * Uses TanStack Query for:
 * - Initial chat data fetch (title, model, persisted messages)
 * - Automatic caching and revalidation
 *
 * Uses local state for:
 * - Real-time streaming (transient, not cached)
 * - Immediate UI updates during active streams
 */
export function useChat(chatId: string): UseChatResult {
  const queryClient = useQueryClient();
  const { data: chat, isLoading: isLoadingChat } = useQuery(chatDetailOptions(chatId));
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!chat) return;

    setMessages(chat.messages || []);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const checkForActiveStream = async () => {
      if (chat.hasActiveStream) {
        setIsStreaming(true);
        await connectToActiveStream(chatId);
      } else {
        const lastMessage = chat.messages?.[chat.messages.length - 1];
        const needsResponse = lastMessage && lastMessage.role === 'user';

        if (needsResponse) {
          setIsStreaming(true);
          await startStreamForPendingMessage(chatId);
        }
      }
    };

    checkForActiveStream();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat, chatId]);

  const connectToActiveStream = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/chats/${id}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'richard',
        },
        body: JSON.stringify({}),
      });

      await processSSEStream(response);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error connecting to stream:', error);
        setIsStreaming(false);
      }
    }
  };

  const startStreamForPendingMessage = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/chats/${id}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'richard',
        },
        body: JSON.stringify({}),
      });

      await processSSEStream(response);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error starting stream:', error);
        setIsStreaming(false);
      }
    }
  };

  const processSSEStream = async (response: Response) => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentAssistantId: string | null = null;

    try {
      // eslint-disable-next-line no-constant-condition
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
                currentAssistantId = chunkData.messageId || crypto.randomUUID();
                // eslint-disable-next-line no-loop-func
                setMessages((prev) => [
                  ...prev,
                  {
                    id: currentAssistantId!,
                    role: 'assistant',
                    content: '',
                    createdAt: new Date().toISOString(),
                  },
                ]);
                break;

              case 'init':
                currentAssistantId = chunkData.messageId || crypto.randomUUID();
                const initialContent = chunkData.content || '';
                // eslint-disable-next-line no-loop-func
                setMessages((prev) => [
                  ...prev,
                  {
                    id: currentAssistantId!,
                    role: 'assistant',
                    content: initialContent,
                    createdAt: new Date().toISOString(),
                  },
                ]);
                break;

              case 'text':
                if (chunkData.content && currentAssistantId) {
                  // eslint-disable-next-line no-loop-func
                  setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id === currentAssistantId) {
                      return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: lastMsg.content + chunkData.content },
                      ];
                    }
                    return prev;
                  });
                }
                break;

              case 'done':
                setIsStreaming(false);
                currentAssistantId = null;
                queryClient.invalidateQueries({ queryKey: chatsOptions.queryKey });
                break;

              case 'error':
                console.error('Stream error:', chunkData.error);
                setIsStreaming(false);
                currentAssistantId = null;
                break;
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Stream processing error:', error);
      }
    } finally {
      reader.releaseLock();
      setIsStreaming(false);
    }
  };

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      try {
        const response = await fetch(`${API_BASE}/chats/${chatId}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'richard',
          },
          body: JSON.stringify({ message: content }),
        });

        await processSSEStream(response);
      } catch (error) {
        console.error('Error sending message:', error);
        setIsStreaming(false);
      }
    },
    [chatId]
  );

  return {
    chat,
    messages,
    isStreaming,
    isLoading: isLoadingChat,
    sendMessage,
  };
}
