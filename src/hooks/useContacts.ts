import { useState, useCallback, useMemo } from 'react';
import { Contact, CallStatus, CompletedReason, NotInterestedReason } from '@/types/contact';

const generateId = () => Math.random().toString(36).substr(2, 9);

const sampleContacts: Contact[] = [
  {
    id: generateId(),
    firstName: 'Sarah',
    lastName: 'Mitchell',
    company: 'TechCorp Solutions',
    jobTitle: 'VP of Sales',
    phone: '+1 (555) 123-4567',
    email: 'sarah.mitchell@techcorp.com',
    website: 'https://techcorp.com',
    notes: 'Interested in enterprise plan',
    status: 'pending',
    createdAt: new Date(),
  },
  {
    id: generateId(),
    firstName: 'James',
    lastName: 'Wilson',
    company: 'Growth Industries',
    jobTitle: 'CEO',
    phone: '+44 7700 900123',
    email: 'james@growthindustries.io',
    website: 'https://growthindustries.io',
    notes: 'Referred by Mark Thompson',
    status: 'pending',
    createdAt: new Date(),
  },
  {
    id: generateId(),
    firstName: 'Emily',
    lastName: 'Chen',
    company: 'DataFlow Analytics',
    jobTitle: 'Head of Operations',
    phone: '+44 20 7946 0958',
    email: 'emily.chen@dataflow.co',
    website: 'https://dataflow.co',
    notes: 'Follow up on demo request',
    status: 'pending',
    createdAt: new Date(),
  },
  {
    id: generateId(),
    firstName: 'Michael',
    lastName: 'Roberts',
    company: 'Innovate Labs',
    jobTitle: 'Director of Procurement',
    phone: '+1 (555) 456-7890',
    email: 'mroberts@innovatelabs.com',
    website: 'https://innovatelabs.com',
    notes: 'Budget approved for Q2',
    status: 'callback',
    callbackDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago (overdue)
    createdAt: new Date(),
  },
  {
    id: generateId(),
    firstName: 'Lisa',
    lastName: 'Anderson',
    company: 'Scale Ventures',
    jobTitle: 'Partner',
    phone: '+44 7911 123456',
    email: 'lisa@scaleventures.vc',
    website: 'https://scaleventures.vc',
    notes: 'Looking for portfolio companies',
    status: 'pending',
    createdAt: new Date(),
  },
  {
    id: generateId(),
    firstName: 'David',
    lastName: 'Kim',
    company: 'NextGen Software',
    jobTitle: 'CTO',
    phone: '+1 (555) 678-9012',
    email: 'david.kim@nextgen.io',
    website: 'https://nextgen.io',
    notes: 'Technical evaluation needed',
    status: 'callback',
    callbackDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow (future)
    createdAt: new Date(),
  },
];

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Queue contacts: overdue callbacks -> pending -> future callbacks
  const queueContacts = useMemo(() => {
    const now = new Date();
    
    const overdueCallbacks = contacts
      .filter(c => c.status === 'callback' && c.callbackDate && new Date(c.callbackDate) <= now)
      .sort((a, b) => new Date(a.callbackDate!).getTime() - new Date(b.callbackDate!).getTime());
    
    const pendingClean = contacts.filter(c => c.status === 'pending' || c.status === 'no_answer');
    
    const futureCallbacks = contacts
      .filter(c => c.status === 'callback' && c.callbackDate && new Date(c.callbackDate) > now)
      .sort((a, b) => new Date(a.callbackDate!).getTime() - new Date(b.callbackDate!).getTime());
    
    return [...overdueCallbacks, ...pendingClean, ...futureCallbacks];
  }, [contacts]);

  const completedContacts = useMemo(() => 
    contacts.filter(c => c.status === 'completed' || c.status === 'not_interested'),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.firstName.toLowerCase().includes(query) ||
      contact.lastName.toLowerCase().includes(query) ||
      contact.company.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query) ||
      contact.jobTitle.toLowerCase().includes(query) ||
      contact.notes.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const currentContact = useMemo(() => {
    if (selectedContactId) {
      return contacts.find(c => c.id === selectedContactId) || null;
    }
    return queueContacts[0] || null;
  }, [contacts, selectedContactId, queueContacts]);

  const updateContactStatus = useCallback((
    contactId: string, 
    status: CallStatus, 
    callbackDate?: Date, 
    notes?: string,
    completedReason?: CompletedReason,
    notInterestedReason?: NotInterestedReason,
    appointmentDate?: Date
  ) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { 
            ...contact, 
            status, 
            callbackDate,
            appointmentDate: status === 'completed' ? appointmentDate : undefined,
            notes: notes || contact.notes,
            lastCalledAt: new Date(),
            completedReason: status === 'completed' ? completedReason : undefined,
            notInterestedReason: status === 'not_interested' ? notInterestedReason : undefined,
          } 
        : contact
    ));
    
    // After outcome, go back to top of queue
    setSelectedContactId(null);
  }, []);

  const updateContact = useCallback((contactId: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, ...updates }
        : contact
    ));
  }, []);

  const updateContactAnswers = useCallback((contactId: string, answers: Record<string, any>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, qualifyingAnswers: { ...contact.qualifyingAnswers, ...answers } }
        : contact
    ));
  }, []);

  const clearContactAnswers = useCallback((questionIds: string[]) => {
    setContacts(prev => prev.map(contact => {
      if (!contact.qualifyingAnswers) return contact;
      const newAnswers = { ...contact.qualifyingAnswers };
      questionIds.forEach(id => delete newAnswers[id]);
      return { ...contact, qualifyingAnswers: newAnswers };
    }));
  }, []);

  const addContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt' | 'status'>) => {
    const newContact: Contact = {
      ...contact,
      id: generateId(),
      status: 'pending',
      createdAt: new Date(),
    };
    setContacts(prev => [...prev, newContact]);
  }, []);

  const importContacts = useCallback((newContacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[]) => {
    const contactsToAdd: Contact[] = newContacts.map(contact => ({
      ...contact,
      id: generateId(),
      status: 'pending' as CallStatus,
      createdAt: new Date(),
    }));
    setContacts(prev => [...prev, ...contactsToAdd]);
  }, []);

  const selectContact = useCallback((contactId: string | null) => {
    setSelectedContactId(contactId);
  }, []);

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
  }, []);

  const sortByCompany = useCallback(() => {
    setContacts(prev => {
      const pending = prev.filter(c => c.status === 'pending' || c.status === 'no_answer');
      const others = prev.filter(c => c.status !== 'pending' && c.status !== 'no_answer');
      
      pending.sort((a, b) => a.company.localeCompare(b.company));
      
      return [...others, ...pending];
    });
  }, []);

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
    searchQuery,
    setSearchQuery,
    stats,
  };
}
