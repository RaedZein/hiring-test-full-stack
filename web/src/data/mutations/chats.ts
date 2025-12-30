import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../query-keys';
import type { CreateChatRequest } from '../../types/chat';

export function useCreateChatMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: CreateChatRequest) => {
      const response = await apiClient.post<{ id: string }>('/chat', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
}

export function useDeleteChatMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chatId: string) => {
      await apiClient.delete(`/chat/${chatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
}
