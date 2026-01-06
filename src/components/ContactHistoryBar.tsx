import { useEffect } from 'react';
import { useContactHistory, HistoryEntry } from '@/hooks/useContactHistory';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Phone, PhoneOff, Clock, CheckCircle2, XCircle, StickyNote, Trash2, RotateCcw, CalendarPlus, UserCheck, UserX, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContactHistoryBarProps {
  contactId: string;
  onHistoryChange?: () => void;
}

const ACTION_CONFIG: Record<string, { icon: typeof Phone; label: string; bgClass: string; borderClass: string }> = {
  no_answer: { 
    icon: PhoneOff, 
    label: 'No Answer', 
    bgClass: 'bg-muted/50',
    borderClass: 'border-muted-foreground/20'
  },
  callback: { 
    icon: Clock, 
    label: 'Callback', 
    bgClass: 'bg-[hsl(var(--callback-light))]',
    borderClass: 'border-[hsl(var(--callback))]'
  },
  completed: { 
    icon: CheckCircle2, 
    label: 'Completed', 
    bgClass: 'bg-success/10',
    borderClass: 'border-success'
  },
  not_interested: { 
    icon: XCircle, 
    label: 'Not Interested', 
    bgClass: 'bg-muted/50',
    borderClass: 'border-muted-foreground/30'
  },
  note: { 
    icon: StickyNote, 
    label: 'Note', 
    bgClass: 'bg-info/10',
    borderClass: 'border-info/30'
  },
  returned_to_pot: { 
    icon: RotateCcw, 
    label: 'Returned to Pot', 
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30'
  },
  rebooked: { 
    icon: CalendarPlus, 
    label: 'Rebooked', 
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30'
  },
  rescheduled: { 
    icon: CalendarClock, 
    label: 'Rescheduled', 
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30'
  },
  appointment_attended: { 
    icon: UserCheck, 
    label: 'Attended', 
    bgClass: 'bg-success/10',
    borderClass: 'border-success'
  },
  appointment_no_show: { 
    icon: UserX, 
    label: 'No Show', 
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive'
  },
};

function formatHistoryEntry(entry: HistoryEntry): string {
  const time = format(new Date(entry.action_timestamp), 'h:mm a');
  const date = format(new Date(entry.action_timestamp), 'do MMM');
  
  switch (entry.action_type) {
    case 'no_answer':
      return `No answer at ${time} on ${date}`;
    case 'callback':
      if (entry.callback_date) {
        const cbTime = format(new Date(entry.callback_date), 'HH:mm');
        const cbDate = format(new Date(entry.callback_date), 'do MMM');
        return `Callback set for ${cbTime} on ${cbDate}`;
      }
      return `Callback scheduled on ${date}`;
    case 'completed':
      if (entry.appointment_date) {
        const aptDate = format(new Date(entry.appointment_date), 'do MMM HH:mm');
        return `Completed - Appt: ${aptDate}`;
      }
      return `Completed${entry.reason ? ` (${entry.reason.replace(/_/g, ' ')})` : ''} on ${date}`;
    case 'not_interested':
      return `Not Interested${entry.reason ? ` - ${entry.reason.replace(/_/g, ' ')}` : ''} on ${date}`;
    case 'note':
      return `Note added on ${date}`;
    case 'returned_to_pot':
      if (entry.callback_date) {
        const cbDate = format(new Date(entry.callback_date), 'do MMM HH:mm');
        return `Returned to pot - Callback: ${cbDate}`;
      }
      return `Returned to pending queue on ${date}`;
    case 'rebooked':
      if (entry.appointment_date) {
        const aptDate = format(new Date(entry.appointment_date), 'do MMM HH:mm');
        return `Rebooked for ${aptDate}`;
      }
      return `Rebooked on ${date}`;
    case 'rescheduled':
      if (entry.appointment_date) {
        const aptDate = format(new Date(entry.appointment_date), 'do MMM HH:mm');
        return `Rescheduled to ${aptDate}`;
      }
      return `Rescheduled on ${date}`;
    case 'appointment_attended':
      return `Appointment attended on ${date}`;
    case 'appointment_no_show':
      return `No show on ${date}`;
    default:
      return `Action on ${date}`;
  }
}

function HistoryCard({ entry, onDelete }: { entry: HistoryEntry; onDelete: (id: string) => void }) {
  const config = ACTION_CONFIG[entry.action_type] || ACTION_CONFIG.note;
  const Icon = config.icon;
  const description = formatHistoryEntry(entry);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex-shrink-0 p-2 rounded-lg border ${config.bgClass} ${config.borderClass} min-w-[180px] max-w-[220px] group relative`}
          >
            <div className="flex items-start gap-2">
              <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground leading-tight">
                  {description}
                </p>
                {entry.note && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-background border border-border shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        </TooltipTrigger>
        {entry.note && (
          <TooltipContent side="bottom" className="max-w-[300px]">
            <p className="text-sm whitespace-pre-wrap">{entry.note}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function ContactHistoryBar({ contactId, onHistoryChange }: ContactHistoryBarProps) {
  const { history, isLoading, deleteHistoryEntry } = useContactHistory(contactId);

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
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          History ({history.length})
        </span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-2 p-2">
          {history.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} onDelete={handleDelete} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
