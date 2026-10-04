-- Create wishlist table
-- This allows users to save products to their wishlist

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Add comments
COMMENT ON TABLE wishlist IS 'User wishlist for saving favorite products';
COMMENT ON COLUMN wishlist.user_id IS 'The user who owns this wishlist item';
COMMENT ON COLUMN wishlist.product_id IS 'The product that was wishlisted';

-- Enable RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Grant basic table permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE wishlist TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON wishlist;

-- User policies
CREATE POLICY "Users can view their own wishlist" ON wishlist
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to their own wishlist" ON wishlist
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from their own wishlist" ON wishlist
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_product ON wishlist(user_id, product_id);