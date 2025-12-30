import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { AxiosError } from 'axios';

const queryCache = new QueryCache({
  onError: (error: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Query Error]', error);
    }
  },
});

const mutationCache = new MutationCache({
  onError: (error: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Mutation Error]', error);
    }
  },
});

/**
 * Configured QueryClient with global error handling
 *
 * Features:
 * - Development-only error logging via QueryCache/MutationCache
 * - Toast notifications handled by axios interceptor (see data/client.ts)
 * - Smart retry logic (don't retry 4xx errors)
 * - throwOnError: false prevents CRA error overlay
 */
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry 4xx errors (client errors)
        if (error instanceof AxiosError && error.response?.status && error.response.status < 500) {
          return false;
        }
        // Retry up to 3 times for network/5xx errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      throwOnError: false,
    },
    mutations: {
      retry: 1,
      throwOnError: false,
    },
  },
});

