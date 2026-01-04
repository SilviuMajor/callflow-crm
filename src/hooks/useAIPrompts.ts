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
  { value: 'sonar', label: 'Sonar (Fast)' },
  { value: 'sonar-pro', label: 'Sonar Pro (Multi-step reasoning)' },
  { value: 'sonar-reasoning', label: 'Sonar Reasoning (Chain-of-thought)' },
  { value: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro (Advanced)' },
  { value: 'sonar-deep-research', label: 'Sonar Deep Research (Expert)' },
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
