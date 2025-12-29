import OpenAI from 'openai';
import type { Message, LLMModel } from '../../types';
import type { LLMProvider } from './types';

export class OpenAIProvider implements LLMProvider {
  readonly providerType = 'openai' as const;
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

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

  async listModels(): Promise<LLMModel[]> {
    const response = await this.client.models.list();

    return response.data
      .filter((model) => model.id.includes('gpt'))
      .map((model) => ({
        id: model.id,
        name: model.id,
        provider: 'openai',
        maxTokens: 4096,
        createdAt: new Date(model.created * 1000).toISOString(),
        ownedBy: model.owned_by,
      }));
  }
}
