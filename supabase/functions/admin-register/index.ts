import { createClient } from 'npm:@supabase/supabase-js@2.97.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ADMIN_SECRET_KEY = 'ADMIN_2024_SECRET_KEY';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, fullName, fiscalCode, userCode, adminKey } = await req.json();

    // Verify admin key
    if (adminKey !== ADMIN_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Chiave admin non valida' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if nickname already exists
    const { data: existingCode } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('nickname', userCode)
      .maybeSingle();

    if (existingCode) {
      return new Response(
        JSON.stringify({ error: 'Codice utente già in uso, scegline un altro' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create user in auth
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (signUpError) {
      console.error('SignUp error:', signUpError);
      return new Response(
        JSON.stringify({ error: signUpError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Errore durante la creazione dell\'account' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create profile directly (bypassing RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        fiscal_code: fiscalCode.toUpperCase(),
        nickname: userCode,
        user_type: 'admin',
        subscription_status: 'active',
        is_admin: true,
      });

    if (profileError) {
      console.error('Profile error:', profileError);

      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return new Response(
        JSON.stringify({ error: `Errore nella creazione del profilo: ${profileError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Add to admins table
    const { error: adminError } = await supabaseAdmin
      .from('admins')
      .insert({
        user_id: authData.user.id,
      });

    if (adminError) {
      console.error('Admin error:', adminError);
      // Don't fail completely, just log it
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account admin creato con successo',
        userId: authData.user.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Errore interno del server' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
