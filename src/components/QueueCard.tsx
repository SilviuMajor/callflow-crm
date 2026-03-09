import { Contact } from '@/types/contact';
import { cn } from '@/lib/utils';
import { PhoneOff } from 'lucide-react';

interface QueueCardProps {
  contact: Contact;
  isActive: boolean;
  onClick: () => void;
  potName?: string;
}

function getCallbackStatus(callbackDate: Date | undefined): {
  isOverdue: boolean;
  hoursOverdue: number;
  isFuture: boolean;
} {
  if (!callbackDate) return { isOverdue: false, hoursOverdue: 0, isFuture: false };
  
  const now = new Date();
  const diff = now.getTime() - new Date(callbackDate).getTime();
  const hoursOverdue = diff / (1000 * 60 * 60);
  
  return {
    isOverdue: hoursOverdue > 0,
    hoursOverdue,
    isFuture: hoursOverdue < 0,
  };
}

function getCardStyle(contact: Contact, isActive: boolean): string {
  const selectionClasses = isActive ? 'ring-2 ring-primary' : '';
  
  if (contact.status === 'callback' && contact.callbackDate) {
    const { isOverdue, hoursOverdue, isFuture } = getCallbackStatus(contact.callbackDate);
    
    if (isFuture) {
      return `bg-muted/50 border-muted-foreground/20 ${selectionClasses}`.trim();
    }
    
    if (isOverdue) {
      if (hoursOverdue >= 24) return `bg-[hsl(var(--callback-overdue-24))]/20 border-[hsl(var(--callback-overdue-24))] ${selectionClasses}`.trim();
      if (hoursOverdue >= 5) return `bg-[hsl(var(--callback-overdue-5))]/20 border-[hsl(var(--callback-overdue-5))] ${selectionClasses}`.trim();
      if (hoursOverdue >= 3) return `bg-[hsl(var(--callback-overdue-3))]/20 border-[hsl(var(--callback-overdue-3))] ${selectionClasses}`.trim();
      if (hoursOverdue >= 1) return `bg-[hsl(var(--callback-overdue-1))]/20 border-[hsl(var(--callback-overdue-1))] ${selectionClasses}`.trim();
      return `bg-[hsl(var(--callback-light))] border-[hsl(var(--callback))] ${selectionClasses}`.trim();
    }
    
    return `bg-[hsl(var(--callback-light))] border-[hsl(var(--callback))] ${selectionClasses}`.trim();
  }
  
  // Non-callback contacts
  if (isActive) {
    return 'ring-2 ring-primary bg-primary/5';
  }
  
  return 'bg-card hover:bg-accent/50';
}

export function QueueCard({ contact, isActive, onClick, potName }: QueueCardProps) {
  const { isFuture } = contact.status === 'callback' && contact.callbackDate 
    ? getCallbackStatus(contact.callbackDate) 
    : { isFuture: false };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-2 rounded border transition-all',
        getCardStyle(contact, isActive)
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {contact.firstName} {contact.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {contact.jobTitle}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {contact.company}
          </p>
        </div>
        {potName && (
          <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded shrink-0 max-w-[60px] truncate">
            {potName}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-0.5">
        {isFuture && contact.callbackDate ? (
          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            📅 {new Date(contact.callbackDate).toLocaleDateString()}
          </p>
        ) : <span />}
        {(contact.noAnswerCount || 0) > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <PhoneOff className="w-2.5 h-2.5" />
            {contact.noAnswerCount}
          </span>
        )}
      </div>
    </button>
  );
}
