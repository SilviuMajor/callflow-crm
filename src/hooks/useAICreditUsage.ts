import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface CreditUsageRecord {
  id: string;
  feature_type: string;
  credits_used: number;
  contact_id: string | null;
  company_id: string | null;
  metadata: Json;
  created_at: string;
}

export interface DailyUsage {
  date: string;
  total: number;
  records: CreditUsageRecord[];
}

export interface MonthlyUsage {
  month: string; // YYYY-MM
  total: number;
  dailyBreakdown: DailyUsage[];
}

export function useAICreditUsage() {
  const [usage, setUsage] = useState<CreditUsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage[]>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);

  const fetchUsage = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch last 90 days of usage
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await supabase
        .from('ai_credits_usage')
        .select('*')
        .gte('created_at', ninetyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsage(data || []);

      // Process into monthly breakdown
      const monthlyMap = new Map<string, { records: CreditUsageRecord[]; dailyMap: Map<string, CreditUsageRecord[]> }>();

      (data || []).forEach(record => {
        const date = new Date(record.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = date.toISOString().split('T')[0];

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { records: [], dailyMap: new Map() });
        }

        const monthData = monthlyMap.get(monthKey)!;
        monthData.records.push(record);

        if (!monthData.dailyMap.has(dayKey)) {
          monthData.dailyMap.set(dayKey, []);
        }
        monthData.dailyMap.get(dayKey)!.push(record);
      });

      // Convert to array format
      const monthlyArray: MonthlyUsage[] = [];
      monthlyMap.forEach((value, month) => {
        const dailyBreakdown: DailyUsage[] = [];
        value.dailyMap.forEach((records, date) => {
          dailyBreakdown.push({
            date,
            total: records.reduce((sum, r) => sum + r.credits_used, 0),
            records,
          });
        });
        dailyBreakdown.sort((a, b) => b.date.localeCompare(a.date));

        monthlyArray.push({
          month,
          total: value.records.reduce((sum, r) => sum + r.credits_used, 0),
          dailyBreakdown,
        });
      });

      monthlyArray.sort((a, b) => b.month.localeCompare(a.month));
      setMonthlyUsage(monthlyArray);

      // Calculate current month total
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthData = monthlyArray.find(m => m.month === currentMonth);
      setCurrentMonthTotal(currentMonthData?.total || 0);

    } catch (error) {
      console.error('Failed to fetch credit usage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const logUsage = useCallback(async (
    featureType: string,
    contactId?: string,
    companyId?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('ai_credits_usage')
        .insert({
          feature_type: featureType,
          credits_used: 1,
          contact_id: contactId || null,
          company_id: companyId || null,
          metadata: metadata || {},
        });

      if (error) throw error;

      // Update local state
      setCurrentMonthTotal(prev => prev + 1);
      fetchUsage(); // Refresh the full data
    } catch (error) {
      console.error('Failed to log credit usage:', error);
    }
  }, [fetchUsage]);

  return {
    usage,
    monthlyUsage,
    currentMonthTotal,
    isLoading,
    logUsage,
    refetch: fetchUsage,
  };
}
