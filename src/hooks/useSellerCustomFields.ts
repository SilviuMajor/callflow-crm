import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface SellerCustomField {
  id: string;
  key: string;
  label: string;
  type: 'short_text' | 'long_text' | 'dropdown' | 'radio' | 'checkbox' | 'number' | 'date';
  options: string[] | null;
  field_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export function useSellerCustomFields() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [fields, setFields] = useState<SellerCustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFields = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_custom_fields')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_archived', false)
        .order('field_order', { ascending: true });

      if (error) throw error;
      setFields((data || []) as SellerCustomField[]);
    } catch (error) {
      console.error('Error fetching seller custom fields:', error);
      toast.error('Failed to load custom fields');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const addField = useCallback(async (label: string, type: SellerCustomField['type'], options?: string[]) => {
    if (!organizationId) return null;
    
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const maxOrder = Math.max(0, ...fields.map(f => f.field_order));

    try {
      const { data, error } = await supabase
        .from('seller_custom_fields')
        .insert({
          key,
          label,
          type,
          options: options || null,
          field_order: maxOrder + 1,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      setFields(prev => [...prev, data as SellerCustomField]);
      toast.success('Custom field added');
      return data;
    } catch (error: any) {
      console.error('Error adding seller custom field:', error);
      if (error.code === '23505') {
        toast.error('A field with this name already exists');
      } else {
        toast.error('Failed to add custom field');
      }
      throw error;
    }
  }, [fields, organizationId]);

  const updateField = useCallback(async (id: string, updates: Partial<Pick<SellerCustomField, 'label' | 'type' | 'options'>>) => {
    try {
      const { error } = await supabase
        .from('seller_custom_fields')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      toast.success('Field updated');
    } catch (error) {
      console.error('Error updating seller custom field:', error);
      toast.error('Failed to update field');
      throw error;
    }
  }, []);

  const archiveField = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('seller_custom_fields')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) throw error;
      setFields(prev => prev.filter(f => f.id !== id));
      toast.success('Field archived');
    } catch (error) {
      console.error('Error archiving seller custom field:', error);
      toast.error('Failed to archive field');
      throw error;
    }
  }, []);

  const reorderFields = useCallback(async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        field_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('seller_custom_fields')
          .update({ field_order: update.field_order })
          .eq('id', update.id);
      }

      setFields(prev => {
        const fieldMap = new Map(prev.map(f => [f.id, f]));
        return orderedIds.map((id, index) => ({
          ...fieldMap.get(id)!,
          field_order: index,
        }));
      });
    } catch (error) {
      console.error('Error reordering seller custom fields:', error);
      toast.error('Failed to reorder fields');
      throw error;
    }
  }, []);

  return {
    fields,
    isLoading,
    addField,
    updateField,
    archiveField,
    reorderFields,
    refetch: fetchFields,
  };
}
