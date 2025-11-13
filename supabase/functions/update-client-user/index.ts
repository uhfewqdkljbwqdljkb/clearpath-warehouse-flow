import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the request has a valid JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      throw new Error('Invalid token');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { user_id, new_email, new_password } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!new_email && !new_password) {
      return new Response(
        JSON.stringify({ error: 'At least one of new_email or new_password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Updating user ${user_id}`, { email: new_email ? 'yes' : 'no', password: new_password ? 'yes' : 'no' });

    // Check if new email is already in use by another user
    if (new_email) {
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', new_email)
        .neq('id', user_id)
        .maybeSingle();

      if (profileCheckError) {
        console.error('Error checking for duplicate email:', profileCheckError);
      } else if (existingProfile) {
        return new Response(
          JSON.stringify({ error: 'This email is already in use by another account' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare update data
    const updateData: { email?: string; password?: string } = {};
    if (new_email) updateData.email = new_email;
    if (new_password) updateData.password = new_password;

    // Update user in Auth
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      updateData
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
      return new Response(
        JSON.stringify({ error: `Failed to update user: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile email if email was changed
    if (new_email) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ email: new_email })
        .eq('id', user_id);

      if (profileUpdateError) {
        console.error('Error updating profile email:', profileUpdateError);
        return new Response(
          JSON.stringify({ error: `User updated but profile email update failed: ${profileUpdateError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const changes = [];
    if (new_email) changes.push('email');
    if (new_password) changes.push('password');

    console.log(`Successfully updated user ${user_id}:`, changes.join(', '));

    return new Response(
      JSON.stringify({ 
        message: `Portal user ${changes.join(' and ')} updated successfully`,
        user_id: updatedUser.user.id,
        email: updatedUser.user.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-client-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
