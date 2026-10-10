-- Debug script to check review table status

-- Check if reviews table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews'
ORDER BY ordinal_position;

-- Check if there are any reviews
SELECT COUNT(*) as total_reviews,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT product_id) as unique_products
FROM reviews;

-- Check product rating data
SELECT 
  id,
  name,
  average_rating,
  review_count
FROM products
WHERE review_count > 0 OR average_rating > 0
LIMIT 10;

-- Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'reviews';
