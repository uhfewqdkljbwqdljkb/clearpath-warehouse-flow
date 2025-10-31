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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    // Define tools for database queries
    const tools = isAdmin ? [
      {
        type: "function",
        function: {
          name: "get_client_count",
          description: "Get the total number of active clients/companies in the warehouse system",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_warehouse_stats",
          description: "Get comprehensive warehouse statistics including zones, rows, inventory, and orders",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_recent_orders",
          description: "Get recent orders with optional filtering",
          parameters: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of orders to retrieve (default 10)"
              }
            }
          }
        }
      }
    ] : [
      {
        type: "function",
        function: {
          name: "get_company_stats",
          description: "Get statistics for the current user's company including products, inventory, and orders",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ];

    // Build system prompt based on role
    let systemPrompt = '';
    if (isAdmin) {
      systemPrompt = `You are Clearpath AI, an intelligent warehouse management assistant for administrators.

You have tools to access real-time warehouse data:
- Client counts and information
- Warehouse statistics (zones, rows, inventory, orders)
- Recent order activity

Your capabilities:
- Use tools to fetch accurate, real-time data from the database
- Analyze inventory levels and suggest reordering
- Optimize warehouse space allocation
- Identify inefficiencies in order fulfillment
- Generate business insights and reports

Current context:
- User: ${profile?.full_name || user.email} (Admin)
- Current date: ${new Date().toISOString().split('T')[0]}

IMPORTANT: Always use the provided tools to get accurate data. Never guess or make up numbers.

Be concise, data-driven, and actionable.`;
    } else {
      const company = profile?.companies;

      systemPrompt = `You are Clearpath AI, your personal warehouse management assistant.

You have tools to access your company's data:
- Product catalog and inventory
- Order history and status
- Warehouse allocation details

Your capabilities:
- Use tools to fetch real-time data about your operations
- Track your inventory levels
- Analyze your order patterns
- Suggest optimal stock levels
- Help manage your product catalog

Current context:
- Company: ${company?.name || 'N/A'}
- Client code: ${company?.client_code || 'N/A'}
- Current date: ${new Date().toISOString().split('T')[0]}

IMPORTANT: Always use the provided tools to get accurate data. You can only access data belonging to ${company?.name}.

Be helpful, clear, and focused on ${company?.name}'s needs.`;
    }

    // Handle tool execution
    const executeTools = async (toolCalls: any[]) => {
      const results = [];
      for (const toolCall of toolCalls) {
        const { name, arguments: args } = toolCall.function;
        let result;

        try {
          switch (name) {
            case 'get_client_count': {
              const { count } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
              result = { active_clients: count || 0 };
              break;
            }
            case 'get_warehouse_stats': {
              const [zones, rows, products, orders] = await Promise.all([
                supabase.from('warehouse_zones').select('*', { count: 'exact', head: true }),
                supabase.from('warehouse_rows').select('*', { count: 'exact', head: true }),
                supabase.from('client_products').select('*', { count: 'exact', head: true }),
                supabase.from('client_orders').select('*', { count: 'exact', head: true })
              ]);
              result = {
                total_zones: zones.count || 0,
                total_rows: rows.count || 0,
                total_products: products.count || 0,
                total_orders: orders.count || 0
              };
              break;
            }
            case 'get_recent_orders': {
              const limit = JSON.parse(args || '{}').limit || 10;
              const { data } = await supabase
                .from('client_orders')
                .select('order_number, status, total_items, created_at')
                .order('created_at', { ascending: false })
                .limit(limit);
              result = { orders: data };
              break;
            }
            case 'get_company_stats': {
              const companyId = profile?.companies?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }
              const [products, inventory, orders] = await Promise.all([
                supabase.from('client_products').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
                supabase.from('inventory_items').select('quantity').eq('company_id', companyId),
                supabase.from('client_orders').select('*', { count: 'exact', head: true }).eq('company_id', companyId)
              ]);
              const totalInventory = inventory.data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
              result = {
                total_products: products.count || 0,
                total_inventory_units: totalInventory,
                total_orders: orders.count || 0
              };
              break;
            }
            default:
              result = { error: 'Unknown tool' };
          }
        } catch (error) {
          console.error(`Tool execution error for ${name}:`, error);
          result = { error: error instanceof Error ? error.message : 'Tool execution failed' };
        }

        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: name,
          content: JSON.stringify(result)
        });
      }
      return results;
    };

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: tools,
        stream: false,
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Payment Required',
            message: 'Please add credits to your Lovable AI workspace'
          }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate Limit Exceeded',
            message: 'Too many requests. Please try again later.'
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if AI wants to use tools
    if (data.choices[0].message.tool_calls) {
      const toolResults = await executeTools(data.choices[0].message.tool_calls);
      
      // Call AI again with tool results
      const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            data.choices[0].message,
            ...toolResults
          ],
          stream: true,
          temperature: 0.7
        }),
      });

      return new Response(finalResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // No tools needed, stream the response
    const streamResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
        temperature: 0.7
      }),
    });

    return new Response(streamResponse.body, {
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