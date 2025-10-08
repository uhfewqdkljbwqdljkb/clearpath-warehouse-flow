-- Migrate existing products to new SKU format (XXX-XXX-000)
-- This will reassign product numbers sequentially per client

DO $$
DECLARE
  company_record RECORD;
  product_record RECORD;
  client_num TEXT;
  product_counter INTEGER;
BEGIN
  -- Loop through each company
  FOR company_record IN 
    SELECT DISTINCT c.id, c.client_code
    FROM companies c
    INNER JOIN client_products cp ON cp.company_id = c.id
    ORDER BY c.client_code
  LOOP
    -- Extract client number from client_code (e.g., CLT001 -> 001)
    client_num := LPAD(REGEXP_REPLACE(company_record.client_code, '[^0-9]', '', 'g'), 3, '0');
    
    -- Reset product counter for each client
    product_counter := 1;
    
    -- Loop through products for this company in creation order
    FOR product_record IN
      SELECT id
      FROM client_products
      WHERE company_id = company_record.id
      ORDER BY created_at
    LOOP
      -- Update SKU to new format: XXX-XXX-000
      UPDATE client_products
      SET sku = client_num || '-' || LPAD(product_counter::TEXT, 3, '0') || '-000'
      WHERE id = product_record.id;
      
      product_counter := product_counter + 1;
    END LOOP;
  END LOOP;
END $$;