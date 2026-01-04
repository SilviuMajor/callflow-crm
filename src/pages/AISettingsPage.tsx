import { useState, useEffect } from 'react';
import { TopNav } from '@/components/TopNav';
import { useAIPrompts, AI_MODELS, AIPrompt } from '@/hooks/useAIPrompts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sparkles, Building2, Users, Target, Save, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PROMPT_CONFIG = {
  company_search: {
    title: 'Company Research',
    description: 'AI will research the company when you first view a contact. Uses company name and website.',
    icon: Building2,
    placeholders: ['{company_name}', '{website}'],
    color: 'text-blue-500',
  },
  company_custom: {
    title: 'Custom Company Research',
    description: 'Custom research based on your specific needs (e.g., how to sell to them). Define your product/service context here.',
    icon: Target,
    placeholders: ['{company_name}', '{website}'],
    color: 'text-purple-500',
  },
  persona: {
    title: 'Contact Persona',
    description: 'AI will research the contact person to understand their role and how to approach them.',
    icon: Users,
    placeholders: ['{first_name}', '{last_name}', '{job_title}', '{company}'],
    color: 'text-emerald-500',
  },
};

export default function AISettingsPage() {
  const { prompts, isLoading, updatePrompt } = useAIPrompts();
  const [editedPrompts, setEditedPrompts] = useState<Record<string, Partial<AIPrompt>>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (prompts.length > 0) {
      const initial: Record<string, Partial<AIPrompt>> = {};
      prompts.forEach(p => {
        initial[p.prompt_type] = { prompt: p.prompt, model: p.model, enabled: p.enabled };
      });
      setEditedPrompts(initial);
    }
  }, [prompts]);

  const handleSave = async (promptType: string) => {
    const edits = editedPrompts[promptType];
    if (!edits) return;

    setSavingStates(prev => ({ ...prev, [promptType]: true }));
    try {
      await updatePrompt(promptType, edits);
    } finally {
      setSavingStates(prev => ({ ...prev, [promptType]: false }));
    }
  };

  const handleChange = (promptType: string, field: keyof AIPrompt, value: string | boolean) => {
    setEditedPrompts(prev => ({
      ...prev,
      [promptType]: { ...prev[promptType], [field]: value }
    }));
  };

  const hasChanges = (promptType: string) => {
    const original = prompts.find(p => p.prompt_type === promptType);
    const edited = editedPrompts[promptType];
    if (!original || !edited) return false;
    return (
      edited.prompt !== original.prompt ||
      edited.model !== original.model ||
      edited.enabled !== original.enabled
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Research Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure how AI researches companies and contacts. Use placeholders to inject dynamic data.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-10 w-48" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(PROMPT_CONFIG).map(([type, config]) => {
              const prompt = prompts.find(p => p.prompt_type === type);
              const edited = editedPrompts[type] || {};
              const Icon = config.icon;
              const isSaving = savingStates[type];
              const changed = hasChanges(type);

              return (
                <Card key={type} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <CardTitle className="text-lg">{config.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${type}-enabled`} className="text-sm text-muted-foreground">
                          {edited.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`${type}-enabled`}
                          checked={edited.enabled ?? prompt?.enabled ?? true}
                          onCheckedChange={(checked) => handleChange(type, 'enabled', checked)}
                        />
                      </div>
                    </div>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${type}-prompt`}>Prompt Template</Label>
                      <Textarea
                        id={`${type}-prompt`}
                        value={edited.prompt ?? prompt?.prompt ?? ''}
                        onChange={(e) => handleChange(type, 'prompt', e.target.value)}
                        className="min-h-[120px] font-mono text-sm"
                        placeholder="Enter your prompt template..."
                      />
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">Available placeholders:</span>
                        {config.placeholders.map(p => (
                          <code key={p} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {p}
                          </code>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${type}-model`}>AI Model</Label>
                      <Select
                        value={edited.model ?? prompt?.model ?? 'sonar'}
                        onValueChange={(value) => handleChange(type, 'model', value)}
                      >
                        <SelectTrigger id={`${type}-model`} className="w-full max-w-xs">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map(model => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={() => handleSave(type)}
                        disabled={!changed || isSaving}
                        size="sm"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
