import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Pot {
  id: string;
  name: string;
  createdAt: Date;
}

export interface PotWithStats extends Pot {
  totalRecords: number;
  callbackCount: number;
  notInterestedCount: number;
  completedCount: number;
}

export function usePots() {
  const [pots, setPots] = useState<Pot[]>([]);
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const [contactStats, setContactStats] = useState<Record<string, { total: number; callbacks: number; notInterested: number; completed: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load pots
  useEffect(() => {
    const loadPots = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pots')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading pots:', error);
      } else if (data) {
        setPots(data.map(p => ({
          id: p.id,
          name: p.name,
          createdAt: new Date(p.created_at),
        })));
      }
      setIsLoading(false);
    };

    loadPots();
  }, []);

  // Load contact stats for each pot
  useEffect(() => {
    const loadStats = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('pot_id, status, callback_date');

      if (error) {
        console.error('Error loading contact stats:', error);
        return;
      }

      const stats: Record<string, { total: number; callbacks: number; notInterested: number; completed: number }> = {};

      data?.forEach(contact => {
        const potId = contact.pot_id || 'unknown';
        if (!stats[potId]) {
          stats[potId] = { total: 0, callbacks: 0, notInterested: 0, completed: 0 };
        }
        stats[potId].total++;
        
        if (contact.status === 'callback') {
          stats[potId].callbacks++;
        }
        
        if (contact.status === 'not_interested') {
          stats[potId].notInterested++;
        }
        
        if (contact.status === 'completed') {
          stats[potId].completed++;
        }
      });

      setContactStats(stats);
    };

    loadStats();
  }, [pots]);

  const potsWithStats = useMemo((): PotWithStats[] => {
    return pots.map(pot => ({
      ...pot,
      totalRecords: contactStats[pot.id]?.total || 0,
      callbackCount: contactStats[pot.id]?.callbacks || 0,
      notInterestedCount: contactStats[pot.id]?.notInterested || 0,
      completedCount: contactStats[pot.id]?.completed || 0,
    }));
  }, [pots, contactStats]);

  const totalStats = useMemo(() => {
    let total = 0;
    let callbacks = 0;
    let notInterested = 0;
    let completed = 0;
    
    Object.values(contactStats).forEach(stats => {
      total += stats.total;
      callbacks += stats.callbacks;
      notInterested += stats.notInterested;
      completed += stats.completed;
    });

    return { total, callbacks, notInterested, completed };
  }, [contactStats]);

  const createPot = useCallback(async (name: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('pots')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error('Error creating pot:', error);
      toast.error('Failed to create POT');
      return null;
    }

    const newPot: Pot = {
      id: data.id,
      name: data.name,
      createdAt: new Date(data.created_at),
    };
    
    setPots(prev => [...prev, newPot]);
    return data.id;
  }, []);

  const selectPot = useCallback((potId: string | null) => {
    setSelectedPotId(potId);
  }, []);

  const refreshStats = useCallback(async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('pot_id, status, callback_date');

    if (error) {
      console.error('Error refreshing stats:', error);
      return;
    }

    const stats: Record<string, { total: number; callbacks: number; notInterested: number; completed: number }> = {};

    data?.forEach(contact => {
      const potId = contact.pot_id || 'unknown';
      if (!stats[potId]) {
        stats[potId] = { total: 0, callbacks: 0, notInterested: 0, completed: 0 };
      }
      stats[potId].total++;
      
      if (contact.status === 'callback') {
        stats[potId].callbacks++;
      }
      
      if (contact.status === 'not_interested') {
        stats[potId].notInterested++;
      }
      
      if (contact.status === 'completed') {
        stats[potId].completed++;
      }
    });

    setContactStats(stats);
  }, []);

  return {
    pots,
    potsWithStats,
    selectedPotId,
    selectPot,
    createPot,
    refreshStats,
    totalStats,
    isLoading,
  };
}
