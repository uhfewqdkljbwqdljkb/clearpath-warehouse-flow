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
      },
      {
        type: "function",
        function: {
          name: "get_product_inventory",
          description: "Get current inventory quantities for the current company's products, optionally filtered by name or SKU, including variant breakdown where available",
          parameters: {
            type: "object",
            properties: {
              product_name: {
                type: "string",
                description: "Optional product name or partial name to filter by"
              },
              sku: {
                type: "string",
                description: "Optional exact SKU to filter by"
              }
            },
            required: []
          }
        }
      }
    ];

    // Build system prompt based on role
    let systemPrompt = '';
    if (isAdmin) {
      systemPrompt = `You are Clearpath AI, an intelligent business assistant for warehouse administrators.

You are a versatile AI assistant that can help with:
- Business strategy and planning (marketing, growth, operations)
- General business advice and consulting
- Data analysis and insights
- Problem-solving across various business domains
- Creative ideation and brainstorming

You also have access to tools for real-time warehouse data:
- Client counts and information
- Warehouse statistics (zones, rows, inventory, orders)
- Recent order activity

When discussing warehouse-related topics, use the provided tools to fetch accurate, real-time data from the database.

Current context:
- You're assisting: ${profile?.full_name || user.email} (Admin at Clearpath Warehouse Management)
- Current date: ${new Date().toISOString().split('T')[0]}
- Software: Clearpath is a warehouse management system that handles inventory, orders, and client management

Guidelines:
- Feel free to discuss any business topic, not just warehouse management
- When warehouse data is relevant, use the tools to get accurate information
- For marketing, strategy, or general business topics, provide thoughtful advice based on best practices
- Be conversational, insightful, and helpful across all business domains

Your goal is to be a valuable business partner, whether helping with warehouse operations OR broader business strategy.`;
    } else {
      const company = profile?.companies;

      systemPrompt = `You are Clearpath AI, a versatile business assistant for ${company?.name || 'your company'}.
 
You are here to help with:
- Business strategy and growth (marketing, sales, customer acquisition)
- General business advice and planning
- Data analysis and operational insights
- Creative problem-solving
- Industry trends and best practices

You also have access to tools for your warehouse data:
- Product catalog and inventory (including total units per product)
- Order history and status
- Warehouse allocation details

When discussing your warehouse operations, use the provided tools to fetch real-time data.
Use the get_product_inventory tool whenever the user asks about stock levels, units, or quantities for specific products.

Current context:
- Company: ${company?.name || 'N/A'}
- Client code: ${company?.client_code || 'N/A'}
- Current date: ${new Date().toISOString().split('T')[0]}
- Platform: You're using Clearpath, a warehouse management system

Guidelines:
- Discuss any business topic freely - marketing, strategy, operations, etc.
- When warehouse data is needed, use the tools to access ${company?.name}'s information
- When asked about quantities or units of products, call get_product_inventory and base your answer on its results
- Provide strategic advice for business growth and success
- Be conversational, insightful, and supportive

Your goal is to be a complete business partner, helping with both warehouse operations AND broader business challenges like marketing strategy, customer acquisition, and growth planning.`;
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
            case 'get_product_inventory': {
              const companyId = profile?.companies?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }

              let parsedArgs: any = {};
              try {
                parsedArgs = args ? JSON.parse(args) : {};
              } catch {
                parsedArgs = {};
              }

              const { product_name, sku } = parsedArgs;

              let query = supabase
                .from('client_products')
                .select('id, name, sku, variants, inventory_items(quantity)')
                .eq('company_id', companyId);

              if (product_name) {
                query = query.ilike('name', `%${product_name}%`);
              }

              if (sku) {
                query = query.eq('sku', sku);
              }

              const { data, error } = await query;
              if (error) throw error;

              const productsWithInventory = (data || []).map((p: any) => {
                const inventoryTotal = (p.inventory_items || []).reduce(
                  (sum: number, item: any) => sum + (item.quantity || 0),
                  0
                );

                let variantsTotal = 0;
                if (p.variants && Array.isArray(p.variants)) {
                  p.variants.forEach((variant: any) => {
                    variant.values?.forEach((val: any) => {
                      variantsTotal += val.quantity || 0;
                    });
                  });
                }

                const totalQuantity = inventoryTotal || variantsTotal;

                return {
                  id: p.id,
                  name: p.name,
                  sku: p.sku,
                  total_quantity: totalQuantity,
                  inventory_quantity: inventoryTotal,
                  variant_quantity_from_definition: variantsTotal,
                  variants: p.variants || []
                };
              });

              result = { products: productsWithInventory };
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