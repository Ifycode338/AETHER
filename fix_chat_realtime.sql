-- Fix Chat Real-time Functionality
-- Run this in your Supabase SQL Editor

-- Enable real-time for chat tables (ignore if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;

-- Ensure proper RLS policies for chat tables
DROP POLICY IF EXISTS "Anyone can create chat conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can view chat conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can update chat conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can create chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;

-- Chat conversations policies
CREATE POLICY "Anyone can create chat conversations" ON chat_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view chat conversations" ON chat_conversations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update chat conversations" ON chat_conversations
  FOR UPDATE USING (true);

-- Chat messages policies
CREATE POLICY "Anyone can create chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages" ON chat_messages
  FOR SELECT USING (true);

-- Grant necessary permissions
GRANT ALL ON chat_conversations TO authenticated;
GRANT ALL ON chat_conversations TO anon;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_messages TO anon;