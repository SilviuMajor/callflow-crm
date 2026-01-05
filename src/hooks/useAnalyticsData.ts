import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  startOfQuarter, 
  format, 
  getHours, 
  getDay, 
  getWeek, 
  getMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachHourOfInterval,
  isWithinInterval,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  isAfter
} from 'date-fns';

type DateRange = 'all' | 'today' | 'week' | 'month' | 'quarter';
type TimeGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

interface HistoryEntry {
  id: string;
  contact_id: string;
  action_type: string;
  action_timestamp: string;
  pot_id: string | null;
}

interface TimeDataPoint {
  label: string;
  total: number;
  no_answer: number;
  callback: number;
  completed: number;
  not_interested: number;
}

export function useAnalyticsData(potId: string | null, dateRange: DateRange) {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get date range bounds
  const getDateBounds = (range: DateRange): { start: Date | null; end: Date } => {
    const now = new Date();
    switch (range) {
      case 'today': 
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week': 
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month': 
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter': 
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      default: 
        return { start: null, end: now };
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // Fetch contact_history joined with contacts for pot filtering
        let query = supabase
          .from('contact_history')
          .select(`
            id,
            contact_id,
            action_type,
            action_timestamp,
            contacts!inner(pot_id)
          `)
          .in('action_type', ['no_answer', 'callback', 'completed', 'not_interested']);

        const { start } = getDateBounds(dateRange);
        if (start) {
          query = query.gte('action_timestamp', start.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        // Map and filter by POT
        const mapped = (data || []).map((entry: any) => ({
          id: entry.id,
          contact_id: entry.contact_id,
          action_type: entry.action_type,
          action_timestamp: entry.action_timestamp,
          pot_id: entry.contacts?.pot_id || null,
        }));

        const filtered = potId 
          ? mapped.filter(e => e.pot_id === potId)
          : mapped;

        setHistoryEntries(filtered);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setHistoryEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [potId, dateRange]);

  // Function to aggregate data by time granularity
  const getTimeData = (granularity: TimeGranularity): TimeDataPoint[] => {
    if (historyEntries.length === 0) return [];

    const { start, end } = getDateBounds(dateRange);
    const now = new Date();
    const effectiveStart = start || new Date(Math.min(...historyEntries.map(e => new Date(e.action_timestamp).getTime())));
    const effectiveEnd = end || now;

    const createEmptyPoint = (label: string): TimeDataPoint => ({
      label,
      total: 0,
      no_answer: 0,
      callback: 0,
      completed: 0,
      not_interested: 0,
    });

    const countAction = (point: TimeDataPoint, actionType: string) => {
      point.total++;
      if (actionType === 'no_answer') point.no_answer++;
      else if (actionType === 'callback') point.callback++;
      else if (actionType === 'completed') point.completed++;
      else if (actionType === 'not_interested') point.not_interested++;
    };

    if (granularity === 'hourly') {
      // Group by hour (8am - 6pm working hours)
      const hours: Record<number, TimeDataPoint> = {};
      for (let h = 8; h <= 18; h++) {
        hours[h] = createEmptyPoint(`${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`);
      }

      historyEntries.forEach(entry => {
        const hour = getHours(new Date(entry.action_timestamp));
        if (hours[hour]) {
          countAction(hours[hour], entry.action_type);
        }
      });

      return Object.values(hours);
    }

    if (granularity === 'daily') {
      // Group by day of week or specific dates
      if (dateRange === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayData: Record<number, TimeDataPoint> = {};
        days.forEach((day, i) => {
          dayData[i] = createEmptyPoint(day);
        });

        historyEntries.forEach(entry => {
          const dayOfWeek = getDay(new Date(entry.action_timestamp));
          countAction(dayData[dayOfWeek], entry.action_type);
        });

        return Object.values(dayData);
      } else {
        // For other ranges, show actual dates
        const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
        const dayData: Record<string, TimeDataPoint> = {};
        
        days.slice(-14).forEach(day => { // Max 14 days to not overcrowd
          const key = format(day, 'MMM d');
          dayData[key] = createEmptyPoint(key);
        });

        historyEntries.forEach(entry => {
          const key = format(new Date(entry.action_timestamp), 'MMM d');
          if (dayData[key]) {
            countAction(dayData[key], entry.action_type);
          }
        });

        return Object.values(dayData);
      }
    }

    if (granularity === 'weekly') {
      // Group by week
      const weeks = eachWeekOfInterval({ start: effectiveStart, end: effectiveEnd });
      const weekData: Record<number, TimeDataPoint> = {};

      weeks.forEach((week, i) => {
        weekData[getWeek(week)] = createEmptyPoint(`Week ${i + 1}`);
      });

      historyEntries.forEach(entry => {
        const weekNum = getWeek(new Date(entry.action_timestamp));
        if (weekData[weekNum]) {
          countAction(weekData[weekNum], entry.action_type);
        }
      });

      return Object.values(weekData);
    }

    if (granularity === 'monthly') {
      // Group by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthData: Record<number, TimeDataPoint> = {};

      historyEntries.forEach(entry => {
        const monthNum = getMonth(new Date(entry.action_timestamp));
        if (!monthData[monthNum]) {
          monthData[monthNum] = createEmptyPoint(months[monthNum]);
        }
        countAction(monthData[monthNum], entry.action_type);
      });

      // Sort by month and return
      return Object.entries(monthData)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([, data]) => data);
    }

    return [];
  };

  return {
    historyEntries,
    isLoading,
    getTimeData,
  };
}
