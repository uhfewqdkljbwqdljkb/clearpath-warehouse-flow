-- Clean all test/seed data from the database

-- Delete all messages
DELETE FROM public.messages;

-- Delete all order items
DELETE FROM public.client_order_items;

-- Delete all orders
DELETE FROM public.client_orders;

-- Delete all inventory items
DELETE FROM public.inventory_items;

-- Delete all client products
DELETE FROM public.client_products;

-- Delete all activity logs
DELETE FROM public.client_activity_logs;

-- Delete all admin sessions
DELETE FROM public.admin_sessions;

-- Delete all companies/clients (except those created after this cleanup)
DELETE FROM public.companies 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);