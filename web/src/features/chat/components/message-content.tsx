import { Streamdown } from 'streamdown';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ProjectPlanPreview,
  ProjectPlanSkeleton,
  parseMessageContent,
} from '../../project-plan';

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Message Content Component
 *
 * Renders with three segment types:
 * 1. text → Streamdown markdown
 * 2. incomplete-plan → Shimmer skeleton (streaming)
 * 3. project-plan → Accordion UI (complete)
 */
export function MessageContent({ content, isStreaming }: MessageContentProps) {
  const segments = parseMessageContent(content, isStreaming);

  return (
    <div className="message-content space-y-4">
      <AnimatePresence mode="wait">
        {segments.map((segment, index) => {
          if (segment.type === 'text') {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-sm dark:prose-invert max-w-none"
              >
                <Streamdown>{segment.content}</Streamdown>
              </motion.div>
            );
          }

          if (segment.type === 'incomplete-plan') {
            return <ProjectPlanSkeleton key={index} />;
          }

          if (segment.type === 'project-plan') {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectPlanPreview plan={segment.plan} />
              </motion.div>
            );
          }

          return null;
        })}
      </AnimatePresence>

      {isStreaming && (
        <span className="inline-block animate-pulse text-muted-foreground">
          ▊
        </span>
      )}
    </div>
  );
}
