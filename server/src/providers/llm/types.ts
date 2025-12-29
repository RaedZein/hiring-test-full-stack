import type { Message, LLMModel, LLMProviderType } from '../../types';

/**
 * LLM Provider Interface
 *
 * Implements the Strategy Pattern for multi-provider LLM support.
 * Each provider (Anthropic, OpenAI, Gemini) implements this interface.
 *
 * CRITICAL: Model lists MUST be fetched dynamically from provider APIs.
 * NO hardcoded model arrays allowed.
 */
export interface LLMProvider {
  readonly providerType: LLMProviderType;

  /**
   * Stream completion text chunks from the LLM.
   *
   * @param messages - Conversation history
   * @param modelId - Provider-specific model ID (e.g., 'claude-sonnet-4-20250514')
   * @param systemPrompt - Optional system prompt for the conversation
   * @returns AsyncGenerator yielding text chunks as they arrive
   */
  streamCompletion(
    messages: Message[],
    modelId: string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Fetch available models from provider API (NOT hardcoded).
   *
   * MUST call the provider's API to get the latest model list.
   * Results should be cached with TTL to avoid excessive API calls.
   *
   * @returns Promise resolving to array of available models
   */
  listModels(): Promise<LLMModel[]>;
}
