import { useQuery, queryOptions, experimental_streamedQuery as streamedQuery } from '@tanstack/react-query';
import { apiClient } from '../../../data/client';
import type { ChatSummary, ChatListResponse, Chat, Message } from '../types';
import { streamChatMessages, type StreamChunk } from './streaming';

export const chatsOptions = queryOptions({
  queryKey: ['chats'],
  queryFn: async (): Promise<ChatSummary[]> => {
    const response = await apiClient.get<ChatListResponse>('/chats');
    return response.data.chats;
  },
  staleTime: 1000 * 60 * 2,
  gcTime: 1000 * 60 * 5,
});

export function useChatsQuery() {
  return useQuery(chatsOptions);
}

export const chatDetailOptions = (chatId: string) => queryOptions({
  queryKey: ['chats', chatId],
  queryFn: async (): Promise<Chat> => {
    const response = await apiClient.get<Chat>(`/chats/${chatId}`);
    return response.data;
  },
  staleTime: 1000 * 60,
});

/**
 * Streamed query for chat messages
 * Uses TanStack Query's experimental streamedQuery for real-time message streaming
 *
 * Generic types:
 * - TData = Message[] (the accumulated result)
 * - TQueryFnData = StreamChunk (what each iteration yields)
 *
 * The reducer accumulates StreamChunks into a Message array:
 * - 'message' chunks create new messages
 * - 'content' chunks append to the last message with matching ID
 */
export const chatMessagesStreamOptions = (chatId: string) => queryOptions({
  queryKey: ['chats', chatId, 'messages', 'stream'],
  queryFn: streamedQuery({
    streamFn: async () => streamChatMessages(chatId),
    refetchMode: 'replace',
    reducer: (accumulator: Message[], chunk: StreamChunk): Message[] => {
      if (chunk.type === 'message') {
        return [
          ...accumulator,
          {
            id: chunk.messageId,
            role: 'assistant' as const,
            content: chunk.content,
            createdAt: new Date().toISOString(),
          },
        ];
      }

      if (chunk.type === 'content') {
        const lastMessage = accumulator[accumulator.length - 1];
        if (lastMessage && lastMessage.id === chunk.messageId) {
          return [
            ...accumulator.slice(0, -1),
            {
              ...lastMessage,
              content: lastMessage.content + chunk.content,
            },
          ];
        }
      }

      return accumulator;
    },
    initialValue: [] as Message[],
  }),
  enabled: false,
});
