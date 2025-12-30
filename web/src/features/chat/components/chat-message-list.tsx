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
      const scrollContainer = containerRef.current.parentElement;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    const scrollContainer = containerRef.current?.parentElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldAutoScroll.current = isNearBottom;
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator = isStreaming && lastMessage?.role === 'assistant' && !lastMessage.content;

  return (
    <div ref={containerRef} className="px-4">
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
