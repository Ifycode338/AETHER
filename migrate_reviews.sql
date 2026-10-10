-- Migrate old reviews to new schema format
-- This converts old reviews that stored user_name to use proper foreign keys

-- First, check if there are any old-style reviews
DO $$
BEGIN
  -- Add a temporary column to store user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update reviews that have user_name but no user_id
-- This attempts to match user_name (which contains email) to auth.users
UPDATE reviews r
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = r.user_name
  LIMIT 1
)
WHERE r.user_id IS NULL AND r.user_name IS NOT NULL;

-- Drop the old user_name column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'user_name'
  ) THEN
    ALTER TABLE reviews DROP COLUMN user_name;
  END IF;
END $$;

-- Update the created_at column name if it was created_date
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'created_date'
  ) THEN
    ALTER TABLE reviews RENAME COLUMN created_date TO created_at;
  END IF;
END $$;

-- Recalculate all product ratings
UPDATE products p
SET 
  average_rating = (
    SELECT COALESCE(AVG(r.rating), 0)
    FROM reviews r
    WHERE r.product_id = p.id
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.product_id = p.id
  );
