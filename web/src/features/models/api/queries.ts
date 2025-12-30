import { useQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../../../data/client';
import type { ModelsResponse } from '../types';

export const modelsOptions = queryOptions({
  queryKey: ['models'],
  queryFn: async (): Promise<ModelsResponse> => {
    const response = await apiClient.get<ModelsResponse>('/models');
    return response.data;
  },
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 120,
  refetchOnMount: false,
});

export function useModelsQuery() {
  return useQuery(modelsOptions);
}
