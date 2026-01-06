import { useState, useCallback, useMemo, useEffect } from 'react';
import { Contact, CallStatus, CompletedReason, NotInterestedReason } from '@/types/contact';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Helper to add history entry
async function addContactHistoryEntry(entry: {
  contact_id: string;
  action_type: string;
  action_timestamp: string;
  callback_date?: string | null;
  appointment_date?: string | null;
  reason?: string | null;
  note?: string | null;
}) {
  const { error } = await supabase
    .from('contact_history')
    .insert(entry);
  
  if (error) {
    console.error('Error adding history entry:', error);
  }
}

export function useContacts(selectedPotId?: string | null) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load contacts from database
  useEffect(() => {
    const loadContacts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
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
        setContacts(mappedContacts);
      }
      setIsLoading(false);
    };

    loadContacts();
  }, []);

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
    };

    // Update locally first for responsiveness
    setContacts(prev => prev.map(c => c.id === contactId ? updatedContact : c));
    setSelectedContactId(null);

    // Persist to database
    const dbUpdates: Record<string, any> = {
      status,
      callback_date: callbackDate?.toISOString() || null,
      appointment_date: appointmentDate?.toISOString() || null,
    };
    
    // Save reason columns when status is completed or not_interested
    if (status === 'completed') {
      dbUpdates.completed_reason = completedReason || null;
      dbUpdates.not_interested_reason = null;
    } else if (status === 'not_interested') {
      dbUpdates.not_interested_reason = notInterestedReason || null;
      dbUpdates.completed_reason = null;
    }
    
    const { error } = await supabase
      .from('contacts')
      .update(dbUpdates)
      .eq('id', contactId);

    if (error) {
      console.error('Error updating contact status:', error);
      toast.error('Failed to save contact status');
      return;
    }

    // Add history entry
    await addContactHistoryEntry({
      contact_id: contactId,
      action_type: status,
      action_timestamp: new Date().toISOString(),
      callback_date: callbackDate?.toISOString() || null,
      appointment_date: appointmentDate?.toISOString() || null,
      reason: completedReason || notInterestedReason || null,
      note: note || null,
    });
  }, [contacts]);

  const updateContact = useCallback(async (contactId: string, updates: Partial<Contact>) => {
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
        status: 'pending',
        qualifying_answers: contact.qualifyingAnswers || {},
        custom_fields: contact.customFields || {},
        pot_id: potId,
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
        status: data.status as CallStatus,
        qualifyingAnswers: (data.qualifying_answers as Record<string, any>) || {},
        customFields: (data.custom_fields as Record<string, any>) || {},
        createdAt: new Date(data.created_at),
        potId: data.pot_id || undefined,
      };
      setContacts(prev => [...prev, newContact]);
    }
  }, []);

  const importContacts = useCallback(async (newContacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[], potId: string) => {
    const inserts = newContacts.map(contact => ({
      first_name: contact.firstName,
      last_name: contact.lastName,
      company: contact.company,
      job_title: contact.jobTitle || null,
      phone: contact.phone,
      email: contact.email || null,
      website: contact.website || null,
      status: 'pending',
      qualifying_answers: contact.qualifyingAnswers || {},
      custom_fields: contact.customFields || {},
      pot_id: potId,
    }));

    const { data, error } = await supabase
      .from('contacts')
      .insert(inserts)
      .select();

    if (error) {
      console.error('Error importing contacts:', error);
      toast.error('Failed to import contacts');
      return;
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
        status: row.status as CallStatus,
        qualifyingAnswers: (row.qualifying_answers as Record<string, any>) || {},
        customFields: (row.custom_fields as Record<string, any>) || {},
        createdAt: new Date(row.created_at),
        potId: row.pot_id || undefined,
      }));
      setContacts(prev => [...prev, ...mappedContacts]);
      toast.success(`Imported ${data.length} contacts`);
    }
  }, []);

  const selectContact = useCallback((contactId: string | null) => {
    setSelectedContactId(contactId);
  }, []);

  const shufflePending = useCallback(() => {
    setContacts(prev => {
      const pending = prev.filter(c => 
        (c.status === 'pending' || c.status === 'no_answer') &&
        (!selectedPotId || c.potId === selectedPotId)
      );
      const others = prev.filter(c => 
        (c.status !== 'pending' && c.status !== 'no_answer') ||
        (selectedPotId && c.potId !== selectedPotId)
      );
      
      // Fisher-Yates shuffle
      for (let i = pending.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pending[i], pending[j]] = [pending[j], pending[i]];
      }
      
      return [...others, ...pending];
    });
  }, [selectedPotId]);

  const sortByCompany = useCallback(() => {
    setContacts(prev => {
      const pending = prev.filter(c => 
        (c.status === 'pending' || c.status === 'no_answer') &&
        (!selectedPotId || c.potId === selectedPotId)
      );
      const others = prev.filter(c => 
        (c.status !== 'pending' && c.status !== 'no_answer') ||
        (selectedPotId && c.potId !== selectedPotId)
      );
      
      pending.sort((a, b) => a.company.localeCompare(b.company));
      
      return [...others, ...pending];
    });
  }, [selectedPotId]);

  // Mark appointment as attended or no-show
  const markAppointmentAttended = useCallback(async (contactId: string, attended: boolean) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, appointmentAttended: attended } : c
    ));

    const { error } = await supabase
      .from('contacts')
      .update({ appointment_attended: attended })
      .eq('id', contactId);

    if (error) {
      console.error('Error marking appointment attended:', error);
      toast.error('Failed to update appointment status');
      return;
    }

    // Add history entry for attended status
    await addContactHistoryEntry({
      contact_id: contactId,
      action_type: attended ? 'appointment_attended' : 'appointment_no_show',
      action_timestamp: new Date().toISOString(),
      appointment_date: contact.appointmentDate?.toISOString() || null,
      note: attended ? 'Appointment attended' : 'Appointment was a no-show',
    });
  }, [contacts]);

  // Return contact to pot after no-show (callback date is optional)
  const returnToPot = useCallback(async (
    contactId: string, 
    callbackDate?: Date, 
    originalReason?: string
  ) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const newStatus = callbackDate ? 'callback' : 'pending';

    // Update locally
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { 
        ...c, 
        status: newStatus as CallStatus, 
        callbackDate, 
        appointmentAttended: false,
        appointmentDate: undefined,
        completedReason: undefined,
      } : c
    ));

    // Persist to database
    const { error } = await supabase
      .from('contacts')
      .update({
        status: newStatus,
        callback_date: callbackDate?.toISOString() || null,
        appointment_attended: false,
        appointment_date: null,
      })
      .eq('id', contactId);

    if (error) {
      console.error('Error returning contact to pot:', error);
      toast.error('Failed to return contact to pot');
      return;
    }

    // Add history entry for return to pot
    await addContactHistoryEntry({
      contact_id: contactId,
      action_type: 'returned_to_pot',
      action_timestamp: new Date().toISOString(),
      callback_date: callbackDate?.toISOString() || null,
      reason: 'appointment_no_show',
      note: callbackDate 
        ? `Returned to pot with callback. Originally completed as ${originalReason || 'appointment_booked'}.`
        : `Returned to pending queue. Originally completed as ${originalReason || 'appointment_booked'}.`,
    });

    toast.success(callbackDate ? 'Contact returned to pot with callback' : 'Contact returned to pending queue');
  }, [contacts]);

  // Rebook appointment for a no-show
  const rebookAppointment = useCallback(async (
    contactId: string,
    newAppointmentDate: Date,
    notes?: string
  ) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    // Update locally - keep as completed but reset appointment_attended
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { 
        ...c, 
        appointmentDate: newAppointmentDate,
        appointmentAttended: null,
      } : c
    ));

    // Persist to database
    const { error } = await supabase
      .from('contacts')
      .update({
        appointment_date: newAppointmentDate.toISOString(),
        appointment_attended: null,
      })
      .eq('id', contactId);

    if (error) {
      console.error('Error rebooking appointment:', error);
      toast.error('Failed to rebook appointment');
      return;
    }

    // Add history entry for rebook
    await addContactHistoryEntry({
      contact_id: contactId,
      action_type: 'rebooked',
      action_timestamp: new Date().toISOString(),
      appointment_date: newAppointmentDate.toISOString(),
      note: notes || 'Appointment rebooked after no-show',
    });

    toast.success('Appointment rebooked');
  }, [contacts]);

  // Reschedule appointment (for any appointment, not just no-shows)
  const rescheduleAppointment = useCallback(async (
    contactId: string,
    newAppointmentDate: Date,
    notes?: string
  ) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const oldAppointmentDate = contact.appointmentDate;

    // Update locally
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { 
        ...c, 
        appointmentDate: newAppointmentDate,
        appointmentAttended: null, // Reset since it's a new appointment
      } : c
    ));

    // Persist to database
    const { error } = await supabase
      .from('contacts')
      .update({
        appointment_date: newAppointmentDate.toISOString(),
        appointment_attended: null,
      })
      .eq('id', contactId);

    if (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error('Failed to reschedule appointment');
      return;
    }

    // Add history entry for reschedule
    const oldDateStr = oldAppointmentDate ? format(oldAppointmentDate, 'do MMM HH:mm') : 'N/A';
    const newDateStr = format(newAppointmentDate, 'do MMM HH:mm');
    
    await addContactHistoryEntry({
      contact_id: contactId,
      action_type: 'rescheduled',
      action_timestamp: new Date().toISOString(),
      appointment_date: newAppointmentDate.toISOString(),
      note: notes || `Rescheduled from ${oldDateStr} to ${newDateStr}`,
    });

    toast.success('Appointment rescheduled');
  }, [contacts]);

  const stats = useMemo(() => ({
    total: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    noAnswer: contacts.filter(c => c.status === 'no_answer').length,
    callbacks: contacts.filter(c => c.status === 'callback').length,
    completed: contacts.filter(c => c.status === 'completed').length,
    notInterested: contacts.filter(c => c.status === 'not_interested').length,
    inQueue: queueContacts.length,
  }), [contacts, queueContacts]);

  return {
    contacts,
    queueContacts,
    completedContacts,
    filteredContacts,
    currentContact,
    updateContactStatus,
    updateContact,
    updateContactAnswers,
    clearContactAnswers,
    addContact,
    importContacts,
    selectContact,
    shufflePending,
    sortByCompany,
    markAppointmentAttended,
    returnToPot,
    rebookAppointment,
    rescheduleAppointment,
    searchQuery,
    setSearchQuery,
    stats,
    isLoading,
  };
}
