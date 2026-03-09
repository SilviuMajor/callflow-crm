import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, fullName, bootstrapSecret } = await req.json()

    // Validate bootstrap secret
    const expectedSecret = 'BOOTSTRAP_ADMIN_8F42B1C3'
    if (bootstrapSecret !== expectedSecret) {
      console.error('Invalid bootstrap secret provided')
      return new Response(
        JSON.stringify({ error: 'Invalid bootstrap secret' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating admin user for email: ${email}`)

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const defaultOrgId = '00000000-0000-0000-0000-000000000001'

    // Verify the Default Organization exists
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', defaultOrgId)
      .single()

    if (orgError || !orgData) {
      console.error('Default Organization not found:', orgError)
      return new Response(
        JSON.stringify({ error: 'Default Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found organization: ${orgData.name}`)

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      console.log('User already exists, linking to organization...')
      
      // Check if profile already exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', existingUser.id)
        .single()

      if (!existingProfile) {
        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: existingUser.id,
            organization_id: defaultOrgId,
            full_name: fullName || null,
            email: email,
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }

      // Check if admin role exists
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('role', 'admin')
        .single()

      if (!existingRole) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: existingUser.id,
            role: 'admin',
          })

        if (roleError) {
          console.error('Error creating role:', roleError)
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Existing user linked to Default Organization as admin',
          userId: existingUser.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new auth user with email confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        organization_id: defaultOrgId,
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Auth user created: ${authData.user.id}`)

    // Create profile linked to Default Organization
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        organization_id: defaultOrgId,
        full_name: fullName || null,
        email: email,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Profile created successfully')

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin',
      })

    if (roleError) {
      console.error('Error creating admin role:', roleError)
      return new Response(
        JSON.stringify({ error: `Failed to assign admin role: ${roleError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin role assigned successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created and linked to Default Organization',
        userId: authData.user.id,
        organizationId: defaultOrgId,
        organizationName: orgData.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${(error as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
