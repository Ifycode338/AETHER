-- Add video_url field to products table
-- This allows products to have associated video content

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN products.video_url IS 'URL to product video file (stored in Supabase Storage)';

-- Create index for faster queries if you plan to filter by video presence
-- CREATE INDEX IF NOT EXISTS idx_products_video_url ON products(video_url) WHERE video_url IS NOT NULL;