-- Create discount codes table
-- This allows admins to create and manage discount codes

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  max_uses INTEGER CHECK (max_uses > 0),
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE discount_codes IS 'Discount codes for customers to use during checkout';
COMMENT ON COLUMN discount_codes.code IS 'The discount code customers enter';
COMMENT ON COLUMN discount_codes.percentage IS 'Discount percentage (1-100)';
COMMENT ON COLUMN discount_codes.max_uses IS 'Maximum number of times this code can be used';
COMMENT ON COLUMN discount_codes.used_count IS 'Number of times this code has been used';
COMMENT ON COLUMN discount_codes.valid_from IS 'Start date for discount validity';
COMMENT ON COLUMN discount_codes.valid_until IS 'End date for discount validity';

-- Grant basic table permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE discount_codes TO authenticated;

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admins can insert discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admins can update discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admins can delete discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Public can validate discount codes" ON discount_codes;

-- Admin policies
CREATE POLICY "Admins can view all discount codes" ON discount_codes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert discount codes" ON discount_codes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update discount codes" ON discount_codes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete discount codes" ON discount_codes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Public policy for validating discount codes during checkout
CREATE POLICY "Public can validate discount codes" ON discount_codes
  FOR SELECT TO public
  USING (
    is_active = true 
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (max_uses IS NULL OR used_count < max_uses)
  );

-- Create index for faster code lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active) WHERE is_active = true;