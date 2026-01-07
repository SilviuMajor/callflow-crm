import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Contact } from '@/types/contact';

interface CalcomEmbedProps {
  contact: Contact;
  eventTypeSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventScheduled: () => void;
}

export function CalcomEmbed({ 
  contact,
  eventTypeSlug, 
  open,
  onOpenChange,
  onEventScheduled 
}: CalcomEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    
    // Clean up any existing embeds
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Build prefill data from contact
    const name = `${contact.firstName} ${contact.lastName}`.trim();
    const email = contact.email || '';
    const phone = contact.phone || '';
    const company = contact.company || '';
    
    // Build notes with company and phone info
    const notes = [
      company && `Company: ${company}`,
      phone && `Phone: ${phone}`,
    ].filter(Boolean).join('\n');

    // Build the Cal.com embed URL
    // Handle both full URLs and just slugs
    const baseUrl = eventTypeSlug.startsWith('http') 
      ? eventTypeSlug 
      : `https://cal.com/${eventTypeSlug}`;
    
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (email) params.set('email', email);
    if (notes) params.set('notes', notes);
    
    const embedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.setAttribute('loading', 'lazy');

    if (containerRef.current) {
      containerRef.current.appendChild(iframe);
    }

    // Listen for booking completed message
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('cal.com')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'booking-successful' || data.type === 'booking_successful' || 
            data.event === 'booking-successful' || data.event === 'bookingSuccessful') {
          onEventScheduled();
        }
      } catch {
        // Ignore parse errors
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [open, eventTypeSlug, contact, onEventScheduled]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Book Appointment with {contact.firstName} {contact.lastName}</DialogTitle>
        </DialogHeader>
        <div ref={containerRef} className="flex-1 overflow-hidden h-full min-h-[600px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
