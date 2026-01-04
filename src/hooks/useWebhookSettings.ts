import { useState, useEffect, useCallback } from 'react';

export interface WebhookSettings {
  enabled: boolean;
  url: string;
}

const STORAGE_KEY = 'webhook-settings';

const defaultSettings: WebhookSettings = {
  enabled: false,
  url: '',
};

export function useWebhookSettings() {
  const [settings, setSettings] = useState<WebhookSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<WebhookSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

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
      // For CORS errors or network issues, we can't verify success
      // Since user wants "block until success", treat network errors as failures
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
  };
}

// Standalone getter for use in components without hook context
export function getWebhookSettings(): WebhookSettings {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultSettings;
    }
  }
  return defaultSettings;
}
