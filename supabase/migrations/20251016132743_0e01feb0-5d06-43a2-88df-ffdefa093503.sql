-- Backfill SKUs for existing products
DO $$
DECLARE
  product_record RECORD;
  client_seq TEXT;
  product_seq TEXT;
  product_count INTEGER;
  variant_item JSONB;
  variant_seq INTEGER;
  updated_variants JSONB;
BEGIN
  -- Loop through all products without SKUs
  FOR product_record IN 
    SELECT * FROM client_products WHERE sku IS NULL ORDER BY created_at
  LOOP
    -- Get client sequence number
    SELECT LPAD(COALESCE(client_sequence_number, 0)::TEXT, 3, '0')
    INTO client_seq
    FROM companies
    WHERE id = product_record.company_id;
    
    -- If client doesn't have a sequence number, assign one
    IF client_seq = '000' THEN
      UPDATE companies
      SET client_sequence_number = (
        SELECT COALESCE(MAX(client_sequence_number), 0) + 1
        FROM companies
      )
      WHERE id = product_record.company_id
      RETURNING LPAD(client_sequence_number::TEXT, 3, '0') INTO client_seq;
    END IF;
    
    -- Count existing products for this client
    SELECT COUNT(*)
    INTO product_count
    FROM client_products
    WHERE company_id = product_record.company_id
      AND created_at <= product_record.created_at;
    
    product_seq := LPAD(product_count::TEXT, 3, '0');
    
    -- Process variants if they exist
    updated_variants := '[]'::jsonb;
    IF product_record.variants IS NOT NULL AND jsonb_array_length(product_record.variants) > 0 THEN
      variant_seq := 0;
      
      FOR variant_item IN SELECT * FROM jsonb_array_elements(product_record.variants)
      LOOP
        variant_seq := variant_seq + 1;
        updated_variants := updated_variants || jsonb_build_object(
          'attribute', variant_item->>'attribute',
          'values', variant_item->'values',
          'sku', client_seq || '-' || product_seq || '-' || LPAD(variant_seq::TEXT, 3, '0')
        );
      END LOOP;
      
      -- Update product with variants and SKU
      UPDATE client_products
      SET 
        sku = client_seq || '-' || product_seq || '-001',
        variants = updated_variants
      WHERE id = product_record.id;
    ELSE
      -- Update product with just SKU
      UPDATE client_products
      SET sku = client_seq || '-' || product_seq || '-001'
      WHERE id = product_record.id;
    END IF;
  END LOOP;
END $$;