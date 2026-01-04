import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WebhookSettings {
  enabled: boolean;
  url: string;
}

const defaultSettings: WebhookSettings = {
  enabled: false,
  url: '',
};

export function useWebhookSettings() {
  const [settings, setSettings] = useState<WebhookSettings>(defaultSettings);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('webhook_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading webhook settings:', error);
      } else if (data) {
        setSettings({
          enabled: data.enabled,
          url: data.url,
        });
        setSettingsId(data.id);
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<WebhookSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    if (settingsId) {
      // Update existing record
      const { error } = await supabase
        .from('webhook_settings')
        .update({
          enabled: newSettings.enabled,
          url: newSettings.url,
        })
        .eq('id', settingsId);

      if (error) {
        console.error('Error updating webhook settings:', error);
        toast.error('Failed to save webhook settings');
      }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('webhook_settings')
        .insert({
          enabled: newSettings.enabled,
          url: newSettings.url,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating webhook settings:', error);
        toast.error('Failed to save webhook settings');
      } else if (data) {
        setSettingsId(data.id);
      }
    }
  }, [settings, settingsId]);

  const sendWebhook = useCallback(async (contact: Record<string, any>): Promise<{ success: boolean; error?: string }> => {
    if (!settings.enabled || !settings.url) {
      return { success: true }; // No webhook configured, proceed
    }

    try {
      const payload = {
        event: 'contact_completed',
        timestamp: new Date().toISOString(),
        contact,
      };

      const response = await fetch(settings.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return { success: false, error: `Webhook returned ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }, [settings]);

  const testWebhook = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!settings.url) {
      return { success: false, error: 'No webhook URL configured' };
    }

    try {
      const payload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        contact: {
          id: 'test-123',
          firstName: 'Test',
          lastName: 'Contact',
          company: 'Test Company',
          jobTitle: 'Test Role',
          phone: '+44 7700 000000',
          email: 'test@example.com',
          website: 'example.com',
          notes: 'This is a test webhook payload',
          status: 'completed',
          completedReason: 'appointment_booked',
          qualifyingAnswers: { sample: 'answer' },
        },
      };

      const response = await fetch(settings.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return { success: false, error: `Webhook returned ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }, [settings.url]);

  return {
    settings,
    updateSettings,
    sendWebhook,
    testWebhook,
    isLoading,
  };
}

// Standalone getter for use in components without hook context
export async function getWebhookSettings(): Promise<WebhookSettings> {
  const { data, error } = await supabase
    .from('webhook_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return defaultSettings;
  }

  return {
    enabled: data.enabled,
    url: data.url,
  };
}
