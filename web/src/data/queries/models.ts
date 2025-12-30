import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../query-keys';
import type { ModelsResponse } from '../../types/chat';

export function useModelsQuery() {
  return useQuery<ModelsResponse>({
    queryKey: queryKeys.providers.list(),
    queryFn: async () => {
      const response = await apiClient.get<ModelsResponse>('/models');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
