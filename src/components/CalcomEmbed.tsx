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
    let baseUrl = eventTypeSlug;
    
    // Clean up the URL - remove any trailing slashes and ensure proper format
    if (!baseUrl.startsWith('http')) {
      // If it's just a slug like "username/event-type", add the base URL
      baseUrl = `https://cal.com/${baseUrl}`;
    }
    
    // Use Cal.com's embed parameter format
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (email) params.set('email', email);
    if (notes) params.set('notes', notes);
    if (phone) params.set('guests', ''); // Clear guests, phone goes in notes
    
    // Add embed=true for proper embed mode
    params.set('embed', 'true');
    params.set('theme', 'light');
    params.set('hideEventTypeDetails', 'false');
    
    const embedUrl = `${baseUrl}?${params.toString()}`;
    
    console.log('[CalcomEmbed] Loading embed URL:', embedUrl);

    // Create iframe with proper embed settings
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.minHeight = '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'payment');

    if (containerRef.current) {
      containerRef.current.appendChild(iframe);
    }

    // Listen for booking completed message from Cal.com
    const handleMessage = (event: MessageEvent) => {
      // Cal.com sends messages from their domain
      if (!event.origin.includes('cal.com')) return;
      
      console.log('[CalcomEmbed] Received message from Cal.com:', event.data);
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Cal.com uses various event formats
        if (
          data.type === 'booking-successful' || 
          data.type === 'booking_successful' ||
          data.type === 'bookingSuccessful' ||
          data.event === 'booking-successful' || 
          data.event === 'bookingSuccessful' ||
          (data.data && data.data.type === 'booking-successful')
        ) {
          console.log('[CalcomEmbed] Booking successful detected!');
          onEventScheduled();
        }
      } catch {
        // Some messages aren't JSON, that's okay
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
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
