import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { PasswordInput } from '../../../components/ui/password-input';
import { Loader2 } from 'lucide-react';
import {
  useSetProviderMutation,
  useDeleteProviderMutation,
} from '../api/mutations';
import { useModelsQuery } from '../api/queries';
import type { LLMProviderType } from '../types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const apiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required').trim(),
});

const customConfigSchema = z.object({
  baseURL: z.string().url('Must be a valid URL'),
  apiKey: z.string().min(1, 'API key is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  modelName: z.string().min(1, 'Model name is required'),
  customHeaders: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Must be valid JSON' }
    ),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;
type CustomConfigFormValues = z.infer<typeof customConfigSchema>;

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface ApiKeyConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProvider?: LLMProviderType;
}

// =============================================================================
// STANDARD PROVIDER FORM COMPONENT
// =============================================================================

interface ProviderFormProps {
  provider: LLMProviderType;
  providerName: string;
  hasModels: boolean;
}

function ProviderForm({ provider, providerName, hasModels }: ProviderFormProps) {
  const setProviderMutation = useSetProviderMutation();
  const deleteProviderMutation = useDeleteProviderMutation();

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: '',
    },
  });

  const onSubmit = async (data: ApiKeyFormValues) => {
    await setProviderMutation.mutateAsync({
      provider,
      apiKey: data.apiKey,
    });
    form.reset();
  };

  const handleDelete = async () => {
    await deleteProviderMutation.mutateAsync(provider);
  };

  const isSubmitting = setProviderMutation.isPending;
  const isDeleting = deleteProviderMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {providerName}
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasModels
            ? 'API key is configured. You can update or remove it below.'
            : 'Configure your API key to access models from this provider.'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={
                      hasModels ? 'Enter new API key' : 'Enter your API key'
                    }
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your API key will be securely stored and validated before
                  saving.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {hasModels ? 'Update API Key' : 'Save API Key'}
            </Button>

            {hasModels && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Remove API Key
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

// =============================================================================
// CUSTOM LLM FORM COMPONENT
// =============================================================================

function CustomLLMForm() {
  const setProviderMutation = useSetProviderMutation();
  const deleteProviderMutation = useDeleteProviderMutation();
  const { data: modelsData } = useModelsQuery();

  const existingConfig = modelsData?.customProvider;

  const form = useForm<CustomConfigFormValues>({
    resolver: zodResolver(customConfigSchema),
    defaultValues: {
      baseURL: existingConfig?.baseUrl || '',
      apiKey: '',
      modelId: existingConfig?.modelId || '',
      modelName: existingConfig?.modelName || '',
      customHeaders: '',
    },
  });

  const onSubmit = async (data: CustomConfigFormValues) => {
    let customHeaders: string | undefined;
    if (data.customHeaders && data.customHeaders.trim()) {
      try {
        JSON.parse(data.customHeaders);
        customHeaders = data.customHeaders;
      } catch {
        // Validation already handles this
      }
    }

    await setProviderMutation.mutateAsync({
      provider: 'custom',
      apiKey: data.apiKey,
      baseUrl: data.baseURL,
      modelId: data.modelId,
      modelName: data.modelName,
      customHeaders,
    });

    form.setValue('apiKey', '');
  };

  const handleDelete = async () => {
    await deleteProviderMutation.mutateAsync('custom');
    form.reset({
      baseURL: '',
      apiKey: '',
      modelId: '',
      modelName: '',
      customHeaders: '',
    });
  };

  const isSubmitting = setProviderMutation.isPending;
  const isDeleting = deleteProviderMutation.isPending;
  const hasConfig = !!existingConfig;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Custom LLM Provider
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure any OpenAI-compatible LLM provider (Ollama, LM Studio, etc.)
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="baseURL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base URL</FormLabel>
                <FormControl>
                  <Input placeholder="http://localhost:11434/v1" {...field} />
                </FormControl>
                <FormDescription>
                  The base URL of your OpenAI-compatible API endpoint.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={hasConfig ? 'Enter new API key' : 'Enter API key'}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  API key for authentication (use "not-needed" if your server
                  doesn't require auth).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model ID</FormLabel>
                <FormControl>
                  <Input placeholder="llama3.2:latest" {...field} />
                </FormControl>
                <FormDescription>
                  Specify the model ID to use with this provider.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Llama 3.2" {...field} />
                </FormControl>
                <FormDescription>
                  Human-readable name for this model.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customHeaders"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Headers (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                    className="font-mono text-xs"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Additional HTTP headers as JSON. Leave empty if not needed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {hasConfig ? 'Update Configuration' : 'Save Configuration'}
            </Button>

            {hasConfig && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Remove Configuration
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

// =============================================================================
// MAIN DIALOG COMPONENT
// =============================================================================

export function ApiKeyConfigDialog({
  open,
  onOpenChange,
  initialProvider,
}: ApiKeyConfigDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(
    initialProvider || 'anthropic'
  );
  const { data: modelsData } = useModelsQuery();

  useEffect(() => {
    if (initialProvider && initialProvider !== activeTab) {
      setActiveTab(initialProvider);
    }
  }, [initialProvider, activeTab]);

  const hasAnthropicKey =
    (modelsData?.models.filter((m) => m.provider === 'anthropic').length ||
      0) > 0;
  const hasOpenAIKey =
    (modelsData?.models.filter((m) => m.provider === 'openai').length || 0) >
    0;
  const hasGeminiKey =
    (modelsData?.models.filter((m) => m.provider === 'gemini').length || 0) >
    0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure LLM Providers</DialogTitle>
          <DialogDescription>
            Set up your API keys for different LLM providers or configure a
            custom OpenAI-compatible endpoint.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="gemini">Gemini</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-6 pr-2">
            <TabsContent value="anthropic" className="mt-0">
              <ProviderForm
                provider="anthropic"
                providerName="Anthropic Claude"
                hasModels={hasAnthropicKey}
              />
            </TabsContent>

            <TabsContent value="openai" className="mt-0">
              <ProviderForm
                provider="openai"
                providerName="OpenAI GPT"
                hasModels={hasOpenAIKey}
              />
            </TabsContent>

            <TabsContent value="gemini" className="mt-0">
              <ProviderForm
                provider="gemini"
                providerName="Google Gemini"
                hasModels={hasGeminiKey}
              />
            </TabsContent>

            <TabsContent value="custom" className="mt-0">
              <CustomLLMForm />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
