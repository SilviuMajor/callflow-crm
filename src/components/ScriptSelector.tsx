import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIScripts } from '@/hooks/useAIScripts';
import { Scroll, Star } from 'lucide-react';

interface ScriptSelectorProps {
  value: string | null;
  onChange: (scriptId: string) => void;
  disabled?: boolean;
}

export function ScriptSelector({ value, onChange, disabled }: ScriptSelectorProps) {
  const { scripts, isLoading, getDefaultScript } = useAIScripts();

  // Use default script if no value is set
  const selectedValue = value || getDefaultScript()?.id || '';

  if (isLoading || scripts.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedValue}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px] h-8 text-xs">
        <div className="flex items-center gap-1.5">
          <Scroll className="h-3 w-3" />
          <SelectValue placeholder="Select script" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {scripts
          .filter(s => s.enabled)
          .map(script => (
            <SelectItem key={script.id} value={script.id}>
              <div className="flex items-center gap-1.5">
                {script.is_default && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                <span>{script.name}</span>
              </div>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
