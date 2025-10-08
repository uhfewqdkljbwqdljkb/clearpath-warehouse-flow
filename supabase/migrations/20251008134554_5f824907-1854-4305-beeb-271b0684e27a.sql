-- Add quantity column to client_products table
ALTER TABLE client_products 
ADD COLUMN quantity integer NOT NULL DEFAULT 0;