import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Contact, CallStatus, CompletedReason, NotInterestedReason } from '@/types/contact';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

// Helper to add history entry with optimistic dispatch
async function addContactHistoryEntry(entry: {
  id: string;
  contact_id: string;
  action_type: string;
  action_timestamp: string;
  callback_date?: string | null;
  appointment_date?: string | null;
  reason?: string | null;
  note?: string | null;
  organization_id: string;
}) {
  // Dispatch optimistic event for instant UI update
  const optimisticEntry = {
    ...entry,
    created_at: entry.action_timestamp,
  };
  window.dispatchEvent(new CustomEvent('contact-history:optimistic', { detail: optimisticEntry }));

  const { error } = await supabase
    .from('contact_history')
    .insert(entry);
  
  if (error) {
    console.error('Error adding history entry:', error);
    // Rollback on failure
    window.dispatchEvent(new CustomEvent('contact-history:rollback', { 
      detail: { id: entry.id, contact_id: entry.contact_id } 
    }));
  }
}

export function useContacts(selectedPotId?: string | null) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load contacts from database
  useEffect(() => {
    const loadContacts = async () => {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading contacts:', error);
        toast.error('Failed to load contacts');
      } else if (data) {
        const mappedContacts: Contact[] = data.map(row => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          company: row.company,
          jobTitle: row.job_title || '',
          phone: row.phone,
          email: row.email || '',
          website: row.website || '',
          linkedinUrl: row.linkedin_url || '',
          twitterUrl: row.twitter_url || '',
          status: row.status as CallStatus,
          callbackDate: row.callback_date ? new Date(row.callback_date) : undefined,
          appointmentDate: row.appointment_date ? new Date(row.appointment_date) : undefined,
          appointmentAttended: row.appointment_attended,
          qualifyingAnswers: (row.qualifying_answers as Record<string, any>) || {},
          customFields: (row.custom_fields as Record<string, any>) || {},
          createdAt: new Date(row.created_at),
          aiPersona: row.ai_persona || '',
          potId: row.pot_id || undefined,
          completedReason: row.completed_reason as CompletedReason | undefined,
          notInterestedReason: row.not_interested_reason as NotInterestedReason | undefined,
        }));

        // Fetch the most recent completed/not_interested date for each completed contact
        const completedContactIds = mappedContacts
          .filter(c => c.status === 'completed' || c.status === 'not_interested')
          .map(c => c.id);

        if (completedContactIds.length > 0) {
          const { data: historyData } = await supabase
            .from('contact_history')
            .select('contact_id, action_timestamp, action_type')
            .in('contact_id', completedContactIds)
            .in('action_type', ['completed', 'not_interested'])
            .order('action_timestamp', { ascending: false });

          // Group by contact_id, take the most recent
          const latestDates: Record<string, Date> = {};
          historyData?.forEach(h => {
            if (!latestDates[h.contact_id]) {
              latestDates[h.contact_id] = new Date(h.action_timestamp);
            }
          });

          // Update contacts with their completion dates
          mappedContacts.forEach(c => {
            if (latestDates[c.id]) {
              c.lastCalledAt = latestDates[c.id];
            }
          });
        }

        // Fetch no-answer counts for all contacts
        const allContactIds = mappedContacts.map(c => c.id);
        if (allContactIds.length > 0) {
          const { data: noAnswerData } = await supabase
            .from('contact_history')
            .select('contact_id')
            .in('contact_id', allContactIds)
            .eq('action_type', 'no_answer');

          const noAnswerCounts: Record<string, number> = {};
          noAnswerData?.forEach(h => {
            noAnswerCounts[h.contact_id] = (noAnswerCounts[h.contact_id] || 0) + 1;
          });

          mappedContacts.forEach(c => {
            c.noAnswerCount = noAnswerCounts[c.id] || 0;
          });
        }

        setContacts(mappedContacts);
      }
      setIsLoading(false);
    };

    loadContacts();
  }, [organizationId]);

  // Track local updates to skip realtime echoes and prevent React queue errors
  const pendingLocalUpdates = useRef<Set<string>>(new Set());

  // Subscribe to realtime updates for contacts
  useEffect(() => {
    if (!organizationId) return;
    
    const mapDbRowToContact = (row: any): Contact => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      company: row.company,
      jobTitle: row.job_title || '',
      phone: row.phone,
      email: row.email || '',
      website: row.website || '',
      linkedinUrl: row.linkedin_url || '',
      twitterUrl: row.twitter_url || '',
      status: row.status as CallStatus,
      callbackDate: row.callback_date ? new Date(row.callback_date) : undefined,
      appointmentDate: row.appointment_date ? new Date(row.appointment_date) : undefined,
      appointmentAttended: row.appointment_attended,
      qualifyingAnswers: (row.qualifying_answers as Record<string, any>) || {},
      customFields: (row.custom_fields as Record<string, any>) || {},
      createdAt: new Date(row.created_at),
      aiPersona: row.ai_persona || '',
      potId: row.pot_id || undefined,
      completedReason: row.completed_reason as CompletedReason | undefined,
      notInterestedReason: row.not_interested_reason as NotInterestedReason | undefined,
    });

    const channel = supabase
      .channel('contacts-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contacts',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newContact = mapDbRowToContact(payload.new);
          // Skip if this was a local update we just made
          if (pendingLocalUpdates.current.has(newContact.id)) return;
          setContacts(prev => {
            if (prev.some(c => c.id === newContact.id)) return prev;
            return [...prev, newContact];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapDbRowToContact(payload.new);
          // Skip if this was a local update we just made
          if (pendingLocalUpdates.current.has(updated.id)) return;
          setContacts(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
        } else if (payload.eventType === 'DELETE') {
          // Skip if this was a local delete we just made
          if (pendingLocalUpdates.current.has(payload.old.id)) return;
          setContacts(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  // Queue contacts: overdue callbacks -> pending -> future callbacks
  // Filter by selected POT if provided
  const queueContacts = useMemo(() => {
    const now = new Date();
    
    let filtered = contacts;
    if (selectedPotId) {
      filtered = contacts.filter(c => c.potId === selectedPotId);
    }
    
    const overdueCallbacks = filtered
      .filter(c => c.status === 'callback' && c.callbackDate && new Date(c.callbackDate) <= now)
      .sort((a, b) => new Date(a.callbackDate!).getTime() - new Date(b.callbackDate!).getTime());
    
    const pendingClean = filtered.filter(c => c.status === 'pending' || c.status === 'no_answer');
    
    const futureCallbacks = filtered
      .filter(c => c.status === 'callback' && c.callbackDate && new Date(c.callbackDate) > now)
      .sort((a, b) => new Date(a.callbackDate!).getTime() - new Date(b.callbackDate!).getTime());
    
    return [...overdueCallbacks, ...pendingClean, ...futureCallbacks];
  }, [contacts, selectedPotId]);

  const completedContacts = useMemo(() => {
    let filtered = contacts.filter(c => c.status === 'completed' || c.status === 'not_interested');
    if (selectedPotId) {
      filtered = filtered.filter(c => c.potId === selectedPotId);
    }
    return filtered;
  }, [contacts, selectedPotId]);

  // Count ALL overdue callbacks across all POTs (for nav badge)
  const overdueCallbackCount = useMemo(() => {
    const now = new Date();
    return contacts.filter(
      c => c.status === 'callback' && c.callbackDate && new Date(c.callbackDate) <= now
    ).length;
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;
    if (selectedPotId) {
      filtered = filtered.filter(c => c.potId === selectedPotId);
    }
    
    if (!searchQuery.trim()) return filtered;
    
    const query = searchQuery.toLowerCase();
    return filtered.filter(contact => 
      contact.firstName.toLowerCase().includes(query) ||
      contact.lastName.toLowerCase().includes(query) ||
      contact.company.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query) ||
      contact.jobTitle.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery, selectedPotId]);

  const currentContact = useMemo(() => {
    if (selectedContactId) {
      return contacts.find(c => c.id === selectedContactId) || null;
    }
    return queueContacts[0] || null;
  }, [contacts, selectedContactId, queueContacts]);

  const updateContactStatus = useCallback(async (
    contactId: string, 
    status: CallStatus, 
    callbackDate?: Date, 
    note?: string,
    completedReason?: CompletedReason,
    notInterestedReason?: NotInterestedReason,
    appointmentDate?: Date
  ) => {
    if (!organizationId) return;
    
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const updatedContact = { 
      ...contact, 
      status, 
      callbackDate,
      appointmentDate: status === 'completed' ? appointmentDate : undefined,
      lastCalledAt: new Date(),
      completedReason: status === 'completed' ? completedReason : undefined,
      notInterestedReason: status === 'not_interested' ? notInterestedReason : undefined,
      noAnswerCount: status === 'no_answer' ? (contact.noAnswerCount || 0) + 1 : contact.noAnswerCount,
    };

    // Mark as pending local update to skip realtime echo
    pendingLocalUpdates.current.add(contactId);
    setTimeout(() => pendingLocalUpdates.current.delete(contactId), 2000);

    // Update locally first for responsiveness
    setContacts(prev => prev.map(c => c.id === contactId ? updatedContact : c));
    // Note: selection management is handled by CallingPage.handleAction for auto-advance

    // Persist to database and add history entry concurrently
    const dbUpdates: Record<string, any> = {
      status,
      callback_date: callbackDate?.toISOString() || null,
      appointment_date: appointmentDate?.toISOString() || null,
      last_called_at: new Date().toISOString(), // Always update for every outcome
    };
    
    // Save reason columns when status is completed or not_interested
    if (status === 'completed') {
      dbUpdates.completed_reason = completedReason || null;
      dbUpdates.not_interested_reason = null;
    } else if (status === 'not_interested') {
      dbUpdates.not_interested_reason = notInterestedReason || null;
      dbUpdates.completed_reason = null;
    }

    const historyId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Run both operations concurrently for faster response
    const [contactResult] = await Promise.all([
      supabase
        .from('contacts')
        .update(dbUpdates)
        .eq('id', contactId),
      addContactHistoryEntry({
        id: historyId,
        contact_id: contactId,
        action_type: status,
        action_timestamp: timestamp,
        callback_date: callbackDate?.toISOString() || null,
        appointment_date: appointmentDate?.toISOString() || null,
        reason: completedReason || notInterestedReason || null,
        note: note || null,
        organization_id: organizationId,
      }),
    ]);

    if (contactResult.error) {
      console.error('Error updating contact status:', contactResult.error);
      toast.error('Failed to save contact status');
    }
  }, [contacts, organizationId]);

  const updateContact = useCallback(async (contactId: string, updates: Partial<Contact>) => {
    // Mark as pending local update to skip realtime echo
    pendingLocalUpdates.current.add(contactId);
    setTimeout(() => pendingLocalUpdates.current.delete(contactId), 2000);

    // Update locally first
    setContacts(prev => prev.map(contact => 
      contact.id === contactId ? { ...contact, ...updates } : contact
    ));

    // Build database update object
    const dbUpdates: Record<string, any> = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.jobTitle !== undefined) dbUpdates.job_title = updates.jobTitle;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.website !== undefined) dbUpdates.website = updates.website;
    if (updates.linkedinUrl !== undefined) dbUpdates.linkedin_url = updates.linkedinUrl || null;
    if (updates.twitterUrl !== undefined) dbUpdates.twitter_url = updates.twitterUrl || null;
    
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.callbackDate !== undefined) dbUpdates.callback_date = updates.callbackDate?.toISOString() || null;
    if (updates.qualifyingAnswers !== undefined) dbUpdates.qualifying_answers = updates.qualifyingAnswers;
    if (updates.customFields !== undefined) dbUpdates.custom_fields = updates.customFields;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase
        .from('contacts')
        .update(dbUpdates)
        .eq('id', contactId);

      if (error) {
        console.error('Error updating contact:', error);
        toast.error('Failed to save contact');
      }
    }
  }, []);

  const updateContactAnswers = useCallback(async (contactId: string, answers: Record<string, any>) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const newAnswers = { ...contact.qualifyingAnswers, ...answers };
    
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, qualifyingAnswers: newAnswers } : c
    ));

    const { error } = await supabase
      .from('contacts')
      .update({ qualifying_answers: newAnswers })
      .eq('id', contactId);

    if (error) {
      console.error('Error updating qualifying answers:', error);
    }
  }, [contacts]);

  const clearContactAnswers = useCallback(async (questionIds: string[]) => {
    const contactsToUpdate: { id: string; answers: Record<string, any> }[] = [];
    
    setContacts(prev => prev.map(contact => {
      if (!contact.qualifyingAnswers) return contact;
      const newAnswers = { ...contact.qualifyingAnswers };
      let changed = false;
      questionIds.forEach(id => {
        if (id in newAnswers) {
          delete newAnswers[id];
          changed = true;
        }
      });
      if (changed) {
        contactsToUpdate.push({ id: contact.id, answers: newAnswers });
      }
      return changed ? { ...contact, qualifyingAnswers: newAnswers } : contact;
    }));

    // Update database for each changed contact
    for (const { id, answers } of contactsToUpdate) {
      await supabase
        .from('contacts')
        .update({ qualifying_answers: answers })
        .eq('id', id);
    }
  }, []);

  const addContact = useCallback(async (contact: Omit<Contact, 'id' | 'createdAt' | 'status'>, potId: string) => {
    if (!organizationId) {
      toast.error('Not authenticated');
      return;
    }
    
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        first_name: contact.firstName,
        last_name: contact.lastName,
        company: contact.company,
        job_title: contact.jobTitle || null,
        phone: contact.phone,
        email: contact.email || null,
        website: contact.website || null,
        linkedin_url: contact.linkedinUrl || null,
        twitter_url: contact.twitterUrl || null,
        status: 'pending',
        qualifying_answers: contact.qualifyingAnswers || {},
        custom_fields: contact.customFields || {},
        pot_id: potId,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
      return;
    }

    if (data) {
      const newContact: Contact = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        company: data.company,
        jobTitle: data.job_title || '',
        phone: data.phone,
        email: data.email || '',
        website: data.website || '',
        linkedinUrl: data.linkedin_url || '',
        twitterUrl: data.twitter_url || '',
        status: data.status as CallStatus,
        qualifyingAnswers: (data.qualifying_answers as Record<string, any>) || {},
        customFields: (data.custom_fields as Record<string, any>) || {},
        createdAt: new Date(data.created_at),
        potId: data.pot_id || undefined,
      };
      setContacts(prev => [...prev, newContact]);
    }
  }, [organizationId]);

  const importContacts = useCallback(async (newContacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[], potId: string): Promise<{ imported: number; skipped: number }> => {
    if (!organizationId) {
      toast.error('Not authenticated');
      return { imported: 0, skipped: 0 };
    }

    // Duplicate detection: check existing contacts for matching email or phone
    const toInsert: typeof newContacts = [];
    let skippedCount = 0;

    for (const incoming of newContacts) {
      const emailMatch = incoming.email && contacts.some(
        c => c.email && c.email.toLowerCase() === incoming.email!.toLowerCase()
      );
      const phoneMatch = incoming.phone && contacts.some(
        c => c.phone && c.phone === incoming.phone
      );
      if (emailMatch || phoneMatch) {
        skippedCount++;
      } else {
        toInsert.push(incoming);
      }
    }

    if (toInsert.length === 0) {
      return { imported: 0, skipped: skippedCount };
    }
    
    const inserts = toInsert.map(contact => ({
      first_name: contact.firstName,
      last_name: contact.lastName,
      company: contact.company,
      job_title: contact.jobTitle || null,
      phone: contact.phone,
      email: contact.email || null,
      website: contact.website || null,
      linkedin_url: contact.linkedinUrl || null,
      twitter_url: contact.twitterUrl || null,
      status: 'pending',
      qualifying_answers: contact.qualifyingAnswers || {},
      custom_fields: contact.customFields || {},
      pot_id: potId,
      organization_id: organizationId,
    }));

    const { data, error } = await supabase
      .from('contacts')
      .insert(inserts)
      .select();

    if (error) {
      console.error('Error importing contacts:', error);
      toast.error('Failed to import contacts');
      return { imported: 0, skipped: skippedCount };
    }

    if (data) {
      const mappedContacts: Contact[] = data.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        company: row.company,
        jobTitle: row.job_title || '',
        phone: row.phone,
        email: row.email || '',
        website: row.website || '',
        linkedinUrl: row.linkedin_url || '',
        twitterUrl: row.twitter_url || '',
        status: row.status as CallStatus,
        qualifyingAnswers: (row.qualifying_answers as Record<string, any>) || {},
        customFields: (row.custom_fields as Record<string, any>) || {},
        createdAt: new Date(row.created_at),
        potId: row.pot_id || undefined,
      }));
      setContacts(prev => [...prev, ...mappedContacts]);
    }

    return { imported: data?.length || 0, skipped: skippedCount };
  }, [organizationId, contacts]);

  const deleteContact = useCallback(async (contactId: string): Promise<boolean> => {
    pendingLocalUpdates.current.add(contactId);
    
    setContacts(prev => prev.filter(c => c.id !== contactId));

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
      setTimeout(() => pendingLocalUpdates.current.delete(contactId), 2000);
      return false;
    }
    
    toast.success('Contact deleted');
    setTimeout(() => pendingLocalUpdates.current.delete(contactId), 2000);
    return true;
  }, []);

  const returnToPot = useCallback(async (contactId: string, note?: string) => {
    if (!organizationId) return;
    
    pendingLocalUpdates.current.add(contactId);
    setTimeout(() => pendingLocalUpdates.current.delete(contactId), 2000);

    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, status: 'pending' as CallStatus, completedReason: undefined, notInterestedReason: undefined } : c
    ));

    const historyId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const [contactResult] = await Promise.all([
      supabase
        .from('contacts')
        .update({ 
          status: 'pending',
          completed_reason: null,
          not_interested_reason: null
        })
        .eq('id', contactId),
      addContactHistoryEntry({
        id: historyId,
        contact_id: contactId,
        action_type: 'returned_to_pot',
        action_timestamp: timestamp,
        note: note || null,
        organization_id: organizationId,
      }),
    ]);

    if (contactResult.error) {
      console.error('Error returning contact to pot:', contactResult.error);
      toast.error('Failed to return contact to pot');
    } else {
      toast.success('Contact returned to pot');
    }
  }, [organizationId]);

  const rebookAppointment = useCallback(async (contactId: string, newDate: Date, note?: string) => {
    if (!organizationId) return;
    
    pendingLocalUpdates.current.add(contactId);
    setTimeout(() => pendingLocalUpdates.current.delete(contactId), 2000);

    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, appointmentDate: newDate, status: 'completed' as CallStatus } : c
    ));

    const historyId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const [contactResult] = await Promise.all([
      supabase
        .from('contacts')
        .update({ 
          appointment_date: newDate.toISOString(),
          status: 'completed',
          appointment_attended: null
        })
        .eq('id', contactId),
      addContactHistoryEntry({
        id: historyId,
        contact_id: contactId,
        action_type: 'rebooked',
        action_timestamp: timestamp,
        appointment_date: newDate.toISOString(),
        note: note || null,
        organization_id: organizationId,
      }),
    ]);

    if (contactResult.error) {
      console.error('Error rebooking appointment:', contactResult.error);
      toast.error('Failed to rebook appointment');
    } else {
      toast.success('Appointment rebooked');
    }
  }, [organizationId]);

  const rescheduleCallback = useCallback(async (contactId: string, newDate: Date, note?: string) => {
    if (!organizationId) return;
    
    pendingLocalUpdates.current.add(contactId);
    setTimeout(() => pendingLocalUpdates.current.delete(contactId), 2000);

    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, callbackDate: newDate, status: 'callback' as CallStatus } : c
    ));

    const historyId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const [contactResult] = await Promise.all([
      supabase
        .from('contacts')
        .update({ 
          callback_date: newDate.toISOString(),
          status: 'callback'
        })
        .eq('id', contactId),
      addContactHistoryEntry({
        id: historyId,
        contact_id: contactId,
        action_type: 'rescheduled',
        action_timestamp: timestamp,
        callback_date: newDate.toISOString(),
        note: note || null,
        organization_id: organizationId,
      }),
    ]);

    if (contactResult.error) {
      console.error('Error rescheduling callback:', contactResult.error);
      toast.error('Failed to reschedule callback');
    } else {
      toast.success('Callback rescheduled');
    }
  }, [organizationId]);

  const markAppointmentAttendance = useCallback(async (contactId: string, attended: boolean, note?: string) => {
    if (!organizationId) return;
    
    pendingLocalUpdates.current.add(contactId);
    setTimeout(() => pendingLocalUpdates.current.delete(contactId), 2000);

    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, appointmentAttended: attended } : c
    ));

    const historyId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const [contactResult] = await Promise.all([
      supabase
        .from('contacts')
        .update({ appointment_attended: attended })
        .eq('id', contactId),
      addContactHistoryEntry({
        id: historyId,
        contact_id: contactId,
        action_type: attended ? 'appointment_attended' : 'appointment_no_show',
        action_timestamp: timestamp,
        note: note || null,
        organization_id: organizationId,
      }),
    ]);

    if (contactResult.error) {
      console.error('Error marking appointment attendance:', contactResult.error);
      toast.error('Failed to update appointment');
    } else {
      toast.success(attended ? 'Appointment marked as attended' : 'Appointment marked as no-show');
    }
  }, [organizationId]);

  // Shuffle pending contacts randomly
  const shufflePending = useCallback(() => {
    setContacts(prev => {
      const pending = prev.filter(c => c.status === 'pending' || c.status === 'no_answer');
      const others = prev.filter(c => c.status !== 'pending' && c.status !== 'no_answer');
      
      // Fisher-Yates shuffle
      for (let i = pending.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pending[i], pending[j]] = [pending[j], pending[i]];
      }
      
      return [...others, ...pending];
    });
    toast.success('Queue shuffled');
  }, []);

  // Sort contacts by company name
  const sortByCompany = useCallback(() => {
    setContacts(prev => {
      const pending = prev.filter(c => c.status === 'pending' || c.status === 'no_answer');
      const others = prev.filter(c => c.status !== 'pending' && c.status !== 'no_answer');
      
      pending.sort((a, b) => a.company.localeCompare(b.company));
      
      return [...others, ...pending];
    });
    toast.success('Sorted by company');
  }, []);

  return {
    contacts,
    queueContacts,
    completedContacts,
    filteredContacts,
    overdueCallbackCount,
    currentContact,
    selectedContactId,
    setSelectedContactId,
    searchQuery,
    setSearchQuery,
    updateContactStatus,
    updateContact,
    updateContactAnswers,
    clearContactAnswers,
    addContact,
    importContacts,
    deleteContact,
    returnToPot,
    rebookAppointment,
    rescheduleCallback,
    markAppointmentAttendance,
    isLoading,
    // Aliases for pages expecting different names
    selectContact: setSelectedContactId,
    shufflePending,
    sortByCompany,
    markAppointmentAttended: markAppointmentAttendance,
    rescheduleAppointment: rescheduleCallback,
  };
}
