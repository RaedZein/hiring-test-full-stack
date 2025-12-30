import { useCallback } from 'react';
import { useChatsQuery, useChatQuery, useCreateChatMutation, useDeleteChatMutation } from '../data/queries/chats';
import { useStreamingMessage } from './useStreamingMessage';
import { useLocalStorage } from '@uidotdev/usehooks';

const STORAGE_KEYS = {
  SELECTED_CHAT_ID: 'chat-selected-chat-id',
  SELECTED_MODEL: 'chat-selected-model',
} as const;

export function useChat() {
  const [selectedChatId, setSelectedChatId] = useLocalStorage<string | null>(
    STORAGE_KEYS.SELECTED_CHAT_ID,
    null
  );
  
  const [selectedModel, setSelectedModel] = useLocalStorage<string | null>(
    STORAGE_KEYS.SELECTED_MODEL,
    null
  );
  
  const chatsQuery = useChatsQuery();
  const chatQuery = useChatQuery(selectedChatId);
  const createChatMutation = useCreateChatMutation();
  const deleteChatMutation = useDeleteChatMutation();
  const streaming = useStreamingMessage({ 
    chatId: selectedChatId, 
    model: selectedModel || undefined 
  });
  
  const createChat = useCallback(async (modelId?: string) => {
    const result = await createChatMutation.mutateAsync({ modelId });
    setSelectedChatId(result.id);
    if (modelId) {
      setSelectedModel(modelId);
    }
    return result;
  }, [createChatMutation, setSelectedChatId, setSelectedModel]);
  
  const deleteChat = useCallback(async (chatId: string) => {
    await deleteChatMutation.mutateAsync(chatId);
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
    }
  }, [deleteChatMutation, selectedChatId, setSelectedChatId]);
  
  return {
    selectedChatId,
    chats: chatsQuery.data?.chats || [],
    chat: chatQuery.data,
    messages: chatQuery.data?.messages || [],
    isLoadingChats: chatsQuery.isPending,
    isLoadingChat: chatQuery.isPending,
    selectChat: setSelectedChatId,
    createChat,
    deleteChat,
    sendMessage: streaming.sendMessage,
    streamingContent: streaming.streamingContent,
    isStreaming: streaming.isStreaming,
    abortStream: streaming.abort,
    selectedModel,
    setSelectedModel,
  };
}
