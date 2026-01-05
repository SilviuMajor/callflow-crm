import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  format, 
  getHours, 
  getDay, 
  getWeek, 
  getMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachHourOfInterval,
  addHours
} from 'date-fns';

export type TimeGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

interface HistoryEntry {
  id: string;
  contact_id: string;
  action_type: string;
  action_timestamp: string;
  pot_id: string | null;
}

export interface TimeDataPoint {
  label: string;
  total: number;
  no_answer: number;
  callback: number;
  completed: number;
  not_interested: number;
}

export function useAnalyticsData(
  potId: string | null, 
  granularity: TimeGranularity, 
  selectedDate: Date
) {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get date range bounds based on granularity
  const getDateBounds = (gran: TimeGranularity, date: Date): { start: Date; end: Date } => {
    switch (gran) {
      case 'hourly': 
        // Single day - all 24 hours
        return { start: startOfDay(date), end: endOfDay(date) };
      case 'daily': 
        // Week view
        return { start: startOfWeek(date), end: endOfWeek(date) };
      case 'weekly': 
        // Month view
        return { start: startOfMonth(date), end: endOfMonth(date) };
      case 'monthly': 
        // Year view
        return { start: startOfYear(date), end: endOfYear(date) };
      default: 
        return { start: startOfDay(date), end: endOfDay(date) };
    }
  };

  const { start, end } = useMemo(() => getDateBounds(granularity, selectedDate), [granularity, selectedDate]);

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
          .in('action_type', ['no_answer', 'callback', 'completed', 'not_interested'])
          .gte('action_timestamp', start.toISOString())
          .lte('action_timestamp', end.toISOString());

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
  }, [potId, start, end]);

  // Function to aggregate data by time granularity
  const getTimeData = useMemo((): TimeDataPoint[] => {
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
      // All 24 hours of the selected day
      const hours: TimeDataPoint[] = [];
      for (let h = 0; h < 24; h++) {
        const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
        hours.push(createEmptyPoint(label));
      }

      historyEntries.forEach(entry => {
        const hour = getHours(new Date(entry.action_timestamp));
        countAction(hours[hour], entry.action_type);
      });

      return hours;
    }

    if (granularity === 'daily') {
      // Days of the week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayData: TimeDataPoint[] = days.map(day => createEmptyPoint(day));

      historyEntries.forEach(entry => {
        const dayOfWeek = getDay(new Date(entry.action_timestamp));
        countAction(dayData[dayOfWeek], entry.action_type);
      });

      return dayData;
    }

    if (granularity === 'weekly') {
      // Weeks of the month
      const weeks = eachWeekOfInterval({ start, end });
      const weekData: TimeDataPoint[] = weeks.map((_, i) => createEmptyPoint(`Week ${i + 1}`));
      
      // Create a map of week start dates to indices
      const weekStartDates = weeks.map(w => startOfWeek(w).getTime());

      historyEntries.forEach(entry => {
        const entryWeekStart = startOfWeek(new Date(entry.action_timestamp)).getTime();
        const weekIndex = weekStartDates.findIndex(ws => ws === entryWeekStart);
        if (weekIndex >= 0 && weekIndex < weekData.length) {
          countAction(weekData[weekIndex], entry.action_type);
        }
      });

      return weekData;
    }

    if (granularity === 'monthly') {
      // All 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthData: TimeDataPoint[] = months.map(month => createEmptyPoint(month));

      historyEntries.forEach(entry => {
        const monthNum = getMonth(new Date(entry.action_timestamp));
        countAction(monthData[monthNum], entry.action_type);
      });

      return monthData;
    }

    return [];
  }, [historyEntries, granularity, start, end]);

  return {
    historyEntries,
    isLoading,
    getTimeData,
    dateRange: { start, end },
  };
}