import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Contact } from '@/types/contact';
import { CalcomFieldMappings } from '@/hooks/useCalcomSettings';

interface CalcomEmbedProps {
  contact: Contact;
  eventTypeSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventScheduled: () => void;
  fieldMappings?: CalcomFieldMappings;
}

export function CalcomEmbed({ 
  contact,
  eventTypeSlug, 
  open,
  onOpenChange,
  onEventScheduled,
  fieldMappings = {},
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
    const jobTitle = contact.jobTitle || '';
    
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
    
    // Standard prefill fields
    if (name) params.set('name', name);
    if (email) params.set('email', email);
    
    // Build notes with unmapped fields
    const notesFields: string[] = [];
    
    // Apply field mappings for custom Cal.com booking questions
    // If a field has a mapping, use the mapped identifier instead of putting it in notes
    if (phone) {
      if (fieldMappings.phone) {
        // Check if it's a location-based phone field
        if (fieldMappings.phone === 'location') {
          params.set('location', JSON.stringify({ value: 'phone', optionValue: phone }));
        } else {
          params.set(fieldMappings.phone, phone);
        }
      } else {
        notesFields.push(`Phone: ${phone}`);
      }
    }
    
    if (company) {
      if (fieldMappings.company) {
        params.set(fieldMappings.company, company);
      } else {
        notesFields.push(`Company: ${company}`);
      }
    }
    
    if (jobTitle) {
      if (fieldMappings.jobTitle) {
        params.set(fieldMappings.jobTitle, jobTitle);
      } else {
        notesFields.push(`Job Title: ${jobTitle}`);
      }
    }
    
    // Add any custom field mappings
    Object.entries(fieldMappings).forEach(([contactField, calcomField]) => {
      if (!['phone', 'company', 'jobTitle'].includes(contactField) && calcomField) {
        // Try to get custom field value from contact
        const customValue = contact.customFields?.[contactField];
        if (customValue) {
          params.set(calcomField, String(customValue));
        }
      }
    });
    
    // Set notes if we have any unmapped fields
    if (notesFields.length > 0) {
      params.set('notes', notesFields.join('\n'));
    }
    
    // Add embed=true for proper embed mode
    params.set('embed', 'true');
    params.set('theme', 'light');
    params.set('hideEventTypeDetails', 'false');
    
    const embedUrl = `${baseUrl}?${params.toString()}`;
    
    console.log('[CalcomEmbed] Loading embed URL:', embedUrl);
    console.log('[CalcomEmbed] Field mappings:', fieldMappings);

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
  }, [open, eventTypeSlug, contact, onEventScheduled, fieldMappings]);

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
