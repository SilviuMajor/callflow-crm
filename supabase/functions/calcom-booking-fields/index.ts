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
    const { eventSlug } = await req.json();
    
    if (!eventSlug) {
      return new Response(
        JSON.stringify({ error: 'Event slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the slug to get username and event name
    // Format: "username/event-name" or "team/team-name/event-name"
    const slugParts = eventSlug.split('/');
    if (slugParts.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Invalid event slug format. Expected "username/event-name"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const username = slugParts[0];
    const eventName = slugParts[slugParts.length - 1];

    // Use Cal.com's public API to get event type details
    // This endpoint doesn't require authentication for public event types
    const calApiUrl = `https://cal.com/api/trpc/public/event?input=${encodeURIComponent(JSON.stringify({ username, eventSlug: eventName }))}`;
    
    console.log('Fetching Cal.com event from:', calApiUrl);
    
    const response = await fetch(calApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Cal.com API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch event details from Cal.com' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Cal.com response:', JSON.stringify(data).slice(0, 500));

    // Extract booking fields from the response
    const eventData = data?.result?.data;
    if (!eventData) {
      return new Response(
        JSON.stringify({ error: 'Event not found or not public', fields: [] }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cal.com stores booking fields in bookingFields array
    const bookingFields: BookingField[] = [];
    
    // Add standard fields that are always available
    bookingFields.push(
      { slug: 'name', label: 'Name', type: 'text' },
      { slug: 'email', label: 'Email', type: 'email' },
    );

    // Check for phone location type
    if (eventData.locations?.some((loc: any) => loc.type === 'phone' || loc.type === 'attendeePhoneNumber')) {
      bookingFields.push({ slug: 'location', label: 'Phone Number (Location)', type: 'phone' });
    }

    // Extract custom booking fields
    if (eventData.bookingFields && Array.isArray(eventData.bookingFields)) {
      for (const field of eventData.bookingFields) {
        if (field.name && field.label && !['name', 'email', 'guests', 'rescheduleReason'].includes(field.name)) {
          bookingFields.push({
            slug: field.name,
            label: field.label || field.name,
            type: field.type || 'text',
          });
        }
      }
    }

    // Also check for legacy customInputs
    if (eventData.customInputs && Array.isArray(eventData.customInputs)) {
      for (const input of eventData.customInputs) {
        if (input.id && input.label) {
          bookingFields.push({
            slug: `customInput:${input.id}`,
            label: input.label,
            type: input.type || 'text',
          });
        }
      }
    }

    // Always add notes field
    bookingFields.push({ slug: 'notes', label: 'Additional Notes', type: 'textarea' });

    return new Response(
      JSON.stringify({ 
        fields: bookingFields,
        eventName: eventData.title || eventName,
        locations: eventData.locations || [],
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
