import { useState, useCallback, useEffect } from 'react';
import { CompanyField } from '@/types/contact';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useCompanyFields() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [fields, setFields] = useState<CompanyField[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load fields from database
  useEffect(() => {
    const loadFields = async () => {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('company_fields')
        .select('*')
        .eq('organization_id', organizationId)
        .order('field_order', { ascending: true });

      if (error) {
        console.error('Error loading company fields:', error);
        toast.error('Failed to load company fields');
      } else if (data) {
        const mappedFields: CompanyField[] = data.map(row => ({
          id: row.id,
          key: row.key,
          label: row.label,
          type: row.type as CompanyField['type'],
          options: row.options || undefined,
          order: row.field_order,
          isArchived: row.is_archived,
        }));
        setFields(mappedFields);
      }
      setIsLoading(false);
    };

    loadFields();
  }, [organizationId]);

  const addField = useCallback(async (field: Omit<CompanyField, 'id' | 'order'>) => {
    if (!organizationId) return '';
    
    const newOrder = fields.length;
    
    const { data, error } = await supabase
      .from('company_fields')
      .insert({
        key: field.key,
        label: field.label,
        type: field.type,
        options: field.options || null,
        field_order: newOrder,
        is_archived: field.isArchived || false,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding company field:', error);
      toast.error('Failed to add company field');
      return '';
    }

    if (data) {
      const newField: CompanyField = {
        id: data.id,
        key: data.key,
        label: data.label,
        type: data.type as CompanyField['type'],
        options: data.options || undefined,
        order: data.field_order,
        isArchived: data.is_archived,
      };
      setFields(prev => [...prev, newField]);
      return data.id;
    }
    return '';
  }, [fields.length, organizationId]);

  const updateField = useCallback(async (id: string, updates: Partial<Omit<CompanyField, 'id'>>) => {
    setFields(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));

    const dbUpdates: Record<string, any> = {};
    if (updates.key !== undefined) dbUpdates.key = updates.key;
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.options !== undefined) dbUpdates.options = updates.options || null;
    if (updates.order !== undefined) dbUpdates.field_order = updates.order;
    if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;

    const { error } = await supabase
      .from('company_fields')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating company field:', error);
      toast.error('Failed to update company field');
    }
  }, []);

  const archiveField = useCallback(async (id: string) => {
    setFields(prev => prev.map(f => 
      f.id === id ? { ...f, isArchived: true } : f
    ));

    const { error } = await supabase
      .from('company_fields')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error archiving company field:', error);
    }
  }, []);

  const restoreField = useCallback(async (id: string) => {
    const activeCount = fields.filter(f => !f.isArchived).length;
    
    setFields(prev => prev.map(f => 
      f.id === id ? { ...f, isArchived: false, order: activeCount } : f
    ));

    const { error } = await supabase
      .from('company_fields')
      .update({ is_archived: false, field_order: activeCount })
      .eq('id', id);

    if (error) {
      console.error('Error restoring company field:', error);
    }
  }, [fields]);

  const deleteField = useCallback(async (id: string) => {
    const filtered = fields.filter(f => f.id !== id);
    const reordered = filtered.map((f, index) => ({ ...f, order: index }));
    setFields(reordered);

    const { error } = await supabase
      .from('company_fields')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting company field:', error);
      toast.error('Failed to delete company field');
    }

    // Update orders for remaining fields
    for (const field of reordered) {
      await supabase
        .from('company_fields')
        .update({ field_order: field.order })
        .eq('id', field.id);
    }
  }, [fields]);

  const reorderFields = useCallback(async (newOrder: string[]) => {
    const fieldMap = new Map(fields.map(f => [f.id, f]));
    const reordered = newOrder.map((id, index) => ({
      ...fieldMap.get(id)!,
      order: index,
    }));
    const archived = fields.filter(f => f.isArchived);
    setFields([...reordered, ...archived]);

    // Update orders in database
    for (let i = 0; i < newOrder.length; i++) {
      await supabase
        .from('company_fields')
        .update({ field_order: i })
        .eq('id', newOrder[i]);
    }
  }, [fields]);

  return {
    fields,
    addField,
    updateField,
    archiveField,
    restoreField,
    deleteField,
    reorderFields,
    setFields,
    isLoading,
  };
}
