import { FastifyPluginAsync } from 'fastify';
import type {
  ModelsResponse,
  LLMProviderType,
  LLMModel,
  SetProviderRequest,
  SetUserConfigRequest,
} from '../../types';
import { getLLMProvider, clearProviderCache } from '../../providers/llm';
import * as llmConfigService from '../../services/llm-config.service';

const models: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get<{ Reply: ModelsResponse }>('/', async (request, reply) => {
    llmConfigService.getSelectedProvider();

    const allModels: LLMModel[] = [];
    const configuredProviders = getConfiguredProviders();

    for (const provider of configuredProviders) {
      try {
        if (provider !== 'custom') {
          const storedModels = llmConfigService.getProviderModels(provider);
          if (storedModels && storedModels.length > 0) {
            allModels.push(...storedModels);
            continue;
          }
        }

        const llmProvider = getLLMProvider(provider);
        const models = await llmProvider.listModels();
        allModels.push(...models);

        if (provider !== 'custom') {
          llmConfigService.saveProviderModels(provider, models);
        }
      } catch (error) {
        request.log.warn(
          { provider, error },
          `Failed to fetch models from ${provider}`
        );
      }
    }

    const defaultModelId = getDefaultModelId(allModels);
    const { providers: providerStatuses, customProvider } =
      llmConfigService.getProviderStatuses();
    const selectedProvider = llmConfigService.getSelectedProvider();
    const selectedModelId = llmConfigService.getSelectedModelId();

    return {
      models: allModels,
      defaultModelId,
      providerStatuses,
      customProvider,
      selectedProvider,
      selectedModelId,
    };
  });

  fastify.post<{
    Params: { provider: string };
    Body: SetProviderRequest;
  }>('/providers/:provider', async (request, reply) => {
    const { provider } = request.params;
    const { apiKey, baseUrl, modelId, modelName, customHeaders } = request.body;

    if (!['anthropic', 'openai', 'gemini', 'custom'].includes(provider)) {
      return reply.status(400).send({
        error: 'Invalid provider. Must be anthropic, openai, gemini, or custom',
      });
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return reply.status(400).send({ error: 'API key is required' });
    }

    if (provider === 'custom') {
      if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
        return reply.status(400).send({ error: 'Base URL is required for custom provider' });
      }

      if (!modelId || typeof modelId !== 'string' || modelId.trim().length === 0) {
        return reply.status(400).send({ error: 'Model ID is required for custom provider' });
      }

      if (!modelName || typeof modelName !== 'string' || modelName.trim().length === 0) {
        return reply.status(400).send({ error: 'Model name is required for custom provider' });
      }

      try {
        new URL(baseUrl);
      } catch {
        return reply.status(400).send({ error: 'Invalid base URL format' });
      }

      if (customHeaders) {
        try {
          JSON.parse(customHeaders);
        } catch {
          return reply.status(400).send({ error: 'Custom headers must be valid JSON' });
        }
      }

      llmConfigService.setCustomProvider(
        baseUrl.trim(),
        apiKey.trim(),
        modelId.trim(),
        modelName.trim(),
        customHeaders
      );
      clearProviderCache();

      request.log.info({ baseUrl, modelId }, 'Custom provider configured');
      return reply.send({
        success: true,
        message: 'Custom provider has been configured',
      });
    }

    llmConfigService.setApiKey(provider as Exclude<LLMProviderType, 'custom'>, apiKey.trim());
    clearProviderCache();

    try {
      const llmProvider = getLLMProvider(provider as LLMProviderType);
      const models = await llmProvider.listModels();
      llmConfigService.saveProviderModels(provider as Exclude<LLMProviderType, 'custom'>, models);
    } catch (error) {
      request.log.warn({ provider, error }, 'Failed to fetch models after setting API key');
    }

    request.log.info({ provider }, 'API key updated');
    return reply.send({
      success: true,
      provider,
      message: `API key for ${provider} has been saved`,
    });
  });

  fastify.delete<{
    Params: { provider: string };
  }>('/providers/:provider', async (request, reply) => {
    const { provider } = request.params;

    if (!['anthropic', 'openai', 'gemini', 'custom'].includes(provider)) {
      return reply.status(400).send({
        error: 'Invalid provider. Must be anthropic, openai, gemini, or custom',
      });
    }

    if (provider === 'custom') {
      llmConfigService.deleteCustomProvider();
    } else {
      llmConfigService.deleteApiKey(provider as Exclude<LLMProviderType, 'custom'>);
    }

    clearProviderCache();

    request.log.info({ provider }, 'Provider configuration deleted');
    return reply.send({
      success: true,
      provider,
      message: `Configuration for ${provider} has been removed`,
    });
  });

  fastify.post<{
    Body: SetUserConfigRequest;
  }>('/selection', async (request, reply) => {
    const { provider, modelId } = request.body;

    if (!provider || !modelId) {
      return reply.status(400).send({
        error: 'Provider and modelId are required',
      });
    }

    llmConfigService.setUserConfig(provider, modelId);

    request.log.info({ provider, modelId }, 'User config updated');
    return reply.send({
      success: true,
      message: 'Configuration has been saved',
    });
  });
};

function getConfiguredProviders(): LLMProviderType[] {
  const providers: LLMProviderType[] = [];

  const standardProviders: Exclude<LLMProviderType, 'custom'>[] = [
    'anthropic',
    'openai',
    'gemini',
  ];

  for (const provider of standardProviders) {
    if (llmConfigService.isProviderConfigured(provider)) {
      providers.push(provider);
    }
  }

  if (llmConfigService.isProviderConfigured('custom')) {
    providers.push('custom');
  }

  return providers;
}

function getDefaultModelId(models: LLMModel[]): string {
  const selectedModelId = llmConfigService.getSelectedModelId();

  if (selectedModelId) {
    const modelExists = models.some((m) => m.id === selectedModelId);
    if (modelExists) {
      return selectedModelId;
    }
  }

  return '';
}

export default models;






