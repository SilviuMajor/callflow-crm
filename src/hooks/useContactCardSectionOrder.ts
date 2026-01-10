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

// Sections that can have expanded defaults
export const EXPANDABLE_SECTIONS: SectionKey[] = [
  'targeted_research',
  'persona',
  'ai_script',
  'static_script',
];

export type SectionExpandedDefaults = Record<string, boolean>;

const DEFAULT_EXPANDED_DEFAULTS: SectionExpandedDefaults = {
  targeted_research: false,
  persona: false,
  ai_script: false,
  static_script: false,
};

export function useContactCardSectionOrder() {
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>([...DEFAULT_SECTION_ORDER]);
  const [sectionExpandedDefaults, setSectionExpandedDefaults] = useState<SectionExpandedDefaults>({ ...DEFAULT_EXPANDED_DEFAULTS });
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
            .insert({ 
              section_order: [...DEFAULT_SECTION_ORDER],
              section_expanded_defaults: { ...DEFAULT_EXPANDED_DEFAULTS }
            })
            .select()
            .single();

          if (insertError) throw insertError;
          if (newData) {
            setSectionOrder(newData.section_order as SectionKey[]);
            setSectionExpandedDefaults((newData.section_expanded_defaults as SectionExpandedDefaults) || { ...DEFAULT_EXPANDED_DEFAULTS });
            setSettingsId(newData.id);
          }
        } else if (error) {
          throw error;
        } else if (data) {
          setSectionOrder(data.section_order as SectionKey[]);
          setSectionExpandedDefaults((data.section_expanded_defaults as SectionExpandedDefaults) || { ...DEFAULT_EXPANDED_DEFAULTS });
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

  const updateExpandedDefault = useCallback(async (sectionKey: SectionKey, isExpanded: boolean) => {
    if (!settingsId) return;

    const newDefaults = { ...sectionExpandedDefaults, [sectionKey]: isExpanded };
    setSectionExpandedDefaults(newDefaults);
    
    try {
      const { error } = await supabase
        .from('contact_card_section_order')
        .update({ section_expanded_defaults: newDefaults })
        .eq('id', settingsId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update expanded default:', err);
      toast.error('Failed to save expanded setting');
    }
  }, [settingsId, sectionExpandedDefaults]);

  const resetToDefault = useCallback(async () => {
    if (!settingsId) return;
    
    setSectionOrder([...DEFAULT_SECTION_ORDER]);
    setSectionExpandedDefaults({ ...DEFAULT_EXPANDED_DEFAULTS });
    
    try {
      const { error } = await supabase
        .from('contact_card_section_order')
        .update({ 
          section_order: [...DEFAULT_SECTION_ORDER],
          section_expanded_defaults: { ...DEFAULT_EXPANDED_DEFAULTS }
        })
        .eq('id', settingsId);

      if (error) throw error;
      toast.success('Section order reset to default');
    } catch (err) {
      console.error('Failed to reset section order:', err);
      toast.error('Failed to reset section order');
    }
  }, [settingsId]);

  return {
    sectionOrder,
    sectionExpandedDefaults,
    isLoading,
    updateOrder,
    updateExpandedDefault,
    resetToDefault,
  };
}
