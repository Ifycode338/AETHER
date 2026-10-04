-- Create storage bucket for product videos
-- Run this in Supabase SQL editor

INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Grant public access to videos
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'product-videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated Upload" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'product-videos');

-- Allow users to delete their own videos
CREATE POLICY "Authenticated Delete" ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'product-videos');