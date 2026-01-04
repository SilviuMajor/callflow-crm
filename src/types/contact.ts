export type CallStatus = 'pending' | 'no_answer' | 'callback' | 'completed' | 'not_interested';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  phone: string;
  email: string;
  website: string;
  notes: string;
  status: CallStatus;
  callbackDate?: Date;
  createdAt: Date;
  lastCalledAt?: Date;
}

export interface CallbackSchedule {
  contactId: string;
  scheduledFor: Date;
  notes: string;
}
