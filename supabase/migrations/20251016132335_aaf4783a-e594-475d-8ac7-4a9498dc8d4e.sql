-- Add client_sequence_number to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS client_sequence_number INTEGER;

-- Set sequence numbers for existing companies based on creation order
WITH numbered_companies AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as seq_num
  FROM companies
)
UPDATE companies
SET client_sequence_number = numbered_companies.seq_num
FROM numbered_companies
WHERE companies.id = numbered_companies.id;

-- Add sku column back to client_products
ALTER TABLE client_products
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Create function to generate SKU
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
DECLARE
  client_seq TEXT;
  product_seq TEXT;
  product_count INTEGER;
  variant_array JSONB;
  variant_item JSONB;
  variant_seq INTEGER;
  updated_variants JSONB := '[]'::jsonb;
BEGIN
  -- Get client sequence number (3 digits with leading zeros)
  SELECT LPAD(client_sequence_number::TEXT, 3, '0')
  INTO client_seq
  FROM companies
  WHERE id = NEW.company_id;

  -- If client doesn't have a sequence number, assign one
  IF client_seq IS NULL THEN
    UPDATE companies
    SET client_sequence_number = (
      SELECT COALESCE(MAX(client_sequence_number), 0) + 1
      FROM companies
    )
    WHERE id = NEW.company_id
    RETURNING LPAD(client_sequence_number::TEXT, 3, '0') INTO client_seq;
  END IF;

  -- Count existing products for this client to get next product number
  SELECT COUNT(*) + 1
  INTO product_count
  FROM client_products
  WHERE company_id = NEW.company_id
    AND id != NEW.id;

  product_seq := LPAD(product_count::TEXT, 3, '0');

  -- Process variants and add SKUs
  IF NEW.variants IS NOT NULL AND jsonb_array_length(NEW.variants) > 0 THEN
    variant_seq := 0;
    
    FOR variant_item IN SELECT * FROM jsonb_array_elements(NEW.variants)
    LOOP
      variant_seq := variant_seq + 1;
      -- Add SKU to each variant
      updated_variants := updated_variants || jsonb_build_object(
        'attribute', variant_item->>'attribute',
        'values', variant_item->'values',
        'sku', client_seq || '-' || product_seq || '-' || LPAD(variant_seq::TEXT, 3, '0')
      );
    END LOOP;
    
    NEW.variants := updated_variants;
  END IF;

  -- Set the base SKU (for products without variants, this will be the only SKU with -001)
  NEW.sku := client_seq || '-' || product_seq || '-001';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate SKU on insert
DROP TRIGGER IF EXISTS generate_sku_trigger ON client_products;
CREATE TRIGGER generate_sku_trigger
  BEFORE INSERT ON client_products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_sku();