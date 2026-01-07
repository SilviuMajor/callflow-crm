import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cal-signature',
};

interface CalcomBooking {
  triggerEvent: string;
  createdAt: string;
  payload: {
    type: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    organizer: {
      email: string;
      name: string;
      timeZone: string;
    };
    attendees: Array<{
      email: string;
      name: string;
      timeZone: string;
    }>;
    uid: string;
    metadata?: Record<string, any>;
    responses?: {
      email?: { value: string };
      name?: { value: string };
      notes?: { value: string };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the webhook payload
    const booking: CalcomBooking = await req.json();
    console.log('Cal.com webhook received:', booking.triggerEvent);

    // Only process booking created events
    if (booking.triggerEvent !== 'BOOKING_CREATED') {
      return new Response(JSON.stringify({ message: 'Event type not handled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = booking.payload;
    const attendee = payload.attendees?.[0];
    
    if (!attendee) {
      console.log('No attendee found in booking');
      return new Response(JSON.stringify({ message: 'No attendee in booking' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const attendeeEmail = attendee.email || payload.responses?.email?.value;
    const attendeeName = attendee.name || payload.responses?.name?.value;

    if (!attendeeEmail) {
      console.log('No email found for attendee');
      return new Response(JSON.stringify({ message: 'No email for attendee' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing booking for: ${attendeeName} (${attendeeEmail})`);

    // Find matching contact by email
    const { data: contacts, error: searchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, status')
      .ilike('email', attendeeEmail);

    if (searchError) {
      console.error('Error searching for contact:', searchError);
      throw searchError;
    }

    if (!contacts || contacts.length === 0) {
      console.log(`No contact found with email: ${attendeeEmail}`);
      return new Response(JSON.stringify({ 
        message: 'No matching contact found',
        email: attendeeEmail 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contact = contacts[0];
    const appointmentDate = new Date(payload.startTime);

    console.log(`Updating contact ${contact.id} with appointment at ${appointmentDate}`);

    // Update the contact with appointment details - mark as completed
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        status: 'completed',
        completed_reason: 'appointment_booked',
        appointment_date: appointmentDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contact.id);

    if (updateError) {
      console.error('Error updating contact:', updateError);
      throw updateError;
    }

    // Add to contact history
    const { error: historyError } = await supabase
      .from('contact_history')
      .insert({
        contact_id: contact.id,
        action_type: 'completed',
        reason: 'appointment_booked',
        appointment_date: appointmentDate.toISOString(),
        note: `Booked via Cal.com: ${payload.title}`,
      });

    if (historyError) {
      console.error('Error adding history:', historyError);
    }

    console.log(`Successfully updated contact ${contact.id} with Cal.com booking`);

    return new Response(JSON.stringify({ 
      success: true,
      contactId: contact.id,
      appointmentDate: appointmentDate.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cal.com webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
