import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateClientData {
  fullName: string;
  email: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin using has_role function
    const { data: isAdminData, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'ADMIN'
    });

    if (roleError || !isAdminData) {
      throw new Error('Unauthorized - Admin access required');
    }

    const { fullName, email, password }: CreateClientData = await req.json();

    // Validate input
    if (!fullName || !email || !password) {
      throw new Error('All fields are required: fullName, email, password');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    console.log(`Creating client: ${fullName} (${email})`);

    // Create user in auth.users using admin client
    // The handle_new_user trigger will automatically:
    // 1. Create profile in profiles table
    // 2. Create CLIENTE role in user_roles table
    const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        role: 'CLIENTE' // Used by handle_new_user trigger
      },
      email_confirm: true // Auto-confirm email for admin-created users
    });

    if (createUserError) {
      console.error('Error creating user in auth:', createUserError);
      throw new Error(`Failed to create user: ${createUserError.message}`);
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log(`Created user with ID: ${newUser.user.id}`);

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify that profile and role were created by trigger
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', newUser.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found after user creation:', profileError);
      // Rollback: delete the auth user
      await supabaseClient.auth.admin.deleteUser(newUser.user.id);
      throw new Error('Failed to create user profile via trigger');
    }

    console.log(`Successfully verified client profile for: ${email}`);

    // Verify role was created
    const { data: roleData, error: roleCheckError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', newUser.user.id)
      .eq('role', 'CLIENTE')
      .single();

    if (roleCheckError || !roleData) {
      console.error('Role not found after user creation:', roleCheckError);
      // Rollback: delete the auth user (profile will cascade)
      await supabaseClient.auth.admin.deleteUser(newUser.user.id);
      throw new Error('Failed to create CLIENTE role via trigger');
    }

    console.log(`Successfully verified CLIENTE role for: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUser.user.id,
        email: email,
        full_name: fullName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Create client error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
