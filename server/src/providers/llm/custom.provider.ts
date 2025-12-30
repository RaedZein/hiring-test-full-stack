import OpenAI from 'openai';
import type { Message, LLMModel, CustomProviderConfig } from '../../types';
import type { LLMProvider } from './types';

/**
 * Custom OpenAI-Compatible LLM Provider
 *
 * Supports any OpenAI-compatible API endpoint:
 * - OpenRouter
 * - Local LLMs (Ollama, LM Studio)
 * - Azure OpenAI
 * - Any other compatible API
 *
 * Uses the OpenAI SDK with a custom baseURL.
 */
export class CustomProvider implements LLMProvider {
  readonly providerType = 'custom' as const;
  private client: OpenAI;
  private config: CustomProviderConfig;

  constructor(config: CustomProviderConfig) {
    this.config = config;

    // Build client options - use object literal instead of typed interface
    // to avoid SDK version-specific type issues
    const clientOptions: {
      apiKey: string;
      baseURL: string;
      defaultHeaders?: Record<string, string>;
    } = {
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    };

    // Add custom headers if provided
    if (config.customHeaders) {
      clientOptions.defaultHeaders = config.customHeaders;
    }

    this.client = new OpenAI(clientOptions);
  }

  /**
   * Stream completion using OpenAI-compatible API
   */
  async *streamCompletion(
    messages: Message[],
    modelId: string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(
      (msg) => ({
        role: msg.role,
        content: msg.content,
      })
    );

    if (systemPrompt) {
      openaiMessages.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    const stream = await this.client.chat.completions.create({
      model: modelId,
      messages: openaiMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Return the single manually-configured model
   *
   * Custom providers don't support dynamic model listing,
   * so we return the model configured by the user.
   */
  async listModels(): Promise<LLMModel[]> {
    return [
      {
        id: this.config.modelId,
        name: this.config.modelName,
        provider: 'custom',
        maxTokens: 4096, // Conservative default
        createdAt: new Date().toISOString(),
        ownedBy: 'custom',
      },
    ];
  }
}
