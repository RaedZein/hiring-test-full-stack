import { useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { useModelsQuery } from '../api/queries';
import { useSetUserConfigMutation } from '../api/mutations';
import { ApiKeyConfigDialog } from './api-key-config-dialog';
import type { LLMProviderType, LLMModel, ProviderStatus } from '../types';
import { cn } from '../../../lib/utils';

interface ModelSelectorProps {
  selectedModelId: string | undefined;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  size?: 'default' | 'large';
}

const PROVIDER_DISPLAY_NAMES: Record<LLMProviderType, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  custom: 'Custom',
};

const PROVIDER_ORDER: LLMProviderType[] = [
  'anthropic',
  'openai',
  'gemini',
  'custom',
];

/**
 * Model Selector Component
 *
 * Dropdown selector for choosing LLM models.
 * Features:
 * - Groups models by provider (Anthropic, OpenAI, Gemini, Custom)
 * - Shows dynamically fetched models from backend
 * - Displays loading and error states
 * - Shows unconfigured providers with "Configure" badge
 * - Includes "Configure API Keys..." menu item
 * - Supports 'large' size variant for empty state
 */
export function ModelSelector({
  selectedModelId,
  onModelChange,
  disabled,
  size = 'default',
}: ModelSelectorProps) {
  const { data: modelsData, isPending, isError } = useModelsQuery();
  const setUserConfigMutation = useSetUserConfigMutation();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [initialConfigProvider, setInitialConfigProvider] =
    useState<LLMProviderType>();

  const groupedModels = useMemo((): Partial<Record<LLMProviderType, LLMModel[]>> => {
    if (!modelsData?.models) return {};

    return modelsData.models.reduce<Partial<Record<LLMProviderType, LLMModel[]>>>(
      (acc, model) => {
        if (!acc[model.provider]) {
          acc[model.provider] = [];
        }
        acc[model.provider]!.push(model);
        return acc;
      },
      {}
    );
  }, [modelsData]);

  const providerStatuses = useMemo(() => {
    const statusMap: Record<LLMProviderType, ProviderStatus | undefined> = {
      anthropic: undefined,
      openai: undefined,
      gemini: undefined,
      custom: undefined,
    };

    modelsData?.providerStatuses?.forEach((status) => {
      statusMap[status.provider] = status;
    });

    // Handle custom provider status
    if (modelsData?.customProvider) {
      statusMap.custom = {
        provider: 'custom',
        isConfigured: modelsData.customProvider.isConfigured,
        displayName: modelsData.customProvider.modelName || 'Custom',
      };
    }

    return statusMap;
  }, [modelsData]);

  const handleValueChange = async (value: string) => {
    // Handle special configuration triggers
    if (value === '__configure__') {
      setInitialConfigProvider(undefined);
      setConfigDialogOpen(true);
      return;
    }

    if (value.startsWith('__configure_')) {
      const provider = value.replace('__configure_', '') as LLMProviderType;
      setInitialConfigProvider(provider);
      setConfigDialogOpen(true);
      return;
    }

    // Save user config when model is selected
    const selectedModel = modelsData?.models.find((m) => m.id === value);
    if (selectedModel) {
      try {
        await setUserConfigMutation.mutateAsync({
          provider: selectedModel.provider,
          modelId: value,
        });
      } catch (error) {
        // Silently fail - user config save is not critical
        console.error('Failed to save user config:', error);
      }
    }

    onModelChange(value);
  };

  const triggerClassName = cn(
    size === 'large' ? 'w-[300px] h-12 text-lg' : 'w-[200px]'
  );

  if (isPending) {
    return (
      <>
        <Select disabled>
          <SelectTrigger className={triggerClassName}>
            <SelectValue placeholder="Loading models..." />
          </SelectTrigger>
        </Select>
        <ApiKeyConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          initialProvider={initialConfigProvider}
        />
      </>
    );
  }

  if (isError || !modelsData) {
    return (
      <>
        <Select disabled>
          <SelectTrigger className={triggerClassName}>
            <SelectValue placeholder="Failed to load models" />
          </SelectTrigger>
        </Select>
        <ApiKeyConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          initialProvider={initialConfigProvider}
        />
      </>
    );
  }

  const selectedModel = selectedModelId
    ? modelsData.models.find((m) => m.id === selectedModelId)
    : undefined;

  // Separate configured and unconfigured providers
  const configuredProviders = PROVIDER_ORDER.filter(
    (p) => (groupedModels[p]?.length ?? 0) > 0
  );
  const unconfiguredProviders = PROVIDER_ORDER.filter((p) => {
    const status = providerStatuses[p];
    const hasModels = (groupedModels[p]?.length ?? 0) > 0;
    // Show as unconfigured if we have status info and it's not configured
    // and there are no models for this provider
    return status && !status.isConfigured && !hasModels;
  });

  const placeholderText =
    configuredProviders.length === 0
      ? 'Please select a provider'
      : 'Select model';

  return (
    <>
      <Select
        value={selectedModelId}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholderText} />
        </SelectTrigger>
        <SelectContent>
          {/* Configured Providers with Models */}
          {configuredProviders.map((provider) => (
            <SelectGroup key={provider}>
              <SelectLabel>{PROVIDER_DISPLAY_NAMES[provider]}</SelectLabel>
              {groupedModels[provider]?.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}

          {/* Unconfigured Providers */}
          {unconfiguredProviders.length > 0 && (
            <>
              {configuredProviders.length > 0 && <SelectSeparator />}
              {unconfiguredProviders.map((provider) => (
                <SelectItem
                  key={`configure-${provider}`}
                  value={`__configure_${provider}`}
                  className="text-muted-foreground"
                >
                  <span className="flex items-center justify-between w-full gap-2">
                    {PROVIDER_DISPLAY_NAMES[provider]}
                    <Badge variant="secondary" className="text-xs">
                      Configure
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </>
          )}

          {/* Configure API Keys Menu Item */}
          <SelectSeparator />
          <SelectItem value="__configure__" className="text-muted-foreground">
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configure API Keys...
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <ApiKeyConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        initialProvider={initialConfigProvider}
      />
    </>
  );
}
