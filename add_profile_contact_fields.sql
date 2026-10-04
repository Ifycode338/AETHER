-- Add phone and address fields to profiles table
-- This allows users to store additional contact information

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comments to document the fields
COMMENT ON COLUMN profiles.phone IS 'User phone number for contact and delivery';
COMMENT ON COLUMN profiles.address IS 'User physical address for delivery';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;