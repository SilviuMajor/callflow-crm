import { useState, useEffect } from 'react';
import { TopNav } from '@/components/TopNav';
import { useAIPrompts, AI_MODELS, AIPrompt } from '@/hooks/useAIPrompts';
import { useSellerCompany } from '@/hooks/useSellerCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sparkles, Building2, Users, Target, Save, Loader2, RotateCcw, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineEditField } from '@/components/InlineEditField';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const PROMPT_CONFIG = {
  company_search: {
    title: 'Company Research',
    description: 'AI will research the company when you click Generate. Uses company name and website.',
    icon: Building2,
    placeholders: ['{company_name}', '{website}', '{seller_context}'],
    color: 'text-blue-500',
    defaultPrompt: `Research the company {company_name}. Their website is {website}.

Provide a comprehensive overview including:
1. What the company does and their main products/services
2. Their target market and customers
3. Company size and notable information
4. Recent news or developments

{seller_context}

Keep the response concise but informative.`,
  },
  company_custom: {
    title: 'Custom Company Research',
    description: 'Custom research based on your specific needs. Define your product/service context here.',
    icon: Target,
    placeholders: ['{company_name}', '{website}', '{seller_context}'],
    color: 'text-purple-500',
    defaultPrompt: `Research how to approach {company_name} ({website}) as a potential customer.

{seller_context}

Based on this context, provide:
1. How our offering could benefit them
2. Potential pain points we could address
3. Suggested talking points for the sales call
4. Any relevant angles to approach them with`,
  },
  persona: {
    title: 'Contact Persona',
    description: 'AI will research the contact person to understand their role and how to approach them.',
    icon: Users,
    placeholders: ['{first_name}', '{last_name}', '{job_title}', '{company}', '{seller_context}'],
    color: 'text-emerald-500',
    defaultPrompt: `Research {first_name} {last_name}, {job_title} at {company}.

Provide insights on:
1. Their likely responsibilities and priorities
2. Common challenges for someone in their role
3. How to build rapport with them
4. Suggested approach for the conversation

{seller_context}

Keep the response focused and actionable.`,
  },
};

const SELLER_FIELDS = [
  { key: 'company_name', label: 'Company Name', placeholder: 'Your company name' },
  { key: 'website', label: 'Website', placeholder: 'https://yourcompany.com' },
  { key: 'product_offering', label: 'Product/Service Offering', placeholder: 'What you sell...', multiline: true },
  { key: 'usps', label: 'Unique Selling Points (USPs)', placeholder: 'What makes you different...', multiline: true },
  { key: 'industry', label: 'Industry/Vertical', placeholder: 'SaaS, Healthcare, etc.' },
  { key: 'target_audience', label: 'Target Audience', placeholder: 'Who your ideal customers are...' },
  { key: 'tone_style', label: 'Communication Tone/Style', placeholder: 'Professional, casual, consultative...' },
  { key: 'pain_points_solved', label: 'Pain Points We Solve', placeholder: 'Problems your product addresses...', multiline: true },
  { key: 'product_sets', label: 'Product Sets/Tiers', placeholder: 'Different product lines or packages...', multiline: true },
];

export default function AISettingsPage() {
  const { prompts, isLoading, updatePrompt, refetch } = useAIPrompts();
  const { sellerCompany, isLoading: isLoadingSeller, updateField } = useSellerCompany();
  const [editedPrompts, setEditedPrompts] = useState<Record<string, Partial<AIPrompt & { default_prompt?: string }>>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (prompts.length > 0) {
      const initial: Record<string, Partial<AIPrompt & { default_prompt?: string }>> = {};
      prompts.forEach(p => {
        initial[p.prompt_type] = { 
          prompt: p.prompt, 
          model: p.model, 
          enabled: p.enabled,
          default_prompt: (p as any).default_prompt || PROMPT_CONFIG[p.prompt_type as keyof typeof PROMPT_CONFIG]?.defaultPrompt
        };
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

  const handleRestoreDefault = (promptType: string) => {
    const config = PROMPT_CONFIG[promptType as keyof typeof PROMPT_CONFIG];
    if (!config) return;

    setEditedPrompts(prev => ({
      ...prev,
      [promptType]: { 
        ...prev[promptType], 
        prompt: config.defaultPrompt 
      }
    }));
    toast.success('Default prompt restored. Click Save to apply.');
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

  const handleSellerFieldSave = async (field: string, value: string) => {
    try {
      await updateField(field as any, value);
      toast.success('Saved');
    } catch {
      // Error already handled in hook
    }
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

        {/* Seller Company Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Our Company Profile</CardTitle>
            </div>
            <CardDescription>
              Your company details will be injected into AI prompts via the {'{seller_context}'} placeholder.
              This helps AI generate more relevant, personalized research.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSeller ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {SELLER_FIELDS.map(field => (
                  <div key={field.key} className={field.multiline ? 'sm:col-span-2' : ''}>
                    <Label htmlFor={field.key} className="text-sm font-medium mb-1.5 block">
                      {field.label}
                    </Label>
                    {field.multiline ? (
                      <Textarea
                        id={field.key}
                        value={(sellerCompany as any)?.[field.key] || ''}
                        onChange={(e) => {}}
                        onBlur={(e) => handleSellerFieldSave(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="min-h-[80px] text-sm"
                        defaultValue={(sellerCompany as any)?.[field.key] || ''}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        defaultValue={(sellerCompany as any)?.[field.key] || ''}
                        onBlur={(e) => handleSellerFieldSave(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <h2 className="text-lg font-semibold mb-4">AI Prompt Templates</h2>

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
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${type}-prompt`}>Prompt Template</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestoreDefault(type)}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore Default
                        </Button>
                      </div>
                      <Textarea
                        id={`${type}-prompt`}
                        value={edited.prompt ?? prompt?.prompt ?? ''}
                        onChange={(e) => handleChange(type, 'prompt', e.target.value)}
                        className="min-h-[150px] font-mono text-sm"
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
                        value={edited.model ?? prompt?.model ?? 'perplexity:sonar'}
                        onValueChange={(value) => handleChange(type, 'model', value)}
                      >
                        <SelectTrigger id={`${type}-model`} className="w-full max-w-md">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Perplexity (Web Search + Citations)
                          </div>
                          {AI_MODELS.filter(m => m.provider === 'perplexity').map(model => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                            OpenAI / ChatGPT
                          </div>
                          {AI_MODELS.filter(m => m.provider === 'openai').map(model => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Perplexity models include real-time web search and citations. OpenAI models use training knowledge.
                      </p>
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
