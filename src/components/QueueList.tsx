import { Contact } from '@/types/contact';
import { QueueCard } from './QueueCard';
import { Button } from '@/components/ui/button';
import { Shuffle, ArrowDownAZ } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueListProps {
  contacts: Contact[];
  currentContactId: string | null;
  onSelectContact: (id: string) => void;
  onShuffle: () => void;
  onSortByCompany: () => void;
  isMobile?: boolean;
}

export function QueueList({ 
  contacts, 
  currentContactId, 
  onSelectContact, 
  onShuffle, 
  onSortByCompany,
  isMobile = false
}: QueueListProps) {
  return (
    <div className={cn(
      "border-r border-border bg-card flex flex-col h-full",
      isMobile ? "w-full border-r-0" : "w-64"
    )}>
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Queue ({contacts.length})
        </span>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={onShuffle}
            title="Shuffle pending"
          >
            <Shuffle className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={onSortByCompany}
            title="Sort by company"
          >
            <ArrowDownAZ className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {contacts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No contacts in queue
          </p>
        ) : (
          contacts.map(contact => (
            <QueueCard
              key={contact.id}
              contact={contact}
              isActive={contact.id === currentContactId}
              onClick={() => onSelectContact(contact.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
