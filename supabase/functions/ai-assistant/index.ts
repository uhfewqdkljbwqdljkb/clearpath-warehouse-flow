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

    // Fetch user profile with company info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', user.id)
      .single();

    // If company wasn't joined but profile has company_id, fetch it separately
    let company = profile?.companies;
    if (!company && profile?.company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();
      company = companyData;
    }

    // Check if user is admin (any admin role)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const adminRoles = ['admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator'];
    const isAdmin = userRoles?.some((r: any) => adminRoles.includes(r.role));

    // Define comprehensive tools for database queries and actions
    const tools = isAdmin ? [
      // READ TOOLS - Admin
      {
        type: "function",
        function: {
          name: "get_client_count",
          description: "Get the total number of active clients/companies in the warehouse system",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_all_clients",
          description: "Get list of all clients with their details including name, client code, contact info, and status",
          parameters: {
            type: "object",
            properties: {
              active_only: { type: "boolean", description: "Filter to only active clients (default true)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_warehouse_stats",
          description: "Get comprehensive warehouse statistics including zones, rows, inventory, and orders",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_warehouse_zones",
          description: "Get all warehouse zones with their details",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_warehouse_rows",
          description: "Get warehouse rows, optionally filtered by zone",
          parameters: {
            type: "object",
            properties: {
              zone_id: { type: "string", description: "Optional zone ID to filter by" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_all_check_in_requests",
          description: "Get check-in requests across all clients, optionally filtered by status",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["pending", "approved", "rejected"], description: "Filter by status" },
              limit: { type: "number", description: "Max results to return (default 20)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_all_check_out_requests",
          description: "Get check-out requests across all clients, optionally filtered by status",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["pending", "approved", "rejected"], description: "Filter by status" },
              limit: { type: "number", description: "Max results to return (default 20)" }
            }
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
              limit: { type: "number", description: "Number of orders to retrieve (default 10)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_system_metrics",
          description: "Get global system metrics including total inventory, active requests, and warehouse utilization",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      // ACTION TOOLS - Admin
      {
        type: "function",
        function: {
          name: "approve_check_in_request",
          description: "IMPORTANT: Always ask user for confirmation before calling this. Approve a pending check-in request and add products to inventory.",
          parameters: {
            type: "object",
            properties: {
              request_id: { type: "string", description: "The check-in request ID to approve" }
            },
            required: ["request_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reject_check_in_request",
          description: "IMPORTANT: Always ask user for confirmation before calling this. Reject a pending check-in request.",
          parameters: {
            type: "object",
            properties: {
              request_id: { type: "string", description: "The check-in request ID to reject" },
              rejection_reason: { type: "string", description: "Reason for rejection" }
            },
            required: ["request_id", "rejection_reason"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "approve_check_out_request",
          description: "IMPORTANT: Always ask user for confirmation before calling this. Approve a pending check-out request.",
          parameters: {
            type: "object",
            properties: {
              request_id: { type: "string", description: "The check-out request ID to approve" }
            },
            required: ["request_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reject_check_out_request",
          description: "IMPORTANT: Always ask user for confirmation before calling this. Reject a pending check-out request.",
          parameters: {
            type: "object",
            properties: {
              request_id: { type: "string", description: "The check-out request ID to reject" },
              rejection_reason: { type: "string", description: "Reason for rejection" }
            },
            required: ["request_id", "rejection_reason"]
          }
        }
      }
    ] : [
      // READ TOOLS - Client
      {
        type: "function",
        function: {
          name: "get_company_stats",
          description: "Get statistics for the current user's company including products, inventory, and orders",
          parameters: { type: "object", properties: {}, required: [] }
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
              product_name: { type: "string", description: "Optional product name or partial name to filter by" },
              sku: { type: "string", description: "Optional exact SKU to filter by" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_check_in_requests",
          description: "Get check-in requests for the current company, optionally filtered by status",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["pending", "approved", "rejected"], description: "Filter by status" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_check_out_requests",
          description: "Get check-out requests for the current company, optionally filtered by status",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["pending", "approved", "rejected"], description: "Filter by status" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_orders",
          description: "Get orders for the current company with status and details",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", description: "Optional order status filter" },
              limit: { type: "number", description: "Max results (default 10)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_shipments",
          description: "Get shipments for the current company with tracking info",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Max results (default 10)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_messages",
          description: "Get messages for the current company",
          parameters: {
            type: "object",
            properties: {
              unread_only: { type: "boolean", description: "Show only unread messages" },
              limit: { type: "number", description: "Max results (default 10)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_dashboard_metrics",
          description: "Get client dashboard KPIs including recent activity and key metrics",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      // ACTION TOOLS - Client
      {
        type: "function",
        function: {
          name: "create_check_in_request",
          description: "IMPORTANT: Always ask user for confirmation before calling this. Create a new check-in request to add products to inventory.",
          parameters: {
            type: "object",
            properties: {
              products: {
                type: "array",
                description: "Array of products to check in",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    quantity: { type: "number" },
                    variants: { type: "array" }
                  }
                }
              },
              notes: { type: "string", description: "Optional notes about the check-in" }
            },
            required: ["products"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_check_out_request",
          description: "IMPORTANT: Always ask user for confirmation before calling this. Create a new check-out request to remove products from inventory.",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                description: "Array of items to check out",
                items: {
                  type: "object",
                  properties: {
                    product_id: { type: "string" },
                    quantity: { type: "number" }
                  }
                }
              },
              notes: { type: "string", description: "Optional notes" }
            },
            required: ["items"]
          }
        }
      }
    ];

    // Build system prompt based on role
    let systemPrompt = '';
    if (isAdmin) {
      systemPrompt = `You are Clearpath AI, an intelligent business and warehouse operations assistant for administrators.

You are a versatile AI assistant that can help with:
- Business strategy and planning (marketing, growth, operations)
- General business advice and consulting
- Data analysis and insights
- Problem-solving across various business domains
- Creative ideation and brainstorming
- Warehouse operations and management

You have access to comprehensive tools for real-time warehouse data AND actions:

READ TOOLS:
- Client information and counts
- Warehouse statistics (zones, rows, inventory, orders)
- Check-in and check-out requests (all clients)
- Order activity and shipments
- System-wide metrics

ACTION TOOLS (ALWAYS confirm with user before executing):
- Approve/reject check-in requests
- Approve/reject check-out requests
- Bulk operations when requested

Current context:
- You're assisting: ${profile?.full_name || user.email} (Admin at Clearpath Warehouse Management)
- Current date: ${new Date().toISOString().split('T')[0]}
- Software: Clearpath is a warehouse management system that handles inventory, orders, and client management

Critical Guidelines:
1. **ALWAYS ask for user confirmation before executing any action** (approvals, rejections, creates)
   - Example: "I found 3 pending check-in requests. Would you like me to approve all of them?"
   - Wait for explicit "yes" or confirmation before calling action tools
2. When showing lists of requests/items, present them clearly with numbers/IDs so user can reference them
3. For bulk operations, summarize what will happen and confirm first
4. After actions, report what was done and suggest next steps
5. Use read tools proactively to provide context before suggesting actions
6. Feel free to discuss any business topic, not just warehouse management
7. Be conversational, insightful, and helpful across all business domains

Your goal is to be a valuable business partner AND operational assistant, whether helping with warehouse operations OR broader business strategy.`;
    } else {
      systemPrompt = `You are Clearpath AI, a versatile business and operations assistant for ${company?.name || 'your company'}.

You are here to help with:
- Business strategy and growth (marketing, sales, customer acquisition)
- General business advice and planning
- Data analysis and operational insights
- Creative problem-solving
- Industry trends and best practices
- Warehouse operations and inventory management

You have access to comprehensive tools for your warehouse data AND actions:

READ TOOLS:
- Product catalog and inventory (including units and variants)
- Check-in and check-out requests
- Order history and status
- Shipment tracking
- Messages and communications
- Dashboard metrics and KPIs

ACTION TOOLS (ALWAYS confirm with user before executing):
- Create check-in requests (add inventory)
- Create check-out requests (remove inventory)

Current context:
- Company: ${company?.name || 'N/A'}
- Client code: ${company?.client_code || 'N/A'}
- Current date: ${new Date().toISOString().split('T')[0]}
- Platform: You're using Clearpath, a warehouse management system

Critical Guidelines:
1. **ALWAYS ask for user confirmation before executing any action** (creating requests)
   - Example: "I can create a check-in request for 100 units of Product X. Should I proceed?"
   - Wait for explicit "yes" or confirmation before calling action tools
2. When asked about quantities or units, call get_product_inventory and base your answer on its results
3. Present information clearly with context and explanations
4. After actions, confirm what was done and provide next steps
5. Use read tools proactively to give accurate, data-driven answers
6. Discuss any business topic freely - marketing, strategy, operations, etc.
7. Be conversational, insightful, and supportive

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
            // ============ ADMIN READ TOOLS ============
            case 'get_client_count': {
              const { count } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
              result = { active_clients: count || 0 };
              break;
            }
            
            case 'get_all_clients': {
              const parsedArgs = args ? JSON.parse(args) : {};
              const activeOnly = parsedArgs.active_only !== false;
              
              let query = supabase
                .from('companies')
                .select('id, name, client_code, contact_email, contact_phone, is_active, created_at');
              
              if (activeOnly) {
                query = query.eq('is_active', true);
              }
              
              const { data } = await query.order('name');
              result = { clients: data || [] };
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
            
            case 'get_warehouse_zones': {
              const { data } = await supabase
                .from('warehouse_zones')
                .select('*')
                .eq('is_active', true)
                .order('name');
              result = { zones: data || [] };
              break;
            }
            
            case 'get_warehouse_rows': {
              const parsedArgs = args ? JSON.parse(args) : {};
              let query = supabase
                .from('warehouse_rows')
                .select('*, warehouse_zones(name), companies(name)')
                .eq('is_active', true);
              
              if (parsedArgs.zone_id) {
                query = query.eq('zone_id', parsedArgs.zone_id);
              }
              
              const { data } = await query.order('row_number');
              result = { rows: data || [] };
              break;
            }
            
            case 'get_all_check_in_requests': {
              const parsedArgs = args ? JSON.parse(args) : {};
              const limit = parsedArgs.limit || 20;
              
              let query = supabase
                .from('check_in_requests')
                .select('id, request_number, status, requested_products, notes, created_at, companies(name, client_code)')
                .order('created_at', { ascending: false })
                .limit(limit);
              
              if (parsedArgs.status) {
                query = query.eq('status', parsedArgs.status);
              }
              
              const { data } = await query;
              result = { check_in_requests: data || [] };
              break;
            }
            
            case 'get_all_check_out_requests': {
              const parsedArgs = args ? JSON.parse(args) : {};
              const limit = parsedArgs.limit || 20;
              
              let query = supabase
                .from('check_out_requests')
                .select('id, request_number, status, requested_items, notes, created_at, companies(name, client_code)')
                .order('created_at', { ascending: false })
                .limit(limit);
              
              if (parsedArgs.status) {
                query = query.eq('status', parsedArgs.status);
              }
              
              const { data } = await query;
              result = { check_out_requests: data || [] };
              break;
            }
            
            case 'get_recent_orders': {
              const limit = JSON.parse(args || '{}').limit || 10;
              const { data } = await supabase
                .from('client_orders')
                .select('order_number, status, total_items, created_at, companies(name)')
                .order('created_at', { ascending: false })
                .limit(limit);
              result = { orders: data };
              break;
            }
            
            case 'get_system_metrics': {
              const [
                totalClients,
                pendingCheckIns,
                pendingCheckOuts,
                totalInventory,
                activeOrders
              ] = await Promise.all([
                supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('check_in_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('check_out_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('inventory_items').select('quantity'),
                supabase.from('client_orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing'])
              ]);
              
              const totalUnits = totalInventory.data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
              
              result = {
                total_clients: totalClients.count || 0,
                pending_check_ins: pendingCheckIns.count || 0,
                pending_check_outs: pendingCheckOuts.count || 0,
                total_inventory_units: totalUnits,
                active_orders: activeOrders.count || 0
              };
              break;
            }
            
            // ============ ADMIN ACTION TOOLS ============
            case 'approve_check_in_request': {
              const parsedArgs = JSON.parse(args);
              const requestId = parsedArgs.request_id;
              
              // Get the request
              const { data: request } = await supabase
                .from('check_in_requests')
                .select('*, companies(name)')
                .eq('id', requestId)
                .single();
              
              if (!request || request.status !== 'pending') {
                result = { error: 'Request not found or not pending' };
                break;
              }
              
              // Reuse the approval logic from CheckInRequests page
              const productsToInsert = request.requested_products.map((product: any) => ({
                company_id: request.company_id,
                name: product.name,
                variants: product.variants || [],
                is_active: true,
              }));
              
              const { data: insertedProducts, error: insertError } = await supabase
                .from('client_products')
                .insert(productsToInsert)
                .select();
              
              if (insertError) throw insertError;
              
              // Add to inventory
              for (let i = 0; i < request.requested_products.length; i++) {
                const product = request.requested_products[i];
                const insertedProduct = insertedProducts?.[i];
                
                if (insertedProduct) {
                  let totalQuantity = product.quantity || 0;
                  if (product.variants && product.variants.length > 0) {
                    totalQuantity = product.variants.reduce((sum: number, variant: any) =>
                      sum + variant.values.reduce((vSum: number, val: any) =>
                        vSum + (val.quantity || 0), 0
                      ), 0
                    );
                  }
                  
                  const { data: existingInventory } = await supabase
                    .from('inventory_items')
                    .select('id, quantity')
                    .eq('product_id', insertedProduct.id)
                    .eq('company_id', request.company_id)
                    .is('location_id', null)
                    .maybeSingle();
                  
                  if (existingInventory) {
                    await supabase
                      .from('inventory_items')
                      .update({
                        quantity: existingInventory.quantity + totalQuantity,
                        last_updated: new Date().toISOString()
                      })
                      .eq('id', existingInventory.id);
                  } else {
                    await supabase
                      .from('inventory_items')
                      .insert({
                        product_id: insertedProduct.id,
                        company_id: request.company_id,
                        quantity: totalQuantity,
                        received_date: new Date().toISOString()
                      });
                  }
                }
              }
              
              // Update request status
              await supabase
                .from('check_in_requests')
                .update({
                  status: 'approved',
                  reviewed_at: new Date().toISOString(),
                  reviewed_by: user.id
                })
                .eq('id', requestId);
              
              // Log activity
              await supabase.from('client_activity_logs').insert({
                user_id: user.id,
                company_id: request.company_id,
                activity_type: 'check_in_approved',
                activity_description: `AI approved check-in request ${request.request_number}`,
                metadata: { request_id: requestId, request_number: request.request_number }
              });
              
              result = {
                success: true,
                message: `Approved check-in request ${request.request_number} for ${request.companies?.name}`,
                products_added: request.requested_products.length
              };
              break;
            }
            
            case 'reject_check_in_request': {
              const parsedArgs = JSON.parse(args);
              const { request_id, rejection_reason } = parsedArgs;
              
              const { data: request } = await supabase
                .from('check_in_requests')
                .select('request_number, company_id, companies(name)')
                .eq('id', request_id)
                .single();
              
              if (!request) {
                result = { error: 'Request not found' };
                break;
              }
              
              await supabase
                .from('check_in_requests')
                .update({
                  status: 'rejected',
                  reviewed_at: new Date().toISOString(),
                  reviewed_by: user.id,
                  rejection_reason
                })
                .eq('id', request_id);
              
              await supabase.from('client_activity_logs').insert({
                user_id: user.id,
                company_id: request.company_id,
                activity_type: 'check_in_rejected',
                activity_description: `AI rejected check-in request ${request.request_number}`,
                metadata: { request_id, rejection_reason }
              });
              
              result = {
                success: true,
                message: `Rejected check-in request ${request.request_number} for ${request.companies?.name}`,
                reason: rejection_reason
              };
              break;
            }
            
            case 'approve_check_out_request': {
              const parsedArgs = JSON.parse(args);
              const requestId = parsedArgs.request_id;
              
              const { data: request } = await supabase
                .from('check_out_requests')
                .select('*, companies(name)')
                .eq('id', requestId)
                .single();
              
              if (!request) {
                result = { error: 'Request not found' };
                break;
              }
              
              await supabase
                .from('check_out_requests')
                .update({
                  status: 'approved',
                  reviewed_at: new Date().toISOString(),
                  reviewed_by: user.id
                })
                .eq('id', requestId);
              
              await supabase.from('client_activity_logs').insert({
                user_id: user.id,
                company_id: request.company_id,
                activity_type: 'check_out_approved',
                activity_description: `AI approved check-out request ${request.request_number}`,
                metadata: { request_id: requestId }
              });
              
              result = {
                success: true,
                message: `Approved check-out request ${request.request_number} for ${request.companies?.name}`
              };
              break;
            }
            
            case 'reject_check_out_request': {
              const parsedArgs = JSON.parse(args);
              const { request_id, rejection_reason } = parsedArgs;
              
              const { data: request } = await supabase
                .from('check_out_requests')
                .select('request_number, company_id, companies(name)')
                .eq('id', request_id)
                .single();
              
              if (!request) {
                result = { error: 'Request not found' };
                break;
              }
              
              await supabase
                .from('check_out_requests')
                .update({
                  status: 'rejected',
                  reviewed_at: new Date().toISOString(),
                  reviewed_by: user.id,
                  rejection_reason
                })
                .eq('id', request_id);
              
              await supabase.from('client_activity_logs').insert({
                user_id: user.id,
                company_id: request.company_id,
                activity_type: 'check_out_rejected',
                activity_description: `AI rejected check-out request ${request.request_number}`,
                metadata: { request_id, rejection_reason }
              });
              
              result = {
                success: true,
                message: `Rejected check-out request ${request.request_number} for ${request.companies?.name}`,
                reason: rejection_reason
              };
              break;
            }
            
            // ============ CLIENT READ TOOLS ============
            case 'get_company_stats': {
              const companyId = company?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }
              const [{ data: productsData, count: productsCount }, orders] = await Promise.all([
                supabase
                  .from('client_products')
                  .select('id, variants, inventory_items(quantity)', { count: 'exact' })
                  .eq('company_id', companyId),
                supabase
                  .from('client_orders')
                  .select('*', { count: 'exact', head: true })
                  .eq('company_id', companyId)
              ]);

              let totalInventoryUnits = 0;
              (productsData || []).forEach((p: any) => {
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

                const totalForProduct = inventoryTotal || variantsTotal;
                totalInventoryUnits += totalForProduct;
              });

              result = {
                total_products: productsCount || 0,
                total_inventory_units: totalInventoryUnits,
                total_orders: orders.count || 0
              };
              break;
            }
            
            case 'get_product_inventory': {
              const companyId = company?.id;
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
            
            case 'get_check_in_requests': {
              const companyId = company?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }
              
              const parsedArgs = args ? JSON.parse(args) : {};
              let query = supabase
                .from('check_in_requests')
                .select('id, request_number, status, requested_products, notes, created_at, reviewed_at, rejection_reason')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });
              
              if (parsedArgs.status) {
                query = query.eq('status', parsedArgs.status);
              }
              
              const { data } = await query;
              result = { check_in_requests: data || [] };
              break;
            }
            
            case 'get_check_out_requests': {
              const companyId = company?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }
              
              const parsedArgs = args ? JSON.parse(args) : {};
              let query = supabase
                .from('check_out_requests')
                .select('id, request_number, status, requested_items, notes, created_at, reviewed_at, rejection_reason')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });
              
              if (parsedArgs.status) {
                query = query.eq('status', parsedArgs.status);
              }
              
              const { data } = await query;
              result = { check_out_requests: data || [] };
              break;
            }
            
            case 'get_orders': {
              const companyId = company?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }
              
              const parsedArgs = args ? JSON.parse(args) : {};
              const limit = parsedArgs.limit || 10;
              
              let query = supabase
                .from('client_orders')
                .select('id, order_number, status, total_items, total_value, created_at, requested_date')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })
                .limit(limit);
              
              if (parsedArgs.status) {
                query = query.eq('status', parsedArgs.status);
              }
              
              const { data } = await query;
              result = { orders: data || [] };
              break;
            }
            
            case 'get_shipments': {
              const companyId = company?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }
              
              const parsedArgs = args ? JSON.parse(args) : {};
              const limit = parsedArgs.limit || 10;
              
              const { data } = await supabase
                .from('shipments')
                .select('id, shipment_number, status, tracking_number, shipment_date, carrier, destination_address')
                .eq('company_id', companyId)
                .order('shipment_date', { ascending: false })
                .limit(limit);
              
              result = { shipments: data || [] };
              break;
            }
            
            case 'get_messages': {
              const parsedArgs = args ? JSON.parse(args) : {};
              const limit = parsedArgs.limit || 10;
              
              let query = supabase
                .from('messages')
                .select('id, subject, content, created_at, read_at, priority, message_type')
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                .order('created_at', { ascending: false })
                .limit(limit);
              
              if (parsedArgs.unread_only) {
                query = query.is('read_at', null);
              }
              
              const { data } = await query;
              result = { messages: data || [] };
              break;
            }
            
            case 'get_dashboard_metrics': {
              const companyId = company?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }
              
              const [
                products,
                inventory,
                pendingCheckIns,
                pendingCheckOuts,
                recentOrders,
                unreadMessages
              ] = await Promise.all([
                supabase.from('client_products').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
                supabase.from('inventory_items').select('quantity').eq('company_id', companyId),
                supabase.from('check_in_requests').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending'),
                supabase.from('check_out_requests').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending'),
                supabase.from('client_orders').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['pending', 'processing']),
                supabase.from('messages').select('*', { count: 'exact', head: true }).eq('recipient_id', user.id).is('read_at', null)
              ]);
              
              const totalInventory = inventory.data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
              
              result = {
                total_products: products.count || 0,
                total_inventory_units: totalInventory,
                pending_check_ins: pendingCheckIns.count || 0,
                pending_check_outs: pendingCheckOuts.count || 0,
                active_orders: recentOrders.count || 0,
                unread_messages: unreadMessages.count || 0
              };
              break;
            }
            
            // ============ CLIENT ACTION TOOLS ============
            case 'create_check_in_request': {
              const companyId = company?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }
              
              const parsedArgs = JSON.parse(args);
              const { products, notes } = parsedArgs;
              
              // Generate request number
              const { data: requestNumber } = await supabase.rpc('generate_check_in_request_number');
              
              const { data: newRequest, error: insertError } = await supabase
                .from('check_in_requests')
                .insert({
                  company_id: companyId,
                  request_number: requestNumber,
                  requested_products: products,
                  notes: notes || null,
                  requested_by: user.id,
                  status: 'pending'
                })
                .select('id, request_number')
                .single();
              
              if (insertError) throw insertError;
              
              await supabase.from('client_activity_logs').insert({
                user_id: user.id,
                company_id: companyId,
                activity_type: 'check_in_requested',
                activity_description: `AI created check-in request ${newRequest.request_number}`,
                metadata: { request_id: newRequest.id, products_count: products.length }
              });
              
              result = {
                success: true,
                message: `Created check-in request ${newRequest.request_number}`,
                request_number: newRequest.request_number,
                products_count: products.length
              };
              break;
            }
            
            case 'create_check_out_request': {
              const companyId = company?.id;
              if (!companyId) {
                result = { error: 'No company associated with user' };
                break;
              }
              
              const parsedArgs = JSON.parse(args);
              const { items, notes } = parsedArgs;
              
              // Generate request number
              const { data: requestNumber } = await supabase.rpc('generate_check_out_request_number');
              
              const { data: newRequest, error: insertError } = await supabase
                .from('check_out_requests')
                .insert({
                  company_id: companyId,
                  request_number: requestNumber,
                  requested_items: items,
                  notes: notes || null,
                  requested_by: user.id,
                  status: 'pending'
                })
                .select('id, request_number')
                .single();
              
              if (insertError) throw insertError;
              
              await supabase.from('client_activity_logs').insert({
                user_id: user.id,
                company_id: companyId,
                activity_type: 'check_out_requested',
                activity_description: `AI created check-out request ${newRequest.request_number}`,
                metadata: { request_id: newRequest.id, items_count: items.length }
              });
              
              result = {
                success: true,
                message: `Created check-out request ${newRequest.request_number}`,
                request_number: newRequest.request_number,
                items_count: items.length
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
        model: 'google/gemini-3-flash-preview',
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
          model: 'google/gemini-3-flash-preview',
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
        model: 'google/gemini-3-flash-preview',
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