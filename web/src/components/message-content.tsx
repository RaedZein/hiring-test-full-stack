import { Streamdown } from 'streamdown';
import type { Message } from '../types/chat';

interface MessageContentProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
}

export function MessageContent({ 
  message, 
  isStreaming = false, 
  streamingContent = '' 
}: MessageContentProps) {
  const content = isStreaming && streamingContent 
    ? streamingContent 
    : message.content;

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <Streamdown
        mode={isStreaming ? 'streaming' : 'static'}
        isAnimating={isStreaming}
        parseIncompleteMarkdown={true}
      >
        {content}
      </Streamdown>
    </div>
  );
}
