-- Fix permissions for order_status_log table
-- This table is used by the order status trigger

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS order_status_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own order status logs" ON order_status_log;
DROP POLICY IF EXISTS "Users can insert order status logs" ON order_status_log;
DROP POLICY IF EXISTS "Admins can manage order status logs" ON order_status_log;

-- Create permissive policies for development
CREATE POLICY "Enable all access for order_status_log" ON order_status_log
  FOR ALL USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON order_status_log TO authenticated;
GRANT ALL ON order_status_log TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
