export const queryKeys = {
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
  },
  
  chats: {
    all: ['chats'] as const,
    list: () => [...queryKeys.chats.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.chats.all, 'detail', id] as const,
    messages: (id: string) => [...queryKeys.chats.all, id, 'messages'] as const,
  },
  
  providers: {
    all: ['providers'] as const,
    list: () => [...queryKeys.providers.all, 'list'] as const,
    models: (provider: string) => [...queryKeys.providers.all, provider, 'models'] as const,
  },
} as const;
