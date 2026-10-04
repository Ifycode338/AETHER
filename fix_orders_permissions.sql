-- Emergency Fix for Orders Table Permissions
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to ensure access
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Then re-enable it with permissive policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
DROP POLICY IF EXISTS "Public can view orders" ON orders;

-- Create very permissive policies for development
CREATE POLICY "Enable all access for orders" ON orders
  FOR ALL USING (true)
  WITH CHECK (true);

-- Grant explicit permissions
GRANT ALL ON orders TO authenticated;
GRANT ALL ON orders TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;