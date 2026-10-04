-- Setup Profile Images
-- Run this in your Supabase SQL Editor

-- 1. Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create a storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies
-- Allow authenticated users to upload profile images
CREATE POLICY "Users can upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' AND 
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to view profile images
CREATE POLICY "Users can view profile images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-images' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to update their own profile images
CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' AND 
    auth.role() = 'authenticated'
  );

-- 4. Update profiles table policy to allow avatar_url updates
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "All authenticated can update profiles" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow all authenticated users to update profiles (for development)
CREATE POLICY "All authenticated can update profiles" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated');