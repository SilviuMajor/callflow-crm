import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CalcomFieldMappings {
  phone?: string;
  company?: string;
  jobTitle?: string;
  [key: string]: string | undefined;
}

export interface CalcomSettings {
  id: string;
  enabled: boolean;
  api_key: string | null;
  event_type_slug: string | null;
  webhook_secret: string | null;
  field_mappings: CalcomFieldMappings;
}

export interface CalcomBookingField {
  slug: string;
  label: string;
  type: string;
}

export function useCalcomSettings() {
  const [settings, setSettings] = useState<CalcomSettings>({
    id: '',
    enabled: false,
    api_key: null,
    event_type_slug: null,
    webhook_secret: null,
    field_mappings: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [availableFields, setAvailableFields] = useState<CalcomBookingField[]>([]);
  const [isFetchingFields, setIsFetchingFields] = useState(false);

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
        field_mappings: (data.field_mappings as CalcomFieldMappings) || {},
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const fetchBookingFields = useCallback(async (eventSlug: string, apiKey: string): Promise<{ fields: CalcomBookingField[]; error?: string }> => {
    if (!eventSlug) return { fields: [], error: 'Event slug is required' };
    if (!apiKey) return { fields: [], error: 'API key is required' };
    
    setIsFetchingFields(true);
    try {
      const { data, error } = await supabase.functions.invoke('calcom-booking-fields', {
        body: { eventSlug, apiKey }
      });

      if (error) {
        console.error('Error fetching booking fields:', error);
        return { fields: [], error: error.message || 'Failed to fetch fields' };
      }

      if (data?.error) {
        console.error('Cal.com API error:', data.error);
        return { fields: [], error: data.error };
      }

      const fields = data?.fields || [];
      setAvailableFields(fields);
      return { fields };
    } catch (err) {
      console.error('Error fetching booking fields:', err);
      return { fields: [], error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setIsFetchingFields(false);
    }
  }, []);

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
          field_mappings: updates.field_mappings ?? {},
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
          field_mappings: (data.field_mappings as CalcomFieldMappings) || {},
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
    availableFields,
    isFetchingFields,
    fetchBookingFields,
  };
}
