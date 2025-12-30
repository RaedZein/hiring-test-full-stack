import crypto from 'crypto';
import { readJsonFile, writeJsonFile } from './storage.service';
import type {
  LLMProviderType,
  CustomProviderConfig,
  ProviderStatus,
  CustomProviderStatus,
  LLMModel,
} from '../types';

const LLM_CONFIG_FILE = 'llm-config.json';
const ALGORITHM = 'aes-256-gcm';

interface LLMConfig {
  anthropic?: string;
  openai?: string;
  gemini?: string;
  custom?: {
    baseUrl: string;
    apiKey: string;
    modelId: string;
    modelName: string;
    customHeaders?: string;
  };
  selectedProvider?: LLMProviderType;
  selectedModelId?: string;
  models?: {
    anthropic?: { models: LLMModel[]; lastFetched: number };
    openai?: { models: LLMModel[]; lastFetched: number };
    gemini?: { models: LLMModel[]; lastFetched: number };
  };
}


function getEncryptionKey(): Buffer {
  const secret =
    process.env.API_KEYS_SECRET || 'default-dev-secret-change-in-prod-32ch';
  return crypto.scryptSync(secret, 'salt', 32);
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, data] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

function initializeFromEnv(): void {
  const stored: LLMConfig = {};

  const defaultProvider = process.env.DEFAULT_LLM_PROVIDER as
    | LLMProviderType
    | undefined;
  const defaultApiKey = process.env.DEFAULT_API_KEY;
  const defaultBaseUrl = process.env.DEFAULT_BASE_URL;
  const defaultModel = process.env.DEFAULT_MODEL;

  if (defaultProvider && defaultApiKey) {
    if (defaultProvider === 'custom' && defaultBaseUrl && defaultModel) {
      stored.custom = {
        baseUrl: defaultBaseUrl,
        apiKey: encrypt(defaultApiKey),
        modelId: defaultModel,
        modelName: defaultModel,
      };
    } else if (defaultProvider !== 'custom') {
      stored[defaultProvider] = encrypt(defaultApiKey);
    }
  }

  if (defaultProvider) {
    stored.selectedProvider = defaultProvider;
  }
  if (defaultModel) {
    stored.selectedModelId = defaultModel;
  }

  writeStoredConfig(stored);
}

function readStoredConfig(): LLMConfig {
  const stored = readJsonFile<LLMConfig>(LLM_CONFIG_FILE, {});

  const isEmpty = Object.keys(stored).length === 0;
  if (isEmpty) {
    initializeFromEnv();
    return readJsonFile<LLMConfig>(LLM_CONFIG_FILE, {});
  }

  return stored;
}

function writeStoredConfig(config: LLMConfig): void {
  writeJsonFile(LLM_CONFIG_FILE, config);
}

export function getApiKey(
  provider: Exclude<LLMProviderType, 'custom'>
): string | null {
  const stored = readStoredConfig();
  const encryptedKey = stored[provider];
  if (encryptedKey) {
    try {
      return decrypt(encryptedKey);
    } catch {
      return null;
    }
  }
  return null;
}

export function setApiKey(
  provider: Exclude<LLMProviderType, 'custom'>,
  apiKey: string
): void {
  const stored = readStoredConfig();
  stored[provider] = encrypt(apiKey);
  writeStoredConfig(stored);
}

export function deleteApiKey(
  provider: Exclude<LLMProviderType, 'custom'>
): void {
  const stored = readStoredConfig();
  delete stored[provider];
  writeStoredConfig(stored);
}

export function getCustomProvider(): CustomProviderConfig | null {
  const stored = readStoredConfig();
  if (!stored.custom) return null;

  try {
    return {
      baseUrl: stored.custom.baseUrl,
      apiKey: decrypt(stored.custom.apiKey),
      modelId: stored.custom.modelId,
      modelName: stored.custom.modelName,
      customHeaders: stored.custom.customHeaders
        ? JSON.parse(stored.custom.customHeaders)
        : undefined,
    };
  } catch {
    return null;
  }
}

export function setCustomProvider(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  modelName: string,
  customHeaders?: string
): void {
  const stored = readStoredConfig();
  stored.custom = {
    baseUrl,
    apiKey: encrypt(apiKey),
    modelId,
    modelName,
    customHeaders,
  };
  writeStoredConfig(stored);
}

export function deleteCustomProvider(): void {
  const stored = readStoredConfig();
  delete stored.custom;
  writeStoredConfig(stored);
}

export function getProviderStatuses(): {
  providers: ProviderStatus[];
  customProvider?: CustomProviderStatus;
} {
  const stored = readStoredConfig();

  const standardProviders: Exclude<LLMProviderType, 'custom'>[] = [
    'anthropic',
    'openai',
    'gemini',
  ];

  const providers: ProviderStatus[] = standardProviders.map((provider) => ({
    provider,
    isConfigured: !!stored[provider],
    displayName: getProviderDisplayName(provider),
  }));

  let customProvider: CustomProviderStatus | undefined;
  if (stored.custom) {
    customProvider = {
      baseUrl: stored.custom.baseUrl,
      modelId: stored.custom.modelId,
      modelName: stored.custom.modelName,
      isConfigured: true,
      hasCustomHeaders: !!stored.custom.customHeaders,
    };
  }

  return { providers, customProvider };
}

function getProviderDisplayName(
  provider: Exclude<LLMProviderType, 'custom'>
): string {
  switch (provider) {
    case 'anthropic':
      return 'Anthropic';
    case 'openai':
      return 'OpenAI';
    case 'gemini':
      return 'Google Gemini';
  }
}

export function isProviderConfigured(provider: LLMProviderType): boolean {
  if (provider === 'custom') {
    return !!getCustomProvider();
  }
  return !!getApiKey(provider);
}

export function getSelectedProvider(): LLMProviderType | undefined {
  const stored = readStoredConfig();
  return stored.selectedProvider;
}

export function getSelectedModelId(): string | undefined {
  const stored = readStoredConfig();
  return stored.selectedModelId;
}

export function setUserConfig(provider: LLMProviderType, modelId: string): void {
  const stored = readStoredConfig();
  stored.selectedProvider = provider;
  stored.selectedModelId = modelId;
  writeStoredConfig(stored);
}

export function saveProviderModels(
  provider: Exclude<LLMProviderType, 'custom'>,
  models: LLMModel[]
): void {
  const stored = readStoredConfig();
  if (!stored.models) {
    stored.models = {};
  }
  stored.models[provider] = {
    models,
    lastFetched: Date.now(),
  };
  writeStoredConfig(stored);
}

export function getProviderModels(
  provider: Exclude<LLMProviderType, 'custom'>
): LLMModel[] | null {
  const stored = readStoredConfig();
  return stored.models?.[provider]?.models || null;
}

