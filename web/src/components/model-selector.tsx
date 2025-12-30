import { useModelsQuery } from '../data/queries/models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import Spinner from './ui/spinner';

interface ModelSelectorProps {
  selectedModelId?: string | null;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModelId, onModelChange }: ModelSelectorProps) {
  const { data, isPending, isError } = useModelsQuery();

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <Spinner />
        <span className="text-sm text-muted-foreground">Loading models...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-sm text-destructive">
        Failed to load models
      </div>
    );
  }

  const models = data.models || [];
  const defaultModelId = data.defaultModelId || (models.length > 0 ? models[0].id : '');
  const currentModelId = selectedModelId || defaultModelId;

  return (
    <Select value={currentModelId} onValueChange={onModelChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
