import { ScrollArea } from './ui/scroll-area';
import { MessageContainer, AssistantLoadingIndicator } from './message';
import { MessageContent } from './message-content';
import type { Message } from '../types/chat';

interface ChatMessageListProps {
  messages: Message[];
  streamingContent?: string;
  isStreaming?: boolean;
}

export function ChatMessageList({ 
  messages, 
  streamingContent, 
  isStreaming 
}: ChatMessageListProps) {
  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message) => (
          <MessageContainer key={message.id} role={message.role}>
            <MessageContent message={message} />
          </MessageContainer>
        ))}
        {isStreaming && streamingContent && (
          <MessageContainer role="assistant">
            <MessageContent 
              message={{ 
                id: 'streaming', 
                role: 'assistant', 
                content: streamingContent,
                createdAt: new Date().toISOString()
              }} 
              isStreaming={true}
              streamingContent={streamingContent}
            />
          </MessageContainer>
        )}
        {isStreaming && !streamingContent && <AssistantLoadingIndicator />}
      </div>
    </ScrollArea>
  );
}
