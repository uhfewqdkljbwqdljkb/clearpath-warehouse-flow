-- Add sample client products for TechShop Electronics
INSERT INTO client_products (company_id, name, sku, description, category, unit_value, dimensions_length, dimensions_width, dimensions_height, weight, storage_requirements, is_active) VALUES
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'iPhone 15 Pro Cases', 'TC-001', 'Premium protective cases for iPhone 15 Pro', 'Phone Accessories', 29.99, 15.5, 8.0, 1.2, 0.15, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Wireless Earbuds Pro', 'TC-002', 'Premium noise-cancelling wireless earbuds', 'Audio', 149.99, 10.0, 8.0, 4.0, 0.25, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'USB-C Charging Cables', 'TC-003', '2-meter fast charging USB-C cables', 'Cables', 19.99, 20.0, 15.0, 2.0, 0.08, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Screen Protectors iPhone 15', 'TC-004', 'Tempered glass screen protectors', 'Phone Accessories', 14.99, 12.0, 8.0, 0.5, 0.05, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Portable Power Bank 20000mAh', 'TC-005', 'High-capacity portable charger', 'Power', 49.99, 16.0, 8.0, 2.5, 0.45, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Bluetooth Speakers', 'TC-006', 'Waterproof portable Bluetooth speakers', 'Audio', 79.99, 20.0, 10.0, 8.0, 0.8, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Wireless Charging Pads', 'TC-007', '15W fast wireless charging pads', 'Chargers', 34.99, 12.0, 12.0, 1.5, 0.2, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Apple Watch Bands', 'TC-008', 'Silicone sport bands for Apple Watch', 'Wearables', 24.99, 25.0, 3.0, 1.0, 0.03, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Car Phone Mounts', 'TC-009', 'Magnetic car phone mounts', 'Automotive', 22.99, 15.0, 10.0, 5.0, 0.18, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Lightning to USB-C Adapters', 'TC-010', 'Apple Lightning to USB-C adapters', 'Adapters', 12.99, 8.0, 3.0, 1.0, 0.02, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Gaming Controllers', 'TC-011', 'Wireless gaming controllers for mobile', 'Gaming', 59.99, 20.0, 15.0, 8.0, 0.35, 'standard', true),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), 'Tablet Stands', 'TC-012', 'Adjustable aluminum tablet stands', 'Accessories', 39.99, 25.0, 20.0, 5.0, 0.5, 'standard', true);

-- Add inventory items with realistic stock levels
INSERT INTO inventory_items (company_id, client_product_id, quantity, location_zone, location_row, location_bin, location_code, movement_type, notes, last_movement_date) VALUES
-- High stock items (healthy)
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-001'), 450, 'A', '01', '05', 'A01-05', 'inbound', 'Recent restock delivery', NOW() - INTERVAL '2 days'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-003'), 380, 'A', '01', '06', 'A01-06', 'inbound', 'Weekly delivery', NOW() - INTERVAL '1 day'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-004'), 250, 'A', '02', '03', 'A02-03', 'inbound', 'Bulk order received', NOW() - INTERVAL '3 days'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-007'), 180, 'B', '01', '08', 'B01-08', 'inbound', 'Regular restock', NOW() - INTERVAL '5 days'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-008'), 320, 'A', '03', '02', 'A03-02', 'inbound', 'Seasonal stock', NOW() - INTERVAL '4 days'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-010'), 420, 'A', '02', '07', 'A02-07', 'inbound', 'High demand item', NOW() - INTERVAL '1 day'),

-- Medium stock items 
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-006'), 95, 'B', '02', '04', 'B02-04', 'outbound', 'Recent sales', NOW() - INTERVAL '6 hours'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-009'), 78, 'A', '03', '09', 'A03-09', 'outbound', 'Steady sales', NOW() - INTERVAL '4 hours'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-012'), 120, 'B', '03', '01', 'B03-01', 'inbound', 'New product launch', NOW() - INTERVAL '7 days'),

-- Low stock items (need attention)
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-005'), 35, 'B', '01', '12', 'B01-12', 'outbound', 'Popular item - reorder needed', NOW() - INTERVAL '3 hours'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-011'), 28, 'B', '02', '15', 'B02-15', 'outbound', 'Gaming season demand', NOW() - INTERVAL '2 hours'),

-- Critical stock items (urgent)
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT id FROM client_products WHERE sku = 'TC-002'), 12, 'A', '01', '12', 'A01-12', 'outbound', 'CRITICAL: Fast selling item', NOW() - INTERVAL '1 hour');

