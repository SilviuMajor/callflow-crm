import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StaticScriptSettings {
  id: string;
  enabled: boolean;
  default_expanded: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Omit<StaticScriptSettings, 'id' | 'created_at' | 'updated_at'> = {
  enabled: true,
  default_expanded: false,
};

export function useStaticScriptSettings() {
  const [settings, setSettings] = useState<StaticScriptSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('static_script_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching static script settings:', error);
    }

    if (data) {
      setSettings(data);
    } else {
      // Create default settings if none exist
      const { data: newData, error: insertError } = await supabase
        .from('static_script_settings')
        .insert(DEFAULT_SETTINGS)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating static script settings:', insertError);
      } else {
        setSettings(newData);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Omit<StaticScriptSettings, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!settings) return false;

    const { error } = await supabase
      .from('static_script_settings')
      .update(updates)
      .eq('id', settings.id);

    if (error) {
      console.error('Error updating static script settings:', error);
      return false;
    }

    setSettings(prev => prev ? { ...prev, ...updates } : prev);
    return true;
  };

  return {
    settings,
    isLoading,
    updateSettings,
    refetch: fetchSettings,
  };
}
