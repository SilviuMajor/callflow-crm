import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [pots, setPots] = useState<Pot[]>([]);
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const [contactStats, setContactStats] = useState<Record<string, { total: number; callbacks: number; notInterested: number; completed: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load pots
  useEffect(() => {
    const loadPots = async () => {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pots')
        .select('*')
        .eq('organization_id', organizationId)
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
  }, [organizationId]);

  // Subscribe to realtime updates for pots
  useEffect(() => {
    if (!organizationId) return;
    
    const channel = supabase
      .channel('pots-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pots',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newPot: Pot = {
            id: payload.new.id,
            name: payload.new.name,
            createdAt: new Date(payload.new.created_at),
          };
          setPots(prev => {
            if (prev.some(p => p.id === newPot.id)) return prev;
            return [...prev, newPot];
          });
        } else if (payload.eventType === 'UPDATE') {
          setPots(prev => prev.map(p => 
            p.id === payload.new.id 
              ? { ...p, name: payload.new.name }
              : p
          ));
        } else if (payload.eventType === 'DELETE') {
          setPots(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  // Load contact stats for each pot
  useEffect(() => {
    const loadStats = async () => {
      if (!organizationId) return;
      
      const { data, error } = await supabase
        .from('contacts')
        .select('pot_id, status, callback_date')
        .eq('organization_id', organizationId);

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
  }, [pots, organizationId]);

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
    if (!organizationId) {
      toast.error('Not authenticated');
      return null;
    }
    
    const { data, error } = await supabase
      .from('pots')
      .insert({ name, organization_id: organizationId })
      .select()
      .single();

    if (error) {
      console.error('Error creating pot:', error);
      toast.error('Failed to create POT');
      return null;
    }

    // Realtime will handle adding the pot to state
    return data.id;
  }, [organizationId]);

  const renamePot = useCallback(async (potId: string, newName: string): Promise<boolean> => {
    const { error } = await supabase
      .from('pots')
      .update({ name: newName })
      .eq('id', potId);

    if (error) {
      console.error('Error renaming pot:', error);
      toast.error('Failed to rename POT');
      return false;
    }
    
    toast.success('POT renamed');
    return true;
  }, []);

  const deletePot = useCallback(async (potId: string, moveContactsToPotId?: string): Promise<boolean> => {
    // Optimistic removal from local state
    setPots(prev => prev.filter(p => p.id !== potId));

    // First, move or delete contacts
    if (moveContactsToPotId) {
      const { error: moveError } = await supabase
        .from('contacts')
        .update({ pot_id: moveContactsToPotId })
        .eq('pot_id', potId);

      if (moveError) {
        console.error('Error moving contacts:', moveError);
        toast.error('Failed to move contacts');
        return false;
      }
    } else {
      // Delete all contacts in this pot
      const { error: deleteContactsError } = await supabase
        .from('contacts')
        .delete()
        .eq('pot_id', potId);

      if (deleteContactsError) {
        console.error('Error deleting contacts:', deleteContactsError);
        toast.error('Failed to delete contacts');
        return false;
      }
    }
    
    // Now delete the pot
    const { error } = await supabase
      .from('pots')
      .delete()
      .eq('id', potId);

    if (error) {
      console.error('Error deleting pot:', error);
      toast.error('Failed to delete POT');
      // Rollback — reload pots from DB
      const { data: reloadData } = await supabase
        .from('pots')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });
      if (reloadData) {
        setPots(reloadData.map(p => ({ id: p.id, name: p.name, createdAt: new Date(p.created_at) })));
      }
      return false;
    }
    
    // Clear selection if this pot was selected
    if (selectedPotId === potId) {
      setSelectedPotId(null);
    }
    
    toast.success('POT deleted');
    return true;
  }, [selectedPotId, organizationId]);

  const mergePots = useCallback(async (sourcePotId: string, targetPotId: string): Promise<boolean> => {
    // Move all contacts from source to target
    const { error: moveError } = await supabase
      .from('contacts')
      .update({ pot_id: targetPotId })
      .eq('pot_id', sourcePotId);

    if (moveError) {
      console.error('Error moving contacts:', moveError);
      toast.error('Failed to merge POTs');
      return false;
    }

    // Delete the source pot
    const { error: deleteError } = await supabase
      .from('pots')
      .delete()
      .eq('id', sourcePotId);

    if (deleteError) {
      console.error('Error deleting source pot:', deleteError);
      toast.error('Failed to delete merged POT');
      return false;
    }

    // Clear selection if source pot was selected
    if (selectedPotId === sourcePotId) {
      setSelectedPotId(targetPotId);
    }
    
    toast.success('POTs merged successfully');
    return true;
  }, [selectedPotId]);

  const selectPot = useCallback((potId: string | null) => {
    setSelectedPotId(potId);
  }, []);

  const refreshStats = useCallback(async () => {
    if (!organizationId) return;
    
    const { data, error } = await supabase
      .from('contacts')
      .select('pot_id, status, callback_date')
      .eq('organization_id', organizationId);

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
  }, [organizationId]);

  return {
    pots,
    potsWithStats,
    selectedPotId,
    selectPot,
    createPot,
    renamePot,
    deletePot,
    mergePots,
    refreshStats,
    totalStats,
    isLoading,
  };
}
