import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingField {
  slug: string;
  label: string;
  type: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventSlug, apiKey } = await req.json();
    
    if (!eventSlug) {
      return new Response(
        JSON.stringify({ error: 'Event slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required to fetch booking fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the event slug - handle full URLs or just the slug
    let cleanSlug = eventSlug.trim();
    
    // Strip protocol and domain if full URL provided
    if (cleanSlug.startsWith('https://cal.com/')) {
      cleanSlug = cleanSlug.replace('https://cal.com/', '');
    } else if (cleanSlug.startsWith('http://cal.com/')) {
      cleanSlug = cleanSlug.replace('http://cal.com/', '');
    } else if (cleanSlug.startsWith('cal.com/')) {
      cleanSlug = cleanSlug.replace('cal.com/', '');
    }
    
    // Remove any trailing slashes
    cleanSlug = cleanSlug.replace(/\/$/, '');

    // Parse the slug to get the event name
    // Format: "username/event-name" or "team/team-name/event-name"
    const slugParts = cleanSlug.split('/');
    if (slugParts.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Invalid event slug format. Expected "username/event-name"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventName = slugParts[slugParts.length - 1];
    console.log('Looking for event:', eventName, 'from slug:', cleanSlug);

    // Use Cal.com API v2 to get all event types
    const calApiUrl = 'https://api.cal.com/v2/event-types';
    
    console.log('Fetching Cal.com event types with API v2');
    
    const response = await fetch(calApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'cal-api-version': '2024-06-14',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cal.com API error:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key. Please check your Cal.com API key.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch event types from Cal.com' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Cal.com response status:', data?.status);

    // Find the matching event type by slug
    const eventTypes = data?.data || [];
    console.log('Found event types:', eventTypes.length);
    
    const matchingEvent = eventTypes.find(
      (et: any) => et.slug === eventName || et.slug === cleanSlug
    );

    if (!matchingEvent) {
      console.log('Available event slugs:', eventTypes.map((et: any) => et.slug));
      return new Response(
        JSON.stringify({ 
          error: `Event "${eventName}" not found. Available events: ${eventTypes.map((et: any) => et.slug).join(', ')}`,
          fields: [] 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found matching event:', matchingEvent.title, 'with bookingFields:', matchingEvent.bookingFields?.length || 0);

    // Extract booking fields from the response
    const bookingFields: BookingField[] = [];
    
    // Add standard fields that are always available
    bookingFields.push(
      { slug: 'name', label: 'Name', type: 'name' },
      { slug: 'email', label: 'Email', type: 'email' },
    );

    // Check for phone location type
    if (matchingEvent.locations?.some((loc: any) => 
      loc.type === 'phone' || 
      loc.type === 'attendeePhoneNumber' ||
      loc.type === 'userPhone'
    )) {
      bookingFields.push({ slug: 'location', label: 'Phone Number (Location)', type: 'phone' });
    }

    // Extract custom booking fields from the API response
    if (matchingEvent.bookingFields && Array.isArray(matchingEvent.bookingFields)) {
      for (const field of matchingEvent.bookingFields) {
        // Skip standard fields we already added
        if (['name', 'email', 'guests', 'rescheduleReason'].includes(field.slug)) {
          continue;
        }
        
        bookingFields.push({
          slug: field.slug,
          label: field.label || field.slug,
          type: field.type || 'text',
        });
      }
    }

    // Always add notes field
    if (!bookingFields.some(f => f.slug === 'notes')) {
      bookingFields.push({ slug: 'notes', label: 'Additional Notes', type: 'textarea' });
    }

    console.log('Returning fields:', bookingFields.length);

    return new Response(
      JSON.stringify({ 
        fields: bookingFields,
        eventName: matchingEvent.title || eventName,
        eventId: matchingEvent.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Cal.com booking fields:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
