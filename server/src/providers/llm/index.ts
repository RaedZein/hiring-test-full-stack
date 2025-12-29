import type { LLMProviderType } from '../../types';
import type { LLMProvider } from './types';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';

/**
 * Provider Factory with Caching
 *
 * Creates and caches LLM provider instances to avoid redundant initialization.
 * Cache key: `{providerType}:{apiKey}` to support multiple API keys per provider.
 */
const providerCache = new Map<string, LLMProvider>();

/**
 * Get API key from environment variables
 */
function getApiKey(providerType: LLMProviderType): string {
  const envKey = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GOOGLE_AI_API_KEY,
  }[providerType];

  if (!envKey) {
    throw new Error(`No API key configured for ${providerType}. Set ${{
      anthropic: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      gemini: 'GOOGLE_AI_API_KEY',
    }[providerType]} environment variable.`);
  }

  return envKey;
}

/**
 * Get or create an LLM provider instance
 *
 * @param type - Provider type ('anthropic' | 'openai' | 'gemini')
 * @param apiKey - Optional API key (uses env var if not provided)
 * @returns Cached or newly created provider instance
 */
export function getLLMProvider(
  type: LLMProviderType,
  apiKey?: string
): LLMProvider {
  const key = apiKey || getApiKey(type);
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
  type: LLMProviderType,
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
