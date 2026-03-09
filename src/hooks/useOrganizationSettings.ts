import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useOrganizationSettings() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  const [dailyCallTarget, setDailyCallTarget] = useState(50);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) { setIsLoading(false); return; }

    const fetch = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('daily_call_target')
        .eq('id', organizationId)
        .single();

      if (!error && data) {
        setDailyCallTarget((data as any).daily_call_target ?? 50);
      }
      setIsLoading(false);
    };
    fetch();
  }, [organizationId]);

  const updateDailyCallTarget = useCallback(async (value: number) => {
    if (!organizationId) return;
    setDailyCallTarget(value);

    const { error } = await supabase
      .from('organizations')
      .update({ daily_call_target: value } as any)
      .eq('id', organizationId);

    if (error) {
      console.error('Error updating daily call target:', error);
      toast.error('Failed to save daily call target');
    }
  }, [organizationId]);

  return { dailyCallTarget, updateDailyCallTarget, isLoading };
}
