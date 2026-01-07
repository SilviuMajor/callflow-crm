import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface CalcomEmbedProps {
  eventTypeSlug: string;
  prefill?: {
    name?: string;
    email?: string;
    notes?: string;
  };
  onEventScheduled?: () => void;
}

export function CalcomEmbed({ eventTypeSlug, prefill, onEventScheduled }: CalcomEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Clean up any existing embeds
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Build the Cal.com embed URL
    const baseUrl = `https://cal.com/${eventTypeSlug}`;
    const params = new URLSearchParams();
    
    if (prefill?.name) params.set('name', prefill.name);
    if (prefill?.email) params.set('email', prefill.email);
    if (prefill?.notes) params.set('notes', prefill.notes);
    
    const embedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.setAttribute('loading', 'lazy');

    if (containerRef.current) {
      containerRef.current.appendChild(iframe);
    }

    // Listen for booking completed message
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://cal.com') return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'booking-successful' || data.type === 'booking_successful') {
          onEventScheduled?.();
        }
      } catch {
        // Ignore parse errors
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [eventTypeSlug, prefill, onEventScheduled]);

  return (
    <div ref={containerRef} className="min-h-[600px] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
