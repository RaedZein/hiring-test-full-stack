import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../data/client';
import { modelsOptions } from './queries';
import type { LLMProviderType } from '../types';

export function useSetProviderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      apiKey,
      baseUrl,
      modelId,
      modelName,
      customHeaders,
    }: {
      provider: LLMProviderType;
      apiKey: string;
      baseUrl?: string;
      modelId?: string;
      modelName?: string;
      customHeaders?: string;
    }) => {
      const response = await apiClient.post(`/models/providers/${provider}`, {
        apiKey,
        baseUrl,
        modelId,
        modelName,
        customHeaders,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelsOptions.queryKey });
    },
  });
}

export function useDeleteProviderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: LLMProviderType) => {
      const response = await apiClient.delete(`/models/providers/${provider}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelsOptions.queryKey });
    },
  });
}

export function useSetUserConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      modelId,
    }: {
      provider: LLMProviderType;
      modelId: string;
    }) => {
      const response = await apiClient.post('/models/selection', {
        provider,
        modelId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelsOptions.queryKey });
    },
  });
}
