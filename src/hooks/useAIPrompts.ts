import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIPrompt {
  id: string;
  prompt_type: string;
  name: string;
  prompt: string;
  model: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const AI_MODELS = [
  // Perplexity Models (Web-grounded search with citations)
  { value: 'perplexity:sonar', label: 'Perplexity Sonar (Fast)', provider: 'perplexity' },
  { value: 'perplexity:sonar-pro', label: 'Perplexity Sonar Pro (Multi-step)', provider: 'perplexity' },
  { value: 'perplexity:sonar-reasoning', label: 'Perplexity Sonar Reasoning', provider: 'perplexity' },
  { value: 'perplexity:sonar-reasoning-pro', label: 'Perplexity Sonar Reasoning Pro', provider: 'perplexity' },
  { value: 'perplexity:sonar-deep-research', label: 'Perplexity Deep Research (Expert)', provider: 'perplexity' },
  // OpenAI Models (ChatGPT)
  { value: 'openai:gpt-4o-mini', label: 'ChatGPT-4o Mini (Fast)', provider: 'openai' },
  { value: 'openai:gpt-4o', label: 'ChatGPT-4o (Vision capable)', provider: 'openai' },
  { value: 'openai:gpt-5-nano-2025-08-07', label: 'ChatGPT-5 Nano (Fastest)', provider: 'openai' },
  { value: 'openai:gpt-5-mini-2025-08-07', label: 'ChatGPT-5 Mini (Balanced)', provider: 'openai' },
  { value: 'openai:gpt-5-2025-08-07', label: 'ChatGPT-5 (Flagship)', provider: 'openai' },
  // Anthropic Models (Claude)
  { value: 'anthropic:claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (Recommended)', provider: 'anthropic' },
  { value: 'anthropic:claude-opus-4-5-20251101', label: 'Claude Opus 4.5 (Premium)', provider: 'anthropic' },
  { value: 'anthropic:claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'anthropic' },
  { value: 'anthropic:claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet', provider: 'anthropic' },
  { value: 'anthropic:claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast)', provider: 'anthropic' },
];

export function useAIPrompts() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .order('prompt_type');

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching AI prompts:', error);
      toast.error('Failed to load AI prompts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const getPrompt = useCallback((promptType: string) => {
    return prompts.find(p => p.prompt_type === promptType);
  }, [prompts]);

  const updatePrompt = useCallback(async (
    promptType: string, 
    updates: Partial<Pick<AIPrompt, 'name' | 'prompt' | 'model' | 'enabled'>>
  ) => {
    try {
      const { error } = await supabase
        .from('ai_prompts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('prompt_type', promptType);

      if (error) throw error;

      setPrompts(prev => prev.map(p => 
        p.prompt_type === promptType ? { ...p, ...updates } : p
      ));
      
      toast.success('Prompt updated successfully');
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast.error('Failed to update prompt');
      throw error;
    }
  }, []);

  return {
    prompts,
    isLoading,
    getPrompt,
    updatePrompt,
    refetch: fetchPrompts,
  };
}
