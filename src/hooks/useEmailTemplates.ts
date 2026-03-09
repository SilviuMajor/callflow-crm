import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  enabled: boolean;
  field_order: number;
  created_at: string;
  updated_at: string;
}

export function useEmailTemplates() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('field_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTemplates((data as EmailTemplate[]) || []);
    } catch (error) {
      console.error('Failed to load email templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(async (name: string, prefill?: Partial<Pick<EmailTemplate, 'subject' | 'body'>>) => {
    if (!organizationId) {
      toast.error('Not authenticated');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name,
          subject: prefill?.subject || '',
          body: prefill?.body || '',
          enabled: true,
          field_order: templates.length,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTemplates(prev => [...prev, data as EmailTemplate]);
        toast.success('Template created');
        return data as EmailTemplate;
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
    }
    return null;
  }, [organizationId, templates.length]);

  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<Pick<EmailTemplate, 'name' | 'subject' | 'body' | 'enabled'>>
  ) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to save template');
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
      return false;
    }
  }, []);

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
