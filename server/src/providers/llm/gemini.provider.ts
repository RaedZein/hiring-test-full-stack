import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Message, LLMModel } from '../../types';
import type { LLMProvider } from './types';

export class GeminiProvider implements LLMProvider {
  readonly providerType = 'gemini' as const;
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async *streamCompletion(
    messages: Message[],
    modelId: string,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const model = this.client.getGenerativeModel({ model: modelId });

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
      ...(systemPrompt && {
        systemInstruction: systemPrompt,
      }),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  async listModels(): Promise<LLMModel[]> {
    const apiKey = (this.client as any).apiKey;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Gemini models: ${response.statusText}`);
    }

    const data = (await response.json()) as { models: any[] };

    return data.models
      .filter((model: any) =>
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .map((model: any) => ({
        id: model.name.replace('models/', ''),
        name: model.displayName || model.name.replace('models/', ''),
        provider: 'gemini',
        maxTokens: model.inputTokenLimit || 8192,
        createdAt: new Date().toISOString(),
        ownedBy: 'google',
      }));
  }
}
