-- Add user_id column to orders table
-- This links orders to authenticated users instead of just emails

-- Add user_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN orders.user_id IS 'The authenticated user ID who placed this order (null for guest orders)';

-- Update existing orders to link to users by email (if matching user exists)
UPDATE orders 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = orders.customer_email
  LIMIT 1
)
WHERE user_id IS NULL;
