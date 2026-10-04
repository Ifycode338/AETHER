-- Fix Wishlist RLS Policies
-- This ensures proper permissions for wishlist operations

-- Revoke existing permissions
REVOKE ALL ON TABLE wishlist FROM authenticated;
REVOKE ALL ON TABLE wishlist FROM anon;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON TABLE wishlist TO authenticated, anon;
GRANT INSERT ON TABLE wishlist TO authenticated;
GRANT UPDATE ON TABLE wishlist TO authenticated;
GRANT DELETE ON TABLE wishlist TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON wishlist;

-- Create new policies with explicit checks
CREATE POLICY "Users can view their own wishlist" ON wishlist
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist" ON wishlist
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist" ON wishlist
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
