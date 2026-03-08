import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, endOfDay } from 'date-fns';

export interface TodayStats {
  total: number;
  completed: number;
  callbacks: number;
  noAnswer: number;
  notInterested: number;
}

export function useTodayStats() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  const [stats, setStats] = useState<TodayStats>({ total: 0, completed: 0, callbacks: 0, noAnswer: 0, notInterested: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    if (!organizationId) { setIsLoading(false); return; }

    const start = startOfDay(new Date()).toISOString();
    const end = endOfDay(new Date()).toISOString();

    const { data, error } = await supabase
      .from('contact_history')
      .select('action_type, contacts!inner(organization_id)')
      .in('action_type', ['no_answer', 'callback', 'completed', 'not_interested'])
      .gte('action_timestamp', start)
      .lte('action_timestamp', end);

    if (!error && data) {
      // Filter by org
      const orgData = data.filter((d: any) => d.contacts?.organization_id === organizationId);
      setStats({
        total: orgData.length,
        completed: orgData.filter((d: any) => d.action_type === 'completed').length,
        callbacks: orgData.filter((d: any) => d.action_type === 'callback').length,
        noAnswer: orgData.filter((d: any) => d.action_type === 'no_answer').length,
        notInterested: orgData.filter((d: any) => d.action_type === 'not_interested').length,
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [organizationId]);

  return { stats, isLoading, refresh: fetchStats };
}
