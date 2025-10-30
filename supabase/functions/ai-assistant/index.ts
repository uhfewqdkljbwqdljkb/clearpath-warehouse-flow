import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { messages, conversationId, context } = await req.json();

    // Fetch user profile and company info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', user.id)
      .single();

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = userRoles?.some((r: any) => r.role === 'admin');

    // Build system prompt based on role
    let systemPrompt = '';
    if (isAdmin) {
      const { data: stats } = await supabase.rpc('get_warehouse_stats').single();
      
      systemPrompt = `You are Clearpath AI, an intelligent warehouse management assistant for administrators.

You have full access to:
- All warehouse data: zones, rows, inventory, products, orders
- All client information and their allocations
- System-wide analytics and performance metrics

Your capabilities:
- Analyze inventory levels and suggest reordering
- Optimize warehouse space allocation
- Identify inefficiencies in order fulfillment
- Generate business insights and reports
- Answer questions about any aspect of the system

Current context:
- User: ${profile?.full_name || user.email} (Admin)
- Current date: ${new Date().toISOString().split('T')[0]}

When suggesting data modifications:
1. Explain the reasoning
2. Show the proposed changes
3. Note that changes require approval in the system

Be concise, data-driven, and actionable.`;
    } else {
      const company = profile?.companies;
      const { count: productCount } = await supabase
        .from('client_products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company?.id);

      systemPrompt = `You are Clearpath AI, your personal warehouse management assistant.

You have access to:
- Your company's inventory and products
- Your order history and status
- Your warehouse allocation details
- Your performance analytics

Your capabilities:
- Track your inventory levels
- Analyze your order patterns
- Suggest optimal stock levels
- Help manage your product catalog
- Answer questions about your warehouse operations

Current context:
- Company: ${company?.name || 'N/A'}
- Client code: ${company?.client_code || 'N/A'}
- Active products: ${productCount || 0}
- Current date: ${new Date().toISOString().split('T')[0]}

You can only access and modify data belonging to your company.

Be helpful, clear, and focused on ${company?.name}'s needs.`;
    }

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient Balance',
            message: 'Your DeepSeek account needs to be topped up. Please add credits at https://platform.deepseek.com'
          }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    // Stream response back to client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});