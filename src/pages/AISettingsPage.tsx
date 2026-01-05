import { useState, useEffect, useCallback, useMemo } from 'react';
import { TopNav } from '@/components/TopNav';
import { useAIPrompts, AI_MODELS, AIPrompt } from '@/hooks/useAIPrompts';
import { useSellerCompany } from '@/hooks/useSellerCompany';
import { useSellerCustomFields } from '@/hooks/useSellerCustomFields';
import { useCustomFields } from '@/hooks/useCustomFields';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sparkles, Building2, Users, Target, Save, Loader2, RotateCcw, Briefcase, Wand2, FlaskConical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PlaceholderToolbar } from '@/components/PlaceholderToolbar';
import { SellerCustomFieldsDialog } from '@/components/SellerCustomFieldsDialog';
import { PromptEditor } from '@/components/PromptEditor';
import { RefinePromptDialog } from '@/components/RefinePromptDialog';
import { type PlaceholderCategory } from '@/components/PlaceholderBadge';
import { supabase } from '@/integrations/supabase/client';
import { getSellerFieldColorClasses } from '@/lib/utils';

const PROMPT_CONFIG = {
  company_search: {
    title: 'Company Research',
    description: 'AI will research the company when you click Generate. Uses company name and website.',
    icon: Building2,
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
  custom_company_research: {
    title: 'Targeted Research and Suggestions',
    description: 'Custom research using your company context. Drag or click placeholders to build your prompt.',
    icon: Target,
    color: 'text-purple-500',
    defaultPrompt: `Research how to approach {company_name} ({website}) as a potential customer for {seller_company_name}.

About us:
- We are in the {seller_industry} industry
- Our product/service: {seller_product_offering}
- Our unique selling points: {seller_usps}
- Pain points we address: {seller_pain_points_solved}
- Our target audience: {seller_target_audience}

Based on this context, provide:
1. How our offering could specifically benefit {company_name}
2. Potential pain points at {company_name} we could address
3. Suggested talking points that align with our {seller_tone_style} communication style
4. Any specific angles to approach them with given their industry

Keep the response actionable and focused.`,
  },
  persona: {
    title: 'Contact Persona',
    description: 'AI will research the contact person to understand their role and how to approach them.',
    icon: Users,
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
} as const;

// Define explicit order for prompt types
const PROMPT_ORDER = ['company_search', 'company_custom', 'persona'];

const SELLER_FIELDS = [
  { key: 'company_name', label: 'Company Name', placeholder: 'Your company name' },
  { key: 'website', label: 'Website', placeholder: 'https://yourcompany.com' },
  { key: 'product_offering', label: 'Product/Service Offering', placeholder: 'What you sell...', multiline: true },
  { key: 'usps', label: 'Unique Selling Points (USPs)', placeholder: 'What makes you different...', multiline: true },
  { key: 'industry', label: 'Industry/Vertical', placeholder: 'SaaS, Healthcare, etc.' },
  { key: 'target_audience', label: 'Target Audience', placeholder: 'Who your ideal customers are...' },
  { key: 'tone_style', label: 'Communication Tone/Style', placeholder: 'Professional, casual, consultative...' },
  { key: 'pain_points_solved', label: 'Pain Points We Solve', placeholder: 'Problems your product addresses...', multiline: true },
];

// Standard contact placeholders
const CONTACT_PLACEHOLDERS = [
  { name: 'first_name', description: 'Contact first name' },
  { name: 'last_name', description: 'Contact last name' },
  { name: 'job_title', description: 'Contact job title' },
  { name: 'company_name', description: 'Contact company name' },
  { name: 'company', description: 'Contact company (alias)' },
  { name: 'website', description: 'Contact website' },
];

// Built-in seller company placeholders
const SELLER_PLACEHOLDERS = [
  { name: 'seller_company_name', description: 'Your company name' },
  { name: 'seller_website', description: 'Your website' },
  { name: 'seller_product_offering', description: 'Your product/service' },
  { name: 'seller_usps', description: 'Your USPs' },
  { name: 'seller_industry', description: 'Your industry' },
  { name: 'seller_target_audience', description: 'Your target audience' },
  { name: 'seller_tone_style', description: 'Your communication style' },
  { name: 'seller_pain_points_solved', description: 'Pain points you solve' },
  { name: 'seller_context', description: 'All seller info combined' },
];

// AI Research Results placeholders (require prior research to be run)
const AI_RESEARCH_PLACEHOLDERS = [
  { name: 'company_research', description: 'AI-generated company summary (requires Company Research)' },
  { name: 'contact_persona', description: 'AI-generated contact persona (requires Persona research)' },
];

export default function AISettingsPage() {
  const { prompts, isLoading, updatePrompt } = useAIPrompts();
  const { sellerCompany, isLoading: isLoadingSeller, updateField } = useSellerCompany();
  const { fields: sellerCustomFields } = useSellerCustomFields();
  const { fields: customContactFields } = useCustomFields();
  const [editedPrompts, setEditedPrompts] = useState<Record<string, Partial<AIPrompt & { default_prompt?: string }>>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [improvingStates, setImprovingStates] = useState<Record<string, boolean>>({});
  const [refineDialogOpen, setRefineDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    if (prompts.length > 0) {
      const initial: Record<string, Partial<AIPrompt & { default_prompt?: string }>> = {};
      prompts.forEach(p => {
        const configKey = p.prompt_type === 'company_custom' ? 'custom_company_research' : p.prompt_type;
        initial[p.prompt_type] = { 
          prompt: p.prompt, 
          model: p.model, 
          enabled: p.enabled,
          default_prompt: (p as any).default_prompt || PROMPT_CONFIG[configKey as keyof typeof PROMPT_CONFIG]?.defaultPrompt
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
    const configKey = promptType === 'company_custom' ? 'custom_company_research' : promptType;
    const config = PROMPT_CONFIG[configKey as keyof typeof PROMPT_CONFIG];
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

  // Build placeholder groups for each prompt type - conditionally include seller fields
  const getPlaceholderGroups = useCallback((promptType: string) => {
    const groups: Array<{
      label: string;
      category: PlaceholderCategory;
      placeholders: { name: string; description?: string }[];
    }> = [
      {
        label: 'Contact Fields',
        category: 'contact',
        placeholders: CONTACT_PLACEHOLDERS,
      },
    ];

    // Add custom contact fields if any
    if (customContactFields.length > 0) {
      groups.push({
        label: 'Custom Contact Fields',
        category: 'custom_contact',
        placeholders: customContactFields.map(f => ({ 
          name: f.key, 
          description: f.label 
        })),
      });
    }

    // Only show seller placeholders for Targeted Research and Suggestions (company_custom) and persona
    if (promptType === 'company_custom' || promptType === 'custom_company_research' || promptType === 'persona') {
      const sellerPlaceholders = [...SELLER_PLACEHOLDERS];
      
      // Add custom seller fields
      if (sellerCustomFields.length > 0) {
        sellerCustomFields.forEach(f => {
          sellerPlaceholders.push({
            name: `seller_${f.key}`,
            description: f.label,
          });
        });
      }

      groups.push({
        label: 'My Company Fields',
        category: 'seller',
        placeholders: sellerPlaceholders,
      });

      // Add AI Research Results placeholders for company_custom and persona prompts
      // company_research only for company_custom, contact_persona only for company_custom
      if (promptType === 'company_custom' || promptType === 'custom_company_research') {
        groups.push({
          label: 'AI Research Results',
          category: 'ai_research',
          placeholders: [{ name: 'company_research', description: 'AI-generated company summary (requires Company Research)' }],
        });
        groups.push({
          label: 'AI Persona',
          category: 'ai_persona' as PlaceholderCategory,
          placeholders: [{ name: 'contact_persona', description: 'AI-generated contact persona (requires Persona research)' }],
        });
      }
    }

    return groups;
  }, [customContactFields, sellerCustomFields]);

  // Calculate which seller fields are empty
  const emptySellerFields = useMemo(() => {
    const emptySet = new Set<string>();
    
    if (!sellerCompany) {
      // All seller fields are empty
      ['seller_company_name', 'seller_website', 'seller_product_offering', 
       'seller_usps', 'seller_industry', 'seller_target_audience', 
       'seller_tone_style', 'seller_pain_points_solved', 'seller_context'].forEach(f => emptySet.add(f));
      // Add custom seller fields as empty too
      sellerCustomFields.forEach(f => emptySet.add(`seller_${f.key}`));
    } else {
      // Check each built-in field
      if (!sellerCompany.company_name?.trim()) emptySet.add('seller_company_name');
      if (!sellerCompany.website?.trim()) emptySet.add('seller_website');
      if (!sellerCompany.product_offering?.trim()) emptySet.add('seller_product_offering');
      if (!sellerCompany.usps?.trim()) emptySet.add('seller_usps');
      if (!sellerCompany.industry?.trim()) emptySet.add('seller_industry');
      if (!sellerCompany.target_audience?.trim()) emptySet.add('seller_target_audience');
      if (!sellerCompany.tone_style?.trim()) emptySet.add('seller_tone_style');
      if (!sellerCompany.pain_points_solved?.trim()) emptySet.add('seller_pain_points_solved');
      
      // seller_context is empty if ALL fields are empty
      const hasAnyContent = sellerCompany.company_name?.trim() || sellerCompany.website?.trim() || 
        sellerCompany.product_offering?.trim() || sellerCompany.usps?.trim() || 
        sellerCompany.industry?.trim() || sellerCompany.target_audience?.trim() ||
        sellerCompany.tone_style?.trim() || sellerCompany.pain_points_solved?.trim();
      if (!hasAnyContent) emptySet.add('seller_context');
      
      // Check custom seller fields
      sellerCustomFields.forEach(field => {
        const value = sellerCompany.custom_fields?.[field.key];
        if (!value || (typeof value === 'string' && !value.trim())) {
          emptySet.add(`seller_${field.key}`);
        }
      });
    }
    
    return emptySet;
  }, [sellerCompany, sellerCustomFields]);

  // Handle improve prompt using OpenAI
  const handleImprovePrompt = async (promptType: string) => {
    const currentPrompt = editedPrompts[promptType]?.prompt || '';
    const allPlaceholders = getPlaceholderGroups(promptType)
      .flatMap(g => g.placeholders.map(p => `{${p.name}}`));

    setImprovingStates(prev => ({ ...prev, [promptType]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('improve-prompt', {
        body: { prompt: currentPrompt, availablePlaceholders: allPlaceholders }
      });

      if (error) throw error;

      if (data.improvedPrompt) {
        setEditedPrompts(prev => ({
          ...prev,
          [promptType]: { ...prev[promptType], prompt: data.improvedPrompt }
        }));
        toast.success('Prompt improved! Review changes and click Save.');
      }
    } catch (error) {
      console.error('Failed to improve prompt:', error);
      toast.error('Failed to improve prompt. Please try again.');
    } finally {
      setImprovingStates(prev => ({ ...prev, [promptType]: false }));
    }
  };

  // Map database prompt types to our config
  const getConfigForPromptType = (dbType: string) => {
    // Handle company_custom -> custom_company_research mapping
    if (dbType === 'company_custom') {
      return { type: dbType, config: PROMPT_CONFIG.custom_company_research };
    }
    if (dbType === 'custom_company_research') {
      return { type: dbType, config: PROMPT_CONFIG.custom_company_research };
    }
    return { type: dbType, config: PROMPT_CONFIG[dbType as keyof typeof PROMPT_CONFIG] };
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">My Company Profile</CardTitle>
              </div>
              <SellerCustomFieldsDialog />
            </div>
            <CardDescription>
              Your company details are available as placeholders in AI prompts. 
              Use {'{seller_context}'} for all fields combined, or individual placeholders like {'{seller_company_name}'}.
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
                      <code className={`ml-2 text-xs px-1 py-0.5 rounded ${getSellerFieldColorClasses(`seller_${field.key}`)}`}>
                        {`{seller_${field.key}}`}
                      </code>
                    </Label>
                    {field.multiline ? (
                      <Textarea
                        id={field.key}
                        defaultValue={(sellerCompany as any)?.[field.key] || ''}
                        onBlur={(e) => handleSellerFieldSave(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="min-h-[80px] text-sm"
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
            {/* Sort prompts: company_search first, then company_custom, then persona */}
            {[...prompts]
              .sort((a, b) => {
                const order = ['company_search', 'company_custom', 'persona'];
                const orderA = order.indexOf(a.prompt_type);
                const orderB = order.indexOf(b.prompt_type);
                return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
              })
              .map((prompt) => {
              const { config } = getConfigForPromptType(prompt.prompt_type);
              if (!config) return null;
              
              const edited = editedPrompts[prompt.prompt_type] || {};
              const Icon = config.icon;
              const isSaving = savingStates[prompt.prompt_type];
              const isImproving = improvingStates[prompt.prompt_type];
              const changed = hasChanges(prompt.prompt_type);
              const placeholderGroups = getPlaceholderGroups(prompt.prompt_type);

              return (
                <Card key={prompt.prompt_type} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <CardTitle className="text-lg">{config.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${prompt.prompt_type}-enabled`} className="text-sm text-muted-foreground">
                          {edited.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`${prompt.prompt_type}-enabled`}
                          checked={edited.enabled ?? prompt.enabled ?? true}
                          onCheckedChange={(checked) => handleChange(prompt.prompt_type, 'enabled', checked)}
                        />
                      </div>
                    </div>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Placeholder Toolbar */}
                    <PlaceholderToolbar
                      groups={placeholderGroups}
                      onInsert={() => {}} // Now handled by PromptEditor
                      emptyFields={emptySellerFields}
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${prompt.prompt_type}-prompt`}>Prompt Template</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRefineDialogOpen(prompt.prompt_type)}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <FlaskConical className="h-3 w-3 mr-1" />
                            Refine
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleImprovePrompt(prompt.prompt_type)}
                            disabled={isImproving}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {isImproving ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Improving...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-3 w-3 mr-1" />
                                Improve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreDefault(prompt.prompt_type)}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Restore Default
                          </Button>
                        </div>
                      </div>
                      <PromptEditor
                        value={edited.prompt ?? prompt.prompt ?? ''}
                        onChange={(value) => handleChange(prompt.prompt_type, 'prompt', value)}
                        placeholderGroups={placeholderGroups}
                        emptyFields={emptySellerFields}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${prompt.prompt_type}-model`}>AI Model</Label>
                      <Select
                        value={edited.model ?? prompt.model ?? 'perplexity:sonar'}
                        onValueChange={(value) => handleChange(prompt.prompt_type, 'model', value)}
                      >
                        <SelectTrigger id={`${prompt.prompt_type}-model`} className="w-full max-w-md">
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
                        onClick={() => handleSave(prompt.prompt_type)}
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

        {/* Refine Prompt Dialogs */}
        {prompts.map((prompt) => {
          const { config } = getConfigForPromptType(prompt.prompt_type);
          if (!config) return null;
          const placeholderGroups = getPlaceholderGroups(prompt.prompt_type);
          const currentPromptValue = editedPrompts[prompt.prompt_type]?.prompt ?? prompt.prompt ?? '';
          
          return (
            <RefinePromptDialog
              key={`refine-${prompt.prompt_type}`}
              open={refineDialogOpen === prompt.prompt_type}
              onOpenChange={(open) => setRefineDialogOpen(open ? prompt.prompt_type : null)}
              promptType={prompt.prompt_type}
              promptTitle={config.title}
              currentPrompt={currentPromptValue}
              placeholderGroups={placeholderGroups}
              onApply={(refinedPrompt) => {
                handleChange(prompt.prompt_type, 'prompt', refinedPrompt);
                setRefineDialogOpen(null);
              }}
            />
          );
        })}
      </main>
    </div>
  );
}
