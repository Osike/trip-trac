import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { name, phone, role, email } = await req.json()

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
    
    // Use provided email or generate a unique one from name with timestamp
    const userEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@temp.logistics.com`

    console.log('Creating user with email:', userEmail)

    // Create the auth user with admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: role
      }
    })

    if (userError) {
      console.error('User creation error:', userError)
      
      // Handle specific error cases
      if (userError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ 
            error: 'A user with this email already exists. Please use a different email address.' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
      
      throw userError
    }

    // Update the profile with phone number
    if (phone && userData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ phone: phone })
        .eq('user_id', userData.user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        temporaryPassword: tempPassword,
        email: userEmail
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
