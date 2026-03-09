import { useState } from 'react';
import { useContactHistory, HistoryEntry } from '@/hooks/useContactHistory';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Phone, PhoneOff, Clock, CheckCircle2, XCircle, StickyNote, Trash2, RotateCcw, CalendarPlus, UserCheck, UserX, CalendarClock, X, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ContactHistoryBarProps {
  contactId: string;
  onHistoryChange?: () => void;
}

const ACTION_CONFIG: Record<string, { 
  icon: typeof Phone; 
  label: string; 
  bgClass: string; 
  borderClass: string;
  iconColor: string;
}> = {
  no_answer: { 
    icon: PhoneOff, 
    label: 'No Answer', 
    bgClass: 'bg-muted/50',
    borderClass: 'border-muted-foreground/30',
    iconColor: 'text-muted-foreground'
  },
  callback: { 
    icon: Clock, 
    label: 'Callback', 
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/50',
    iconColor: 'text-amber-500'
  },
  completed: { 
    icon: CheckCircle2, 
    label: 'Completed', 
    bgClass: 'bg-success/10',
    borderClass: 'border-success/50',
    iconColor: 'text-success'
  },
  not_interested: { 
    icon: XCircle, 
    label: 'Not Interested', 
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/50',
    iconColor: 'text-destructive'
  },
  note: { 
    icon: StickyNote, 
    label: 'Note', 
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/50',
    iconColor: 'text-blue-500'
  },
  returned_to_pot: { 
    icon: RotateCcw, 
    label: 'Returned to Pot', 
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/50',
    iconColor: 'text-orange-500'
  },
  rebooked: { 
    icon: CalendarPlus, 
    label: 'Rebooked', 
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/50',
    iconColor: 'text-blue-500'
  },
  rescheduled: { 
    icon: CalendarClock, 
    label: 'Rescheduled', 
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/50',
    iconColor: 'text-orange-500'
  },
  appointment_attended: { 
    icon: UserCheck, 
    label: 'Attended', 
    bgClass: 'bg-success/10',
    borderClass: 'border-success/50',
    iconColor: 'text-success'
  },
  appointment_no_show: { 
    icon: UserX, 
    label: 'No Show', 
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/50',
    iconColor: 'text-destructive'
  },
};

function getContextDetails(entry: HistoryEntry): { label: string; value: string }[] {
  const details: { label: string; value: string }[] = [];
  
  if (entry.callback_date) {
    details.push({
      label: 'Callback',
      value: format(new Date(entry.callback_date), 'do MMM yyyy, HH:mm')
    });
  }
  
  if (entry.appointment_date) {
    details.push({
      label: 'Appointment',
      value: format(new Date(entry.appointment_date), 'do MMM yyyy, HH:mm')
    });
  }
  
  if (entry.reason) {
    details.push({
      label: 'Reason',
      value: entry.reason.replace(/_/g, ' ')
    });
  }
  
  return details;
}

function HistoryCard({ 
  entry, 
  onClick 
}: { 
  entry: HistoryEntry; 
  onClick: () => void;
}) {
  const config = ACTION_CONFIG[entry.action_type] || ACTION_CONFIG.note;
  const Icon = config.icon;
  const date = format(new Date(entry.action_timestamp), 'do MMM');
  const time = format(new Date(entry.action_timestamp), 'h:mma').toLowerCase();
  const contextDetails = getContextDetails(entry);
  const contextText = entry.note || contextDetails[0]?.value || '';

  return (
    <div 
      className={`flex-shrink-0 px-2 py-1.5 rounded-md border ${config.bgClass} ${config.borderClass} w-[110px] cursor-pointer hover:scale-105 transition-transform`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${config.iconColor}`} />
        <p className="text-[11px] font-medium text-foreground truncate">
          {date} {time}
        </p>
      </div>
      {contextText && (
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
          {contextText}
        </p>
      )}
    </div>
  );
}

function HistoryDetailDialog({ 
  entry, 
  open, 
  onOpenChange,
  onDelete 
}: { 
  entry: HistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (!entry) return null;
  
  const config = ACTION_CONFIG[entry.action_type] || ACTION_CONFIG.note;
  const Icon = config.icon;
  const contextDetails = getContextDetails(entry);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgClass}`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <span>{config.label}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Timestamp */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Date & Time</p>
            <p className="text-sm font-medium">
              {format(new Date(entry.action_timestamp), 'EEEE, do MMMM yyyy')}
            </p>
            <p className="text-sm font-medium">
              {format(new Date(entry.action_timestamp), 'h:mm a')}
            </p>
          </div>
          
          {/* Context Details */}
          {contextDetails.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              {contextDetails.map((detail, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{detail.label}</p>
                  <p className="text-sm font-medium capitalize">{detail.value}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Notes */}
          {entry.note && (
            <div className="space-y-1 pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{entry.note}</p>
            </div>
          )}
          
          {/* Delete Button */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                onDelete(entry.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Entry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ContactHistoryBar({ contactId, onHistoryChange }: ContactHistoryBarProps) {
  const { history, isLoading, deleteHistoryEntry } = useContactHistory(contactId);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCardClick = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteHistoryEntry(id);
    onHistoryChange?.();
  };

  if (isLoading) {
    return (
      <div className="p-2 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">History</span>
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-3 py-1.5 border-b border-border bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            History ({history.length})
          </span>
        </div>
        <ScrollArea className="w-full">
          <div className="flex gap-2 p-2">
            {history.map((entry) => (
              <HistoryCard 
                key={entry.id} 
                entry={entry} 
                onClick={() => handleCardClick(entry)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      <HistoryDetailDialog
        entry={selectedEntry}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDelete={handleDelete}
      />
    </>
  );
}
