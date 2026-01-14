import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface AIScript {
  id: string;
  name: string;
  template: string;
  model: string | null;
  enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SCRIPT_TEMPLATE = `Hi {first_name}, this is [Your Name] from {seller_company_name}.

{{AI_BLOCK:Generate a 1-sentence opening hook referencing something specific from their company research that connects to our product}}

The reason I'm calling is that we help companies like {company} with {seller_pain_points_solved}.

{{AI_BLOCK:Based on their industry and the contact's role as {job_title}, generate 2-3 specific pain points they likely experience}}

I'd love to share how we've helped similar companies in the {seller_industry} space.

{{AI_BLOCK:Generate a soft close question that relates to their specific situation}}`;

export function useAIScript() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [script, setScript] = useState<AIScript | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScript = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_scripts')
        .select('*')
        .eq('organization_id', organizationId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching script:', error);
        throw error;
      }

      if (data) {
        setScript(data);
      } else {
        const { data: newScript, error: insertError } = await supabase
          .from('ai_scripts')
          .insert({
            name: 'Call Script',
            template: DEFAULT_SCRIPT_TEMPLATE,
            model: 'perplexity:sonar',
            enabled: true,
            organization_id: organizationId,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setScript(newScript);
      }
    } catch (error) {
      console.error('Failed to load AI Script:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchScript();
  }, [fetchScript]);

  const updateScript = useCallback(async (updates: Partial<Pick<AIScript, 'name' | 'template' | 'model' | 'enabled'>>) => {
    if (!script) return;

    try {
      const { error } = await supabase
        .from('ai_scripts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', script.id);

      if (error) throw error;

      setScript(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Script saved');
    } catch (error) {
      console.error('Failed to update script:', error);
      toast.error('Failed to save script');
    }
  }, [script]);

  const restoreDefault = useCallback(() => {
    setScript(prev => prev ? { ...prev, template: DEFAULT_SCRIPT_TEMPLATE } : null);
    toast.success('Default template restored. Click Save to apply.');
  }, []);

  return {
    script,
    isLoading,
    updateScript,
    restoreDefault,
    refetch: fetchScript,
    defaultTemplate: DEFAULT_SCRIPT_TEMPLATE,
  };
}
