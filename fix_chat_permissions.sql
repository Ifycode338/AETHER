-- Fix Chat Tables RLS Policies for Deletion
-- This script grants delete permissions to authenticated users for chat tables

-- Enable RLS on chat tables if not already enabled
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "chat_conversations_select_policy" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_insert_policy" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_update_policy" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_delete_policy" ON chat_conversations;

DROP POLICY IF EXISTS "chat_messages_select_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_policy" ON chat_messages;

-- Create comprehensive policies for chat_conversations
CREATE POLICY "chat_conversations_select_policy" ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "chat_conversations_insert_policy" ON chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "chat_conversations_update_policy" ON chat_conversations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "chat_conversations_delete_policy" ON chat_conversations
  FOR DELETE
  TO authenticated
  USING (true);

-- Create comprehensive policies for chat_messages
CREATE POLICY "chat_messages_select_policy" ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "chat_messages_insert_policy" ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "chat_messages_update_policy" ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "chat_messages_delete_policy" ON chat_messages
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT DELETE ON chat_conversations TO authenticated;
GRANT DELETE ON chat_messages TO authenticated;

-- Verify permissions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('chat_conversations', 'chat_messages')
ORDER BY tablename, policyname;