-- Create 2FA table for Two-Factor Authentication
-- This stores TOTP secrets and enables/disables 2FA for users

CREATE TABLE IF NOT EXISTS user_2fa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Add comments
COMMENT ON TABLE user_2fa IS 'Two-Factor Authentication settings for users';
COMMENT ON COLUMN user_2fa.secret IS 'TOTP secret for authenticator apps';
COMMENT ON COLUMN user_2fa.enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN user_2fa.backup_codes IS 'Backup codes for account recovery';

-- Enable RLS
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;

-- Grant basic table permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE user_2fa TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON user_2fa;
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON user_2fa;
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON user_2fa;
DROP POLICY IF EXISTS "Users can delete their own 2FA settings" ON user_2fa;

-- User policies
CREATE POLICY "Users can view their own 2FA settings" ON user_2fa
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own 2FA settings" ON user_2fa
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own 2FA settings" ON user_2fa
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own 2FA settings" ON user_2fa
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON user_2fa(enabled) WHERE enabled = true;