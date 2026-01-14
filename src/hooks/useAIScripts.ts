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
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SCRIPT_TEMPLATE = `Hi {first_name}, this is [Your Name] from {seller_company_name}.

{{AI_BLOCK:Generate a 1-sentence opening hook referencing something specific from their company research that connects to our product}}

The reason I'm calling is that we help companies like {company} with {seller_pain_points_solved}.

{{AI_BLOCK:Based on their industry and the contact's role as {job_title}, generate 2-3 specific pain points they likely experience}}

I'd love to share how we've helped similar companies in the {seller_industry} space.

{{AI_BLOCK:Generate a soft close question that relates to their specific situation}}`;

export function useAIScripts() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [scripts, setScripts] = useState<AIScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScripts = useCallback(async () => {
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
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching scripts:', error);
        throw error;
      }

      if (data && data.length > 0) {
        setScripts(data.map(s => ({
          ...s,
          is_default: s.is_default ?? false,
        })));
      } else {
        // Create default script if none exists
        const { data: newScript, error: insertError } = await supabase
          .from('ai_scripts')
          .insert({
            name: 'Default Script',
            template: DEFAULT_SCRIPT_TEMPLATE,
            model: 'perplexity:sonar',
            enabled: true,
            is_default: true,
            organization_id: organizationId,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newScript) {
          setScripts([{ ...newScript, is_default: newScript.is_default ?? true }]);
        }
      }
    } catch (error) {
      console.error('Failed to load AI Scripts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const createScript = useCallback(async (name: string) => {
    if (!organizationId) {
      toast.error('Not authenticated');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('ai_scripts')
        .insert({
          name,
          template: DEFAULT_SCRIPT_TEMPLATE,
          model: 'perplexity:sonar',
          enabled: true,
          is_default: false,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setScripts(prev => [...prev, { ...data, is_default: data.is_default ?? false }]);
        toast.success('Script created');
        return data;
      }
    } catch (error) {
      console.error('Failed to create script:', error);
      toast.error('Failed to create script');
    }
    return null;
  }, [organizationId]);

  const updateScript = useCallback(async (
    id: string, 
    updates: Partial<Pick<AIScript, 'name' | 'template' | 'model' | 'enabled'>>
  ) => {
    try {
      const { error } = await supabase
        .from('ai_scripts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setScripts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      toast.success('Script saved');
    } catch (error) {
      console.error('Failed to update script:', error);
      toast.error('Failed to save script');
    }
  }, []);

  const setDefault = useCallback(async (id: string) => {
    if (!organizationId) return;
    
    try {
      // First, unset all defaults for this organization
      await supabase
        .from('ai_scripts')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
        .neq('id', id);

      // Set the new default
      const { error } = await supabase
        .from('ai_scripts')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      setScripts(prev => prev.map(s => ({ ...s, is_default: s.id === id })));
      toast.success('Default script updated');
    } catch (error) {
      console.error('Failed to set default script:', error);
      toast.error('Failed to set default');
    }
  }, [organizationId]);

  const deleteScript = useCallback(async (id: string) => {
    const script = scripts.find(s => s.id === id);
    if (script?.is_default) {
      toast.error('Cannot delete the default script');
      return false;
    }

    if (scripts.length <= 1) {
      toast.error('Must have at least one script');
      return false;
    }

    try {
      const { error } = await supabase
        .from('ai_scripts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setScripts(prev => prev.filter(s => s.id !== id));
      toast.success('Script deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete script:', error);
      toast.error('Failed to delete script');
      return false;
    }
  }, [scripts]);

  const restoreDefault = useCallback((id: string) => {
    setScripts(prev => prev.map(s => 
      s.id === id ? { ...s, template: DEFAULT_SCRIPT_TEMPLATE } : s
    ));
    toast.success('Default template restored. Click Save to apply.');
  }, []);

  const getDefaultScript = useCallback(() => {
    return scripts.find(s => s.is_default) || scripts[0];
  }, [scripts]);

  return {
    scripts,
    isLoading,
    createScript,
    updateScript,
    setDefault,
    deleteScript,
    restoreDefault,
    getDefaultScript,
    refetch: fetchScripts,
    defaultTemplate: DEFAULT_SCRIPT_TEMPLATE,
  };
}
