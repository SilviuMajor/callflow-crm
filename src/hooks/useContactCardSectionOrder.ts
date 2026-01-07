import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DEFAULT_SECTION_ORDER = [
  'history',
  'contact_info',
  'targeted_research',
  'persona',
  'ai_script',
  'static_script',
] as const;

export type SectionKey = typeof DEFAULT_SECTION_ORDER[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  contact_info: 'Contact & Company Info',
  history: 'History',
  targeted_research: 'Targeted Research',
  persona: 'Persona',
  ai_script: 'AI Script',
  static_script: 'Static Script',
};

export function useContactCardSectionOrder() {
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>([...DEFAULT_SECTION_ORDER]);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('contact_card_section_order')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code === 'PGRST116') {
          // No rows exist, create default
          const { data: newData, error: insertError } = await supabase
            .from('contact_card_section_order')
            .insert({ section_order: [...DEFAULT_SECTION_ORDER] })
            .select()
            .single();

          if (insertError) throw insertError;
          if (newData) {
            setSectionOrder(newData.section_order as SectionKey[]);
            setSettingsId(newData.id);
          }
        } else if (error) {
          throw error;
        } else if (data) {
          setSectionOrder(data.section_order as SectionKey[]);
          setSettingsId(data.id);
        }
      } catch (err) {
        console.error('Failed to load section order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, []);

  const updateOrder = useCallback(async (newOrder: SectionKey[]) => {
    if (!settingsId) return;

    setSectionOrder(newOrder);
    
    try {
      const { error } = await supabase
        .from('contact_card_section_order')
        .update({ section_order: newOrder })
        .eq('id', settingsId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update section order:', err);
      toast.error('Failed to save section order');
    }
  }, [settingsId]);

  const resetToDefault = useCallback(async () => {
    await updateOrder([...DEFAULT_SECTION_ORDER]);
    toast.success('Section order reset to default');
  }, [updateOrder]);

  return {
    sectionOrder,
    isLoading,
    updateOrder,
    resetToDefault,
  };
}
