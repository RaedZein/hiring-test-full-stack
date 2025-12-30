import type { LLMProviderType } from '../../types';
import type { LLMProvider } from './types';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { CustomProvider } from './custom.provider';
import * as llmConfigService from '../../services/llm-config.service';

/**
 * Provider Factory with Caching
 *
 * Creates and caches LLM provider instances to avoid redundant initialization.
 * Cache key: `{providerType}:{apiKey}` to support multiple API keys per provider.
 */
const providerCache = new Map<string, LLMProvider>();

/**
 * Get or create an LLM provider instance
 *
 * @param type - Provider type ('anthropic' | 'openai' | 'gemini' | 'custom')
 * @param apiKey - API key for the provider (optional, will use apiKeysService if not provided)
 * @returns Cached or newly created provider instance
 */
export function getLLMProvider(
  type: LLMProviderType,
  apiKey?: string
): LLMProvider {
  // Handle custom provider specially
  if (type === 'custom') {
    const customConfig = llmConfigService.getCustomProvider();
    if (!customConfig) {
      throw new Error('Custom provider not configured');
    }
    const cacheKey = `custom:${customConfig.baseUrl}`;
    if (!providerCache.has(cacheKey)) {
      providerCache.set(cacheKey, new CustomProvider(customConfig));
    }
    return providerCache.get(cacheKey)!;
  }

  // For standard providers, use provided key or get from service
  const key = apiKey || llmConfigService.getApiKey(type);
  if (!key) {
    throw new Error(`No API key configured for ${type}`);
  }

  const cacheKey = `${type}:${key}`;
  if (!providerCache.has(cacheKey)) {
    providerCache.set(cacheKey, createProvider(type, key));
  }

  return providerCache.get(cacheKey)!;
}

/**
 * Create a new provider instance based on type
 *
 * Uses exhaustive type checking to ensure all provider types are handled.
 */
function createProvider(
  type: Exclude<LLMProviderType, 'custom'>,
  apiKey: string
): LLMProvider {
  switch (type) {
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'gemini':
      return new GeminiProvider(apiKey);
    default:
      const _exhaustive: never = type;
      throw new Error(`Unknown provider type: ${_exhaustive}`);
  }
}

/**
 * Clear provider cache (useful for testing or API key rotation)
 */
export function clearProviderCache(): void {
  providerCache.clear();
}

export type { LLMProvider } from './types';
