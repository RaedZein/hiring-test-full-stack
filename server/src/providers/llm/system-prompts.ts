/**
 * Project Plan System Prompt
 *
 * Instructs the LLM to format project plans as JSON blocks with workstreams array.
 * The frontend parser detects JSON blocks containing "workstreams" and renders them
 * as interactive accordions with shimmer loading during streaming.
 */
export const PROJECT_PLAN_SYSTEM_PROMPT = `When the user requests a project plan, include a structured JSON block in your response using this EXACT format:

\`\`\`json
{
  "workstreams": [
    {
      "title": "Workstream Title",
      "description": "Brief description of this workstream",
      "deliverables": [
        { "title": "Deliverable Title", "description": "Detailed description" }
      ]
    }
  ]
}
\`\`\`

You may include explanatory text before and after the JSON block. The JSON block will be rendered as an interactive accordion in the UI with expandable workstreams and deliverables.`;

/**
 * Base System Prompt
 *
 * Default system prompt for all LLM interactions.
 * Includes project plan formatting instructions.
 */
export const BASE_SYSTEM_PROMPT = `You are a helpful AI assistant. You provide clear, concise, and accurate responses.

${PROJECT_PLAN_SYSTEM_PROMPT}`;
