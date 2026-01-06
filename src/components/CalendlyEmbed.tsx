import { useEffect } from 'react';
import { InlineWidget, useCalendlyEventListener } from 'react-calendly';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Contact } from '@/types/contact';

interface CalendlyEmbedProps {
  contact: Contact;
  calendlyUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventScheduled: (eventUri: string, startTime: string) => void;
}

export function CalendlyEmbed({ 
  contact, 
  calendlyUrl, 
  open, 
  onOpenChange, 
  onEventScheduled 
}: CalendlyEmbedProps) {
  
  useCalendlyEventListener({
    onEventScheduled: (e) => {
      const eventUri = e.data.payload.event?.uri || '';
      // The start_time comes from invitee payload, not event
      const invitee = e.data.payload.invitee as { uri?: string } | undefined;
      // Pass empty string for startTime - we'll use manual fallback or webhook
      onEventScheduled(eventUri, '');
    },
  });

  // Build prefill data from contact
  const prefill = {
    name: `${contact.firstName} ${contact.lastName}`.trim(),
    email: contact.email || '',
    customAnswers: {
      a1: contact.company || '',
      a2: contact.phone || '',
    },
  };

  // Build the URL with prefill parameters
  const buildCalendlyUrlWithPrefill = () => {
    const url = new URL(calendlyUrl);
    if (prefill.name) url.searchParams.set('name', prefill.name);
    if (prefill.email) url.searchParams.set('email', prefill.email);
    if (prefill.customAnswers.a1) url.searchParams.set('a1', prefill.customAnswers.a1);
    if (prefill.customAnswers.a2) url.searchParams.set('a2', prefill.customAnswers.a2);
    return url.toString();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Book Appointment with {contact.firstName} {contact.lastName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden h-full">
          <InlineWidget
            url={buildCalendlyUrlWithPrefill()}
            styles={{ height: 'calc(80vh - 60px)', width: '100%' }}
            prefill={prefill}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
