import { useState, useCallback, useMemo } from 'react';
import { Contact, CallStatus } from '@/types/contact';

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
    phone: '+1 (555) 234-5678',
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
    phone: '+1 (555) 345-6789',
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
    status: 'pending',
    createdAt: new Date(),
  },
  {
    id: generateId(),
    firstName: 'Lisa',
    lastName: 'Anderson',
    company: 'Scale Ventures',
    jobTitle: 'Partner',
    phone: '+1 (555) 567-8901',
    email: 'lisa@scaleventures.vc',
    website: 'https://scaleventures.vc',
    notes: 'Looking for portfolio companies',
    status: 'pending',
    createdAt: new Date(),
  },
];

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pendingContacts = useMemo(() => 
    contacts.filter(c => c.status === 'pending'),
    [contacts]
  );

  const callbackContacts = useMemo(() => 
    contacts.filter(c => c.status === 'callback' && c.callbackDate && new Date(c.callbackDate) <= new Date()),
    [contacts]
  );

  const currentContact = useMemo(() => {
    // Priority: callbacks that are due, then pending
    if (callbackContacts.length > 0) {
      return callbackContacts[0];
    }
    return pendingContacts[currentIndex] || null;
  }, [pendingContacts, callbackContacts, currentIndex]);

  const updateContactStatus = useCallback((contactId: string, status: CallStatus, callbackDate?: Date, notes?: string) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { 
            ...contact, 
            status, 
            callbackDate,
            notes: notes || contact.notes,
            lastCalledAt: new Date()
          } 
        : contact
    ));
    
    // Move to next contact
    if (status !== 'callback') {
      setCurrentIndex(prev => prev);
    }
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

  const stats = useMemo(() => ({
    total: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    noAnswer: contacts.filter(c => c.status === 'no_answer').length,
    callbacks: contacts.filter(c => c.status === 'callback').length,
    completed: contacts.filter(c => c.status === 'completed').length,
    notInterested: contacts.filter(c => c.status === 'not_interested').length,
    dueCallbacks: callbackContacts.length,
  }), [contacts, callbackContacts]);

  return {
    contacts,
    currentContact,
    pendingContacts,
    callbackContacts,
    updateContactStatus,
    addContact,
    importContacts,
    stats,
  };
}
