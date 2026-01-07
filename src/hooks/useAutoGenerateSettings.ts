import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AutoGenerateSettings {
  id: string;
  enabled: boolean;
  company_research: boolean;
  contact_persona: boolean;
  targeted_research: boolean;
  script_generation: boolean;
}

const DEFAULT_SETTINGS: Omit<AutoGenerateSettings, 'id'> = {
  enabled: false,
  company_research: true,
  contact_persona: true,
  targeted_research: false,
  script_generation: false,
};

export function useAutoGenerateSettings() {
  const [settings, setSettings] = useState<AutoGenerateSettings>({
    id: '',
    ...DEFAULT_SETTINGS,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_auto_generate_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          enabled: data.enabled,
          company_research: data.company_research,
          contact_persona: data.contact_persona,
          targeted_research: data.targeted_research,
          script_generation: data.script_generation,
        });
      } else {
        // Create default settings
        const { data: newData, error: insertError } = await supabase
          .from('ai_auto_generate_settings')
          .insert(DEFAULT_SETTINGS)
          .select()
          .single();

        if (insertError) throw insertError;
        if (newData) {
          setSettings({
            id: newData.id,
            enabled: newData.enabled,
            company_research: newData.company_research,
            contact_persona: newData.contact_persona,
            targeted_research: newData.targeted_research,
            script_generation: newData.script_generation,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch auto-generate settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<Omit<AutoGenerateSettings, 'id'>>) => {
    if (!settings.id) return false;

    try {
      const { error } = await supabase
        .from('ai_auto_generate_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...updates }));
      toast.success('Auto-generate settings saved');
      return true;
    } catch (error) {
      console.error('Failed to update auto-generate settings:', error);
      toast.error('Failed to save settings');
      return false;
    }
  }, [settings.id]);

  return {
    settings,
    isLoading,
    updateSettings,
    refetch: fetchSettings,
  };
}
