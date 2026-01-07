import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CalcomSettings {
  id: string;
  enabled: boolean;
  api_key: string | null;
  event_type_slug: string | null;
  webhook_secret: string | null;
}

export function useCalcomSettings() {
  const [settings, setSettings] = useState<CalcomSettings>({
    id: '',
    enabled: false,
    api_key: null,
    event_type_slug: null,
    webhook_secret: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('calcom_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching cal.com settings:', error);
      setIsLoading(false);
      return;
    }

    if (data) {
      setSettings({
        id: data.id,
        enabled: data.enabled,
        api_key: data.api_key,
        event_type_slug: data.event_type_slug,
        webhook_secret: data.webhook_secret,
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Omit<CalcomSettings, 'id'>>) => {
    // If no settings exist yet, create a new row
    if (!settings.id) {
      const { data, error } = await supabase
        .from('calcom_settings')
        .insert({
          enabled: updates.enabled ?? false,
          api_key: updates.api_key ?? null,
          event_type_slug: updates.event_type_slug ?? null,
          webhook_secret: updates.webhook_secret ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating cal.com settings:', error);
        return false;
      }

      if (data) {
        setSettings({
          id: data.id,
          enabled: data.enabled,
          api_key: data.api_key,
          event_type_slug: data.event_type_slug,
          webhook_secret: data.webhook_secret,
        });
      }
      return true;
    }

    // Update existing row
    const { error } = await supabase
      .from('calcom_settings')
      .update(updates)
      .eq('id', settings.id);

    if (error) {
      console.error('Error updating cal.com settings:', error);
      return false;
    }

    setSettings(prev => ({ ...prev, ...updates }));
    return true;
  };

  return {
    settings,
    isLoading,
    updateSettings,
    refetch: fetchSettings,
  };
}
