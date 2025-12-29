import { FastifyPluginAsync } from 'fastify';
import type {
  ModelsResponse,
  LLMProviderType,
  LLMModel,
} from '../../types';
import { getLLMProvider } from '../../providers/llm';

const models: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get<{ Reply: ModelsResponse }>('/', async (request, reply) => {
    const allModels: LLMModel[] = [];
    const configuredProviders: LLMProviderType[] = [];

    const standardProviders: LLMProviderType[] = ['anthropic', 'openai', 'gemini'];

    for (const provider of standardProviders) {
      try {
        const envKey = {
          anthropic: process.env.ANTHROPIC_API_KEY,
          openai: process.env.OPENAI_API_KEY,
          gemini: process.env.GOOGLE_AI_API_KEY,
        }[provider];

        if (envKey) {
          configuredProviders.push(provider);
        }
      } catch {
        // Skip if env var not set
      }
    }

    for (const provider of configuredProviders) {
      try {
        const llmProvider = getLLMProvider(provider);
        const providerModels = await llmProvider.listModels();
        allModels.push(...providerModels);
      } catch (error) {
        request.log.warn(
          { provider, error },
          `Failed to fetch models from ${provider}`
        );
      }
    }

    const defaultModelId = process.env.DEFAULT_MODEL_ID || 
      (allModels.length > 0 ? allModels[0].id : '');

    return {
      models: allModels,
      defaultModelId,
    };
  });
};

export default models;
