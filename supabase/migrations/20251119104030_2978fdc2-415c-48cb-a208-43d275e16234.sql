-- Backfill inventory from approved check-in requests
DO $$
DECLARE
  request_record RECORD;
  product_record JSONB;
  variant_record JSONB;
  value_record JSONB;
  product_id_var UUID;
  existing_qty INTEGER;
BEGIN
  FOR request_record IN 
    SELECT id, company_id, requested_products, amended_products, was_amended
    FROM check_in_requests
    WHERE status = 'approved'
  LOOP
    FOR product_record IN 
      SELECT * FROM jsonb_array_elements(
        CASE 
          WHEN request_record.was_amended AND request_record.amended_products IS NOT NULL 
          THEN request_record.amended_products 
          ELSE request_record.requested_products 
        END
      )
    LOOP
      SELECT id INTO product_id_var
      FROM client_products
      WHERE company_id = request_record.company_id
        AND name = product_record->>'name'
      LIMIT 1;
      
      IF product_id_var IS NOT NULL THEN
        IF product_record->'variants' IS NOT NULL AND jsonb_array_length(product_record->'variants') > 0 THEN
          FOR variant_record IN SELECT * FROM jsonb_array_elements(product_record->'variants')
          LOOP
            FOR value_record IN SELECT * FROM jsonb_array_elements(variant_record->'values')
            LOOP
              SELECT quantity INTO existing_qty
              FROM inventory_items
              WHERE product_id = product_id_var
                AND company_id = request_record.company_id
                AND location_id IS NULL
              LIMIT 1;
              
              IF existing_qty IS NOT NULL THEN
                UPDATE inventory_items
                SET quantity = quantity + COALESCE((value_record->>'quantity')::INTEGER, 0),
                    last_updated = NOW()
                WHERE product_id = product_id_var
                  AND company_id = request_record.company_id
                  AND location_id IS NULL;
              ELSE
                INSERT INTO inventory_items (product_id, company_id, quantity, received_date)
                VALUES (
                  product_id_var,
                  request_record.company_id,
                  COALESCE((value_record->>'quantity')::INTEGER, 0),
                  NOW()
                );
              END IF;
            END LOOP;
          END LOOP;
        ELSE
          SELECT quantity INTO existing_qty
          FROM inventory_items
          WHERE product_id = product_id_var
            AND company_id = request_record.company_id
            AND location_id IS NULL
          LIMIT 1;
          
          IF existing_qty IS NOT NULL THEN
            UPDATE inventory_items
            SET quantity = quantity + COALESCE((product_record->>'quantity')::INTEGER, 0),
                last_updated = NOW()
            WHERE product_id = product_id_var
              AND company_id = request_record.company_id
              AND location_id IS NULL;
          ELSE
            INSERT INTO inventory_items (product_id, company_id, quantity, received_date)
            VALUES (
              product_id_var,
              request_record.company_id,
              COALESCE((product_record->>'quantity')::INTEGER, 0),
              NOW()
            );
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;