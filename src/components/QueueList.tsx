import { useState, useMemo } from 'react';
import { Contact } from '@/types/contact';
import { QueueCard } from './QueueCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, ArrowDownAZ, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PotWithStats } from '@/hooks/usePots';
import { POTManagementDialog } from './POTManagementDialog';

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
  onRenamePot?: (potId: string, newName: string) => Promise<boolean>;
  onDeletePot?: (potId: string, moveContactsToPotId?: string) => Promise<boolean>;
  onMergePots?: (sourcePotId: string, targetPotId: string) => Promise<boolean>;
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
  onRenamePot,
  onDeletePot,
  onMergePots,
}: QueueListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPotManagement, setShowPotManagement] = useState(false);
  
  const showPotOnCard = selectedPotId === null && pots.length > 0;

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.firstName.toLowerCase().includes(query) ||
      c.lastName.toLowerCase().includes(query) ||
      c.company.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  return (
    <div className={cn(
      "border-r border-border bg-card flex flex-col h-full",
      isMobile ? "w-full border-r-0" : "w-64"
    )}>
      {/* POT Selector */}
      {pots.length > 0 && onSelectPot && (
        <div className="p-3 border-b border-border">
          <div className="flex gap-1">
            <Select 
              value={selectedPotId || 'all'} 
              onValueChange={(v) => onSelectPot(v === 'all' ? null : v)}
            >
              <SelectTrigger className="h-9 text-sm flex-1">
                <SelectValue placeholder="Select POT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Pots - {totalStats?.total || 0} Contacts
                </SelectItem>
                {pots.map(pot => (
                  <SelectItem key={pot.id} value={pot.id}>
                    {pot.name} - {pot.totalRecords} Contacts
                  </SelectItem>
                ))}
            {/* Manage POTs option - only visible inside dropdown */}
            {onRenamePot && onDeletePot && onMergePots && (
              <div className="border-t border-border mt-2 pt-2">
                <button
                  className="w-full flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:bg-muted rounded cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPotManagement(true);
                  }}
                >
                  <Settings className="w-4 h-4" />
                  Manage POTs
                </button>
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search queue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Queue ({filteredContacts.length}{searchQuery && ` of ${contacts.length}`})
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
        {filteredContacts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {searchQuery ? 'No matching contacts' : 'No contacts in queue'}
          </p>
        ) : (
          filteredContacts.map(contact => (
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

      {/* POT Management Dialog */}
      {onRenamePot && onDeletePot && onMergePots && (
        <POTManagementDialog
          open={showPotManagement}
          onOpenChange={setShowPotManagement}
          pots={pots}
          onRenamePot={onRenamePot}
          onDeletePot={onDeletePot}
          onMergePots={onMergePots}
        />
      )}
    </div>
  );
}
