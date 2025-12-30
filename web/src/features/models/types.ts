export type LLMProviderType = 'anthropic' | 'openai' | 'gemini' | 'custom';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProviderType;
  maxTokens: number;
  createdAt: string;
  ownedBy?: string;
}

export interface ProviderStatus {
  provider: LLMProviderType;
  isConfigured: boolean;
  displayName: string;
}

export interface CustomProviderStatus {
  baseUrl: string;
  modelId: string;
  modelName: string;
  isConfigured: boolean;
  hasCustomHeaders: boolean;
}

export interface ModelsResponse {
  models: LLMModel[];
  defaultModelId: string;
  providerStatuses?: ProviderStatus[];
  customProvider?: CustomProviderStatus;
  selectedProvider?: LLMProviderType;
  selectedModelId?: string;
}
