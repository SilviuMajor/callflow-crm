import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StaticScript {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
  is_default: boolean;
  field_order: number;
  created_at: string;
  updated_at: string;
}

export function useStaticScripts() {
  const [scripts, setScripts] = useState<StaticScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScripts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('static_scripts')
      .select('*')
      .order('field_order', { ascending: true });

    if (error) {
      console.error('Error fetching static scripts:', error);
    } else {
      setScripts(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const addScript = async (script: Partial<Omit<StaticScript, 'id' | 'created_at' | 'updated_at'>>) => {
    const maxOrder = scripts.length > 0 ? Math.max(...scripts.map(s => s.field_order)) : -1;
    
    const { data, error } = await supabase
      .from('static_scripts')
      .insert({
        name: script.name || 'New Script',
        content: script.content || '',
        enabled: script.enabled ?? true,
        is_default: script.is_default ?? false,
        field_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding static script:', error);
      return null;
    }

    setScripts(prev => [...prev, data]);
    return data;
  };

  const updateScript = async (id: string, updates: Partial<Omit<StaticScript, 'id' | 'created_at' | 'updated_at'>>) => {
    const { error } = await supabase
      .from('static_scripts')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating static script:', error);
      return false;
    }

    setScripts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return true;
  };

  const deleteScript = async (id: string) => {
    const { error } = await supabase
      .from('static_scripts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting static script:', error);
      return false;
    }

    setScripts(prev => prev.filter(s => s.id !== id));
    return true;
  };

  const setDefaultScript = async (id: string) => {
    // First, unset all defaults
    await supabase
      .from('static_scripts')
      .update({ is_default: false })
      .neq('id', id);

    // Then set this one as default
    const { error } = await supabase
      .from('static_scripts')
      .update({ is_default: true })
      .eq('id', id);

    if (error) {
      console.error('Error setting default script:', error);
      return false;
    }

    setScripts(prev => prev.map(s => ({ ...s, is_default: s.id === id })));
    return true;
  };

  const reorderScripts = async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => 
      supabase.from('static_scripts').update({ field_order: index }).eq('id', id)
    );

    await Promise.all(updates);

    setScripts(prev => {
      const scriptMap = new Map(prev.map(s => [s.id, s]));
      return orderedIds.map((id, index) => ({
        ...scriptMap.get(id)!,
        field_order: index,
      }));
    });
  };

  const enabledScripts = scripts.filter(s => s.enabled);
  const defaultScript = scripts.find(s => s.is_default && s.enabled) || enabledScripts[0];

  return {
    scripts,
    enabledScripts,
    defaultScript,
    isLoading,
    addScript,
    updateScript,
    deleteScript,
    setDefaultScript,
    reorderScripts,
    refetch: fetchScripts,
  };
}
