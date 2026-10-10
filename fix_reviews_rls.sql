-- Fix RLS policies for reviews table - More permissive
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- Create new policies - very permissive for testing
-- Policy: Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can update reviews
CREATE POLICY "Authenticated users can update reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can delete reviews
CREATE POLICY "Authenticated users can delete reviews"
  ON reviews FOR DELETE
  USING (auth.uid() IS NOT NULL);
