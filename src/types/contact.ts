export type CallStatus = 'pending' | 'no_answer' | 'callback' | 'completed' | 'not_interested';

export type CompletedReason = 
  | 'appointment_booked' 
  | 'sale_closed' 
  | 'demo_scheduled' 
  | 'proposal_sent' 
  | 'info_sent' 
  | 'other';

export type NotInterestedReason = 
  | 'no_budget' 
  | 'wrong_timing' 
  | 'using_competitor' 
  | 'no_need' 
  | 'gatekeeper_block' 
  | 'do_not_call' 
  | 'other';

export type QuestionType = 
  | 'short_text' 
  | 'long_text' 
  | 'number' 
  | 'currency' 
  | 'email' 
  | 'phone' 
  | 'url' 
  | 'date' 
  | 'rating' 
  | 'dropdown' 
  | 'radio' 
  | 'checkbox';

export interface QualifyingQuestion {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
  order: number;
}

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
  completedReason?: CompletedReason;
  notInterestedReason?: NotInterestedReason;
  qualifyingAnswers?: Record<string, any>;
}

export interface CallbackSchedule {
  contactId: string;
  scheduledFor: Date;
  notes: string;
}

export const COMPLETED_REASONS: { value: CompletedReason; label: string }[] = [
  { value: 'appointment_booked', label: 'Appointment Booked' },
  { value: 'sale_closed', label: 'Sale Closed' },
  { value: 'demo_scheduled', label: 'Demo Scheduled' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'info_sent', label: 'Info Sent' },
  { value: 'other', label: 'Other' },
];

export const NOT_INTERESTED_REASONS: { value: NotInterestedReason; label: string }[] = [
  { value: 'no_budget', label: 'No Budget' },
  { value: 'wrong_timing', label: 'Wrong Timing' },
  { value: 'using_competitor', label: 'Using Competitor' },
  { value: 'no_need', label: 'No Need' },
  { value: 'gatekeeper_block', label: 'Gatekeeper Block' },
  { value: 'do_not_call', label: 'Do Not Call' },
  { value: 'other', label: 'Other' },
];

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Single Choice' },
  { value: 'checkbox', label: 'Multiple Choice' },
];
