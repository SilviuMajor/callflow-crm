import { Contact } from '@/types/contact';
import { QueueCard } from './QueueCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, ArrowDownAZ } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PotWithStats } from '@/hooks/usePots';

interface QueueListProps {
  contacts: Contact[];
  currentContactId: string | null;
  onSelectContact: (id: string) => void;
  onShuffle: () => void;
  onSortByCompany: () => void;
  isMobile?: boolean;
  pots?: PotWithStats[];
  selectedPotId?: string | null;
  onSelectPot?: (potId: string | null) => void;
  totalStats?: { total: number; callbacks: number; notInterested: number; completed: number };
  contactPotMap?: Record<string, string>; // contactId -> potName
}

export function QueueList({ 
  contacts, 
  currentContactId, 
  onSelectContact, 
  onShuffle, 
  onSortByCompany,
  isMobile = false,
  pots = [],
  selectedPotId,
  onSelectPot,
  totalStats,
  contactPotMap = {},
}: QueueListProps) {
  const showPotOnCard = selectedPotId === null && pots.length > 0;

  return (
    <div className={cn(
      "border-r border-border bg-card flex flex-col h-full",
      isMobile ? "w-full border-r-0" : "w-64"
    )}>
      {/* POT Selector */}
      {pots.length > 0 && onSelectPot && (
        <div className="p-3 border-b border-border">
          <Select 
            value={selectedPotId || 'all'} 
            onValueChange={(v) => onSelectPot(v === 'all' ? null : v)}
          >
            <SelectTrigger className="h-auto min-h-[48px] text-sm py-2">
              <SelectValue placeholder="Select POT" />
            </SelectTrigger>
            <SelectContent className="min-w-[300px]">
              <SelectItem value="all">
                <span className="flex flex-col py-1">
                  <span className="font-medium">All POTs</span>
                  <span className="text-muted-foreground text-xs">
                    {totalStats?.total || 0} Contacts | {totalStats?.callbacks || 0} Callbacks | {totalStats?.notInterested || 0} Not Interested | {totalStats?.completed || 0} Completed
                  </span>
                </span>
              </SelectItem>
              {pots.map(pot => (
                <SelectItem key={pot.id} value={pot.id}>
                  <span className="flex flex-col py-1">
                    <span className="font-medium">{pot.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {pot.totalRecords} Contacts | {pot.callbackCount} Callbacks | {pot.notInterestedCount} Not Interested | {pot.completedCount} Completed
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
              potName={showPotOnCard ? contactPotMap[contact.id] : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
