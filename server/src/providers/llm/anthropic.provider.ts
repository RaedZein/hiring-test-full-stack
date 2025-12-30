import Anthropic from '@anthropic-ai/sdk';
import type { Message, LLMModel } from '../../types';
import type { LLMProvider } from './types';
import * as llmConfigService from '../../services/llm-config.service';

export class AnthropicProvider implements LLMProvider {
  readonly providerType = 'anthropic' as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *streamCompletion(
    messages: Message[],
    modelId: string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.messages.create({
      model: modelId,
      max_tokens: 4096,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      ...(systemPrompt && { system: systemPrompt }),
      stream: true,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  async listModels(): Promise<LLMModel[]> {
    const storedModels = llmConfigService.getProviderModels('anthropic');
    if (storedModels && storedModels.length > 0) {
      return storedModels;
    }

    const response = await this.client.models.list();

    const models: LLMModel[] = response.data.map((model) => ({
      id: model.id,
      name: (model as any).display_name || model.id,
      provider: 'anthropic',
      maxTokens: (model as any).context_window || 200000,
      createdAt: model.created_at,
      ownedBy: 'anthropic',
    }));

    llmConfigService.saveProviderModels('anthropic', models);
    return models;
  }
}
