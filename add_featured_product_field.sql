-- Add is_featured field to products table
-- This allows admins to control which products appear in the featured section

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add comment to document the field
COMMENT ON COLUMN products.is_featured IS 'Whether this product should appear in the featured section on the homepage';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;