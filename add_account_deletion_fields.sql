-- Add account deletion fields to profiles table
-- This allows soft deletion of user accounts

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for faster queries on deleted accounts
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted);

-- Add comment to document the soft deletion feature
COMMENT ON COLUMN profiles.is_deleted IS 'Soft delete flag - when true, account is marked as deleted and user cannot login';
COMMENT ON COLUMN profiles.deleted_at IS 'Timestamp when account was soft deleted';
