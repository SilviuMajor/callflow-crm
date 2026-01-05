import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OutcomeOption {
  id: string;
  outcome_type: 'completed' | 'not_interested';
  value: string;
  label: string;
  option_order: number;
  is_archived: boolean;
}

export function useOutcomeOptions() {
  const [options, setOptions] = useState<OutcomeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOptions = useCallback(async () => {
    const { data, error } = await supabase
      .from('outcome_options')
      .select('*')
      .eq('is_archived', false)
      .order('option_order', { ascending: true });

    if (error) {
      console.error('Error fetching outcome options:', error);
      toast.error('Failed to load outcome options');
      return;
    }

    setOptions((data || []) as OutcomeOption[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const completedOptions = options.filter(o => o.outcome_type === 'completed');
  const notInterestedOptions = options.filter(o => o.outcome_type === 'not_interested');

  const addOption = async (outcomeType: 'completed' | 'not_interested', value: string, label: string) => {
    const maxOrder = options
      .filter(o => o.outcome_type === outcomeType)
      .reduce((max, o) => Math.max(max, o.option_order), -1);

    const { data, error } = await supabase
      .from('outcome_options')
      .insert({
        outcome_type: outcomeType,
        value,
        label,
        option_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding option:', error);
      toast.error('Failed to add option');
      return;
    }

    setOptions(prev => [...prev, data as OutcomeOption]);
    toast.success('Option added');
  };

  const updateOption = async (id: string, updates: Partial<Pick<OutcomeOption, 'value' | 'label'>>) => {
    const { error } = await supabase
      .from('outcome_options')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating option:', error);
      toast.error('Failed to update option');
      return;
    }

    setOptions(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    toast.success('Option updated');
  };

  const deleteOption = async (id: string) => {
    const { error } = await supabase
      .from('outcome_options')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error deleting option:', error);
      toast.error('Failed to delete option');
      return;
    }

    setOptions(prev => prev.filter(o => o.id !== id));
    toast.success('Option removed');
  };

  const reorderOptions = async (outcomeType: 'completed' | 'not_interested', orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => ({
      id,
      option_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('outcome_options')
        .update({ option_order: update.option_order })
        .eq('id', update.id);
    }

    setOptions(prev => {
      const others = prev.filter(o => o.outcome_type !== outcomeType);
      const reordered = orderedIds
        .map(id => prev.find(o => o.id === id))
        .filter(Boolean)
        .map((o, index) => ({ ...o!, option_order: index }));
      return [...others, ...reordered].sort((a, b) => a.option_order - b.option_order);
    });
  };

  return {
    options,
    completedOptions,
    notInterestedOptions,
    isLoading,
    addOption,
    updateOption,
    deleteOption,
    reorderOptions,
    refetch: fetchOptions,
  };
}
