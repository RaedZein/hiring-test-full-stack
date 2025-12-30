import { useEffect, useRef } from 'react';
import { Message as MessageComponent } from './message';
import { TypingIndicator } from './typing-indicator';
import type { Message } from '../types';

interface ChatMessageListProps {
  messages: Message[];
  isStreaming?: boolean;
}

export function ChatMessageList({
  messages,
  isStreaming,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScroll.current = isNearBottom;
  };

  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator = isStreaming && lastMessage?.role === 'assistant' && !lastMessage.content;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto px-4"
    >
      <div className="space-y-4 py-4">
        {messages.map((message) => (
          <MessageComponent
            key={message.id}
            message={message}
            isStreaming={
              isStreaming && message.id === messages[messages.length - 1]?.id
            }
          />
        ))}
        {showTypingIndicator && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}
      </div>
    </div>
  );
}
