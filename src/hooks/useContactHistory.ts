import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Unique ID per hook instance to prevent channel collisions when multiple components use this hook
  const instanceId = useRef(crypto.randomUUID()).current;

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

  // Subscribe to realtime updates for contact history
  useEffect(() => {
    if (!contactId) return;

    // Use unique channel name per instance to prevent collisions
    const channel = supabase
      .channel(`contact-history-${contactId}-${instanceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contact_history',
        filter: `contact_id=eq.${contactId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setHistory(prev => {
            const exists = prev.some(h => h.id === payload.new.id);
            if (exists) return prev;
            return [payload.new as HistoryEntry, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setHistory(prev => prev.map(h => 
            h.id === payload.new.id ? payload.new as HistoryEntry : h
          ));
        } else if (payload.eventType === 'DELETE') {
          setHistory(prev => prev.filter(h => h.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId, instanceId]);

  // Listen for optimistic history events (instant UI update)
  useEffect(() => {
    const handleOptimistic = (e: CustomEvent<HistoryEntry>) => {
      if (e.detail.contact_id === contactId) {
        setHistory(prev => {
          const exists = prev.some(h => h.id === e.detail.id);
          if (exists) return prev;
          return [e.detail, ...prev];
        });
      }
    };

    const handleRollback = (e: CustomEvent<{ id: string; contact_id: string }>) => {
      if (e.detail.contact_id === contactId) {
        setHistory(prev => prev.filter(h => h.id !== e.detail.id));
      }
    };

    window.addEventListener('contact-history:optimistic', handleOptimistic as EventListener);
    window.addEventListener('contact-history:rollback', handleRollback as EventListener);

    return () => {
      window.removeEventListener('contact-history:optimistic', handleOptimistic as EventListener);
      window.removeEventListener('contact-history:rollback', handleRollback as EventListener);
    };
  }, [contactId]);

  const addHistoryEntry = useCallback(async (entry: Omit<HistoryEntry, 'id' | 'created_at'>) => {
    if (!organizationId) {
      toast.error('Not authenticated');
      return null;
    }
    
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
          organization_id: organizationId,
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
  }, [organizationId]);

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
