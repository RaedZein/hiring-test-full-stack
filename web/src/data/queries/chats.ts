import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../query-keys';
import type { Chat, ChatListResponse } from '../../types/chat';
import { useCreateChatMutation, useDeleteChatMutation } from '../mutations/chats';

export function useChatsQuery() {
  return useQuery<ChatListResponse>({
    queryKey: queryKeys.chats.list(),
    queryFn: async () => {
      const response = await apiClient.get<ChatListResponse>('/chat');
      return response.data;
    },
  });
}

export function useChatQuery(chatId: string | null) {
  return useQuery<Chat>({
    queryKey: queryKeys.chats.detail(chatId!),
    queryFn: async () => {
      const response = await apiClient.get<Chat>(`/chat/${chatId}`);
      return response.data;
    },
    enabled: !!chatId,
  });
}

export { useCreateChatMutation, useDeleteChatMutation };
