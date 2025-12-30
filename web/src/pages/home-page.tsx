import { useState } from 'react';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import {
  ChatSidebar,
  ChatInputBox,
  ChatMessageList,
  useSelectedChat,
  useChat,
  useChatsQuery,
  useCreateChatMutation,
} from '../features/chat';
import { ModelSelector, useModelsQuery } from '../features/models';
import { MessageSkeleton } from '../components/skeletons/message-skeleton';

export function HomePage() {
  const [selectedChatId, setSelectedChatId] = useSelectedChat();
  const { data: chatsData } = useChatsQuery();
  const { data: modelsData } = useModelsQuery();

  const handleCreateChat = () => {
    setSelectedChatId(null);
  };

  return (
    <LayoutGroup>
      <div className="flex flex-col items-center h-[calc(100vh-5rem)]">
        <ChatSidebar
          chats={chatsData || []}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          onCreateChat={handleCreateChat}
        />
        <div className="flex flex-col max-w-4xl ms-64 w-full h-full">
          <AnimatePresence mode="wait">
            {selectedChatId ? (
              <ChatWindow
                key={selectedChatId}
                chatId={selectedChatId}
                defaultModelId={modelsData?.defaultModelId}
              />
            ) : (
              <LandingState
                key="landing"
                defaultModelId={modelsData?.defaultModelId}
                onChatCreated={setSelectedChatId}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
}

interface LandingStateProps {
  defaultModelId?: string;
  onChatCreated: (chatId: string) => void;
}

function LandingState({ defaultModelId, onChatCreated }: LandingStateProps) {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const createChatMutation = useCreateChatMutation();

  const handleSend = async (content: string) => {
    try {
      const result = await createChatMutation.mutateAsync(content);
      onChatCreated(result.id);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="flex-1 min-h-0 h-full flex items-center justify-center">
        <motion.div
          layoutId="model-selector"
          className="flex flex-col items-center gap-6 max-w-2xl px-4"
        >
          <h2 className="text-xl font-semibold text-muted-foreground">
            Start a conversation
          </h2>
          <ModelSelector
            selectedModelId={selectedModelId || defaultModelId}
            onModelChange={setSelectedModelId}
            size="large"
          />
          <div className="w-full max-w-md">
            <ChatInputBox
              onSend={handleSend}
              disabled={createChatMutation.isPending}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface ChatWindowProps {
  chatId: string;
  defaultModelId?: string;
}

function ChatWindow({ chatId, defaultModelId }: ChatWindowProps) {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const { chat, messages, sendMessage, isStreaming, isLoading } = useChat(chatId);

  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  const currentModelId = selectedModelId || chat?.modelId || defaultModelId;
  const hasMessages = messages.length > 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex h-full items-center justify-center"
      >
        <MessageSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full overflow-hidden"
    >
      {chat && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border-b p-4 flex-shrink-0"
        >
          <h2 className="text-lg font-semibold">{chat.title}</h2>
        </motion.div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {!hasMessages ? (
          <div className="h-full flex items-center justify-center">
            <motion.div
              layoutId="model-selector"
              className="flex flex-col items-center gap-6 max-w-2xl px-4"
            >
              <h2 className="text-xl font-semibold text-muted-foreground">
                Continue the conversation
              </h2>
              <ModelSelector
                selectedModelId={currentModelId}
                onModelChange={setSelectedModelId}
                size="large"
              />
            </motion.div>
          </div>
        ) : (
          <ChatMessageList messages={messages} isStreaming={isStreaming} />
        )}
      </div>

      <div className="border-t p-4 space-y-3 flex-shrink-0">
        {hasMessages && (
          <motion.div layoutId="model-selector" className="flex justify-center">
            <ModelSelector
              selectedModelId={currentModelId}
              onModelChange={setSelectedModelId}
              disabled={isStreaming}
            />
          </motion.div>
        )}
        <ChatInputBox onSend={handleSend} disabled={isStreaming} />
      </div>
    </motion.div>
  );
}
