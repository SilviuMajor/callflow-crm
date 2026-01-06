import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HistoryEntry {
  id: string;
  contact_id: string;
  action_type: 'no_answer' | 'callback' | 'completed' | 'not_interested' | 'note' | 'returned_to_pot' | 'rebooked' | 'rescheduled' | 'appointment_attended' | 'appointment_no_show';
  action_timestamp: string;
  callback_date?: string | null;
  appointment_date?: string | null;
  reason?: string | null;
  note?: string | null;
  created_at: string;
}

export function useContactHistory(contactId?: string) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async (cId?: string) => {
    const targetId = cId || contactId;
    if (!targetId) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_history')
        .select('*')
        .eq('contact_id', targetId)
        .order('action_timestamp', { ascending: false });

      if (error) throw error;
      setHistory((data as HistoryEntry[]) || []);
    } catch (error) {
      console.error('Error fetching contact history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addHistoryEntry = useCallback(async (entry: Omit<HistoryEntry, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('contact_history')
        .insert({
          contact_id: entry.contact_id,
          action_type: entry.action_type,
          action_timestamp: entry.action_timestamp,
          callback_date: entry.callback_date || null,
          appointment_date: entry.appointment_date || null,
          reason: entry.reason || null,
          note: entry.note || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setHistory(prev => [data as HistoryEntry, ...prev]);
      }
      return data as HistoryEntry;
    } catch (error) {
      console.error('Error adding history entry:', error);
      toast.error('Failed to save history entry');
      return null;
    }
  }, []);

  const updateHistoryEntry = useCallback(async (id: string, updates: Partial<Pick<HistoryEntry, 'note'>>) => {
    try {
      const { error } = await supabase
        .from('contact_history')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
      toast.success('Note updated');
    } catch (error) {
      console.error('Error updating history entry:', error);
      toast.error('Failed to update note');
    }
  }, []);

  const deleteHistoryEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success('Entry deleted');
    } catch (error) {
      console.error('Error deleting history entry:', error);
      toast.error('Failed to delete entry');
    }
  }, []);

  return {
    history,
    isLoading,
    fetchHistory,
    addHistoryEntry,
    updateHistoryEntry,
    deleteHistoryEntry,
  };
}
