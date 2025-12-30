import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../data/client';
import { chatsOptions } from './queries';
import type { ChatSummary } from '../types';

export function useCreateChatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string): Promise<{ id: string }> => {
      const response = await apiClient.post<{ id: string }>('/chats', { message });
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatsOptions.queryKey });
    },
  });
}

/**
 * Mutation: Delete chat with optimistic updates
 *
 * Implements TanStack Query v5 optimistic update pattern:
 * - Instant UI feedback by removing chat from cache
 * - Rollback on error to restore previous state
 * - Refetch on settled to ensure consistency
 */
export function useDeleteChatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string): Promise<void> => {
      await apiClient.delete(`/chats/${chatId}`);
    },
    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey: chatsOptions.queryKey });

      const previousChats = queryClient.getQueryData<ChatSummary[]>(chatsOptions.queryKey);

      queryClient.setQueryData<ChatSummary[]>(chatsOptions.queryKey, (old) =>
        old?.filter(chat => chat.id !== chatId)
      );

      return { previousChats };
    },
    onError: (err, chatId, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(chatsOptions.queryKey, context.previousChats);
      }
    },
    onSettled: (_, __, chatId) => {
      queryClient.invalidateQueries({ queryKey: chatsOptions.queryKey });
      queryClient.removeQueries({ queryKey: ['chats', chatId] });
    },
  });
}
