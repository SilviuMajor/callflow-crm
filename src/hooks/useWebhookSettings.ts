import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface WebhookSettings {
  enabled: boolean;
  url: string;
}

const defaultSettings: WebhookSettings = {
  enabled: false,
  url: '',
};

export function useWebhookSettings() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [settings, setSettings] = useState<WebhookSettings>(defaultSettings);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!organizationId) { setIsLoading(false); return; }
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('webhook_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading webhook settings:', error);
      } else if (data) {
        setSettings({ enabled: data.enabled, url: data.url });
        setSettingsId(data.id);
      }
      setIsLoading(false);
    };

    if (organizationId) loadSettings();
  }, [organizationId]);

  const updateSettings = useCallback(async (updates: Partial<WebhookSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    if (settingsId) {
      const { error } = await supabase
        .from('webhook_settings')
        .update({ enabled: newSettings.enabled, url: newSettings.url })
        .eq('id', settingsId);
      if (error) toast.error('Failed to save webhook settings');
    } else if (organizationId) {
      const { data, error } = await supabase
        .from('webhook_settings')
        .insert({ enabled: newSettings.enabled, url: newSettings.url, organization_id: organizationId })
        .select()
        .single();
      if (error) toast.error('Failed to save webhook settings');
      else if (data) setSettingsId(data.id);
    }
  }, [settings, settingsId, organizationId]);

  // Send webhook via Edge Function (URL never exposed to client, no CORS issues)
  const sendWebhook = useCallback(async (
    contact: Record<string, any>,
    eventType: string = 'contact_completed'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!settings.enabled || !settings.url) return { success: true };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Not authenticated' };

      const response = await supabase.functions.invoke('send-webhook', {
        body: { payload: { event: eventType, contact } },
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const result = response.data;
      if (!result?.success && !result?.skipped) {
        return { success: false, error: result?.error || 'Webhook failed' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }, [settings]);

  // Test webhook — also goes via Edge Function now
  const testWebhook = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!settings.url) return { success: false, error: 'No webhook URL configured' };

    return sendWebhook({
      id: 'test-123',
      firstName: 'Test',
      lastName: 'Contact',
      company: 'Test Company',
      jobTitle: 'Test Role',
      phone: '+44 7700 000000',
      email: 'test@example.com',
      website: 'example.com',
      status: 'completed',
      completedReason: 'appointment_booked',
      qualifyingAnswers: { sample: 'answer' },
    }, 'test');
  }, [settings.url, sendWebhook]);

  return { settings, updateSettings, sendWebhook, testWebhook, isLoading };
}