-- Add sample client orders with different statuses
INSERT INTO client_orders (company_id, created_by, order_number, order_type, status, requested_date, notes) VALUES
-- Pending orders
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-001', 'outbound', 'pending', CURRENT_DATE + INTERVAL '1 day', 'Rush order for weekend promotion'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-002', 'outbound', 'pending', CURRENT_DATE + INTERVAL '2 days', 'Regular weekly order'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-003', 'outbound', 'pending', CURRENT_DATE, 'Same day delivery required'),

-- Processing orders
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-004', 'outbound', 'processing', CURRENT_DATE, 'Currently being picked'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-005', 'outbound', 'processing', CURRENT_DATE - INTERVAL '1 day', 'Quality check in progress'),

-- Shipped orders
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-006', 'outbound', 'shipped', CURRENT_DATE - INTERVAL '1 day', 'Shipped via Aramex'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-007', 'outbound', 'shipped', CURRENT_DATE - INTERVAL '2 days', 'Express delivery'),

-- Completed orders (for analytics)
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-008', 'outbound', 'completed', CURRENT_DATE - INTERVAL '3 days', 'Successfully delivered'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-009', 'outbound', 'completed', CURRENT_DATE - INTERVAL '5 days', 'Customer satisfied'),
((SELECT id FROM companies WHERE name = 'TechShop Electronics'), (SELECT user_id FROM profiles WHERE email = 'client@techshop.com'), 'ORD-24-010', 'outbound', 'completed', CURRENT_DATE - INTERVAL '7 days', 'Repeat customer order');

-- Add order items for the orders
INSERT INTO client_order_items (order_id, client_product_id, quantity, unit_value, notes) VALUES
-- Pending order items
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-001'), (SELECT id FROM client_products WHERE sku = 'TC-001'), 25, 29.99, 'iPhone cases for promotion'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-001'), (SELECT id FROM client_products WHERE sku = 'TC-002'), 15, 149.99, 'Premium earbuds'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-001'), (SELECT id FROM client_products WHERE sku = 'TC-003'), 30, 19.99, 'Charging cables bundle'),

((SELECT id FROM client_orders WHERE order_number = 'ORD-24-002'), (SELECT id FROM client_products WHERE sku = 'TC-004'), 50, 14.99, 'Screen protectors bulk'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-002'), (SELECT id FROM client_products WHERE sku = 'TC-007'), 20, 34.99, 'Wireless charging pads'),

((SELECT id FROM client_orders WHERE order_number = 'ORD-24-003'), (SELECT id FROM client_products WHERE sku = 'TC-005'), 8, 49.99, 'Power banks - same day'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-003'), (SELECT id FROM client_products WHERE sku = 'TC-006'), 12, 79.99, 'Bluetooth speakers'),

-- Processing order items
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-004'), (SELECT id FROM client_products WHERE sku = 'TC-008'), 35, 24.99, 'Apple Watch bands'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-004'), (SELECT id FROM client_products WHERE sku = 'TC-009'), 18, 22.99, 'Car mounts'),

((SELECT id FROM client_orders WHERE order_number = 'ORD-24-005'), (SELECT id FROM client_products WHERE sku = 'TC-010'), 45, 12.99, 'Lightning adapters'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-005'), (SELECT id FROM client_products WHERE sku = 'TC-011'), 10, 59.99, 'Gaming controllers'),

-- Shipped order items
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-006'), (SELECT id FROM client_products WHERE sku = 'TC-001'), 40, 29.99, 'iPhone cases shipped'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-006'), (SELECT id FROM client_products WHERE sku = 'TC-012'), 15, 39.99, 'Tablet stands'),

((SELECT id FROM client_orders WHERE order_number = 'ORD-24-007'), (SELECT id FROM client_products WHERE sku = 'TC-002'), 8, 149.99, 'Express earbuds'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-007'), (SELECT id FROM client_products WHERE sku = 'TC-003'), 25, 19.99, 'Cables express'),

-- Completed order items (for history/analytics)
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-008'), (SELECT id FROM client_products WHERE sku = 'TC-001'), 30, 29.99, 'Cases delivered'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-008'), (SELECT id FROM client_products WHERE sku = 'TC-004'), 40, 14.99, 'Screen protectors delivered'),

((SELECT id FROM client_orders WHERE order_number = 'ORD-24-009'), (SELECT id FROM client_products WHERE sku = 'TC-005'), 12, 49.99, 'Power banks delivered'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-009'), (SELECT id FROM client_products WHERE sku = 'TC-006'), 8, 79.99, 'Speakers delivered'),

((SELECT id FROM client_orders WHERE order_number = 'ORD-24-010'), (SELECT id FROM client_products WHERE sku = 'TC-007'), 25, 34.99, 'Charging pads delivered'),
((SELECT id FROM client_orders WHERE order_number = 'ORD-24-010'), (SELECT id FROM client_products WHERE sku = 'TC-008'), 20, 24.99, 'Watch bands delivered');