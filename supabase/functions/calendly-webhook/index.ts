import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-calendly-webhook-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    console.log('Calendly webhook received:', JSON.stringify(body, null, 2));

    const event = body.event;
    const payload = body.payload;

    // Only handle invitee.created events
    if (event !== 'invitee.created') {
      console.log('Ignoring event type:', event);
      return new Response(JSON.stringify({ message: 'Event type ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract invitee info
    const inviteeEmail = payload?.invitee?.email?.toLowerCase();
    const scheduledEventUri = payload?.scheduled_event?.uri;
    const startTime = payload?.scheduled_event?.start_time;
    const eventName = payload?.scheduled_event?.name;

    console.log('Processing booking:', { inviteeEmail, startTime, eventName });

    if (!inviteeEmail || !startTime) {
      console.error('Missing required fields:', { inviteeEmail, startTime });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find contact by email (case-insensitive)
    const { data: contacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name')
      .ilike('email', inviteeEmail)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching contact:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!contacts || contacts.length === 0) {
      console.log('No contact found with email:', inviteeEmail);
      return new Response(JSON.stringify({ message: 'No matching contact found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contact = contacts[0];
    console.log('Found contact:', contact.id, contact.first_name, contact.last_name);

    // Update contact with appointment date
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        appointment_date: startTime,
        status: 'completed',
        completed_reason: 'appointment_booked',
      })
      .eq('id', contact.id);

    if (updateError) {
      console.error('Error updating contact:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update contact' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add history entry
    await supabase
      .from('contact_history')
      .insert({
        contact_id: contact.id,
        action_type: 'completed',
        reason: 'appointment_booked',
        appointment_date: startTime,
        note: `Appointment booked via Calendly: ${eventName || 'Meeting'}`,
      });

    console.log('Successfully updated contact:', contact.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Contact updated with appointment',
      contactId: contact.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
