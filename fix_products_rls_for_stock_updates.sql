-- Fix products table RLS to allow stock updates
-- This fixes the 406 error when reducing stock after payment

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Enable all access for products" ON products;

-- Create permissive policies for development
CREATE POLICY "Enable read access for products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for products" ON products
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for products" ON products
  FOR DELETE USING (true);

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON products TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
