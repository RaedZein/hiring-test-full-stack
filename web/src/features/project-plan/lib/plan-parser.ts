import { z } from 'zod';
import type { ProjectPlan } from '../types';

/**
 * Zod Validation Schemas
 *
 * Validates project plan structure to ensure type safety
 */
const DeliverableSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const WorkstreamSchema = z.object({
  title: z.string(),
  description: z.string(),
  deliverables: z.array(DeliverableSchema),
});

const ProjectPlanSchema = z.object({
  workstreams: z.array(WorkstreamSchema),
});

/**
 * Content Segment Types
 *
 * Represents a segment of message content:
 * - text: Plain markdown (rendered with Streamdown)
 * - project-plan: Valid project plan (rendered with ProjectPlanPreview)
 * - incomplete-plan: Streaming JSON block (shows shimmer skeleton)
 */
export type ContentSegment =
  | { type: 'text'; content: string }
  | { type: 'project-plan'; plan: ProjectPlan }
  | { type: 'incomplete-plan' };

/**
 * JSON Block Regex
 *
 * Matches standard JSON code blocks: ```json\n{...}\n```
 */
const JSON_BLOCK_REGEX = /```json\n([\s\S]*?)```/g;

/**
 * Parse message content and detect project plans
 *
 * Detection logic:
 * 1. Find all ```json blocks
 * 2. Try to parse JSON
 * 3. Validate with Zod schema (must have workstreams array)
 * 4. If incomplete JSON detected during streaming → incomplete-plan segment
 *
 * @param content - Raw message content
 * @param isStreaming - Whether the message is currently streaming
 * @returns Array of content segments
 */
export function parseMessageContent(
  content: string,
  isStreaming?: boolean
): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  // Detect incomplete JSON block during streaming
  if (isStreaming) {
    const incompleteMatch = content.match(/```json\n([\s\S]*)$/);
    if (incompleteMatch && !incompleteMatch[1].includes('```')) {
      // Found opening ```json but no closing ```
      const textBefore = content.slice(0, incompleteMatch.index);
      if (textBefore.trim()) {
        segments.push({ type: 'text', content: textBefore });
      }

      // Check if it looks like a project plan (has "workstreams")
      if (incompleteMatch[1].includes('"workstreams"')) {
        segments.push({ type: 'incomplete-plan' });
        return segments;
      }
    }
  }

  // Parse complete JSON blocks (ES5-compatible: use exec() in loop)
  const regex = new RegExp(JSON_BLOCK_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Add text before this block
    if (match.index! > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    // Try to parse and validate JSON
    try {
      const parsed = JSON.parse(match[1]);
      const validated = ProjectPlanSchema.parse(parsed);

      // Valid project plan!
      segments.push({ type: 'project-plan', plan: validated });
    } catch {
      // Not a project plan or invalid JSON → treat as text
      segments.push({ type: 'text', content: match[0] });
    }

    lastIndex = match.index! + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex);
    if (textAfter.trim()) {
      segments.push({ type: 'text', content: textAfter });
    }
  }

  // If no segments, return all as text
  if (segments.length === 0) {
    segments.push({ type: 'text', content });
  }

  return segments;
}
