import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CalendlySettings {
  id: string;
  enabled: boolean;
  calendly_url: string;
  personal_access_token: string | null;
  webhook_signing_key: string | null;
}

export function useCalendlySettings() {
  const [settings, setSettings] = useState<CalendlySettings>({
    id: '',
    enabled: false,
    calendly_url: '',
    personal_access_token: null,
    webhook_signing_key: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('calendly_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching calendly settings:', error);
      return;
    }

    if (data) {
      setSettings({
        id: data.id,
        enabled: data.enabled,
        calendly_url: data.calendly_url,
        personal_access_token: data.personal_access_token,
        webhook_signing_key: data.webhook_signing_key,
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Omit<CalendlySettings, 'id'>>) => {
    // If no settings exist yet, create a new row
    if (!settings.id) {
      const { data, error } = await supabase
        .from('calendly_settings')
        .insert({
          enabled: updates.enabled ?? false,
          calendly_url: updates.calendly_url ?? '',
          personal_access_token: updates.personal_access_token ?? null,
          webhook_signing_key: updates.webhook_signing_key ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating calendly settings:', error);
        return false;
      }

      if (data) {
        setSettings({
          id: data.id,
          enabled: data.enabled,
          calendly_url: data.calendly_url,
          personal_access_token: data.personal_access_token,
          webhook_signing_key: data.webhook_signing_key,
        });
      }
      return true;
    }

    // Update existing row
    const { error } = await supabase
      .from('calendly_settings')
      .update(updates)
      .eq('id', settings.id);

    if (error) {
      console.error('Error updating calendly settings:', error);
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
