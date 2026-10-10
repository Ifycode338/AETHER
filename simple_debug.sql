-- Simplified debug - all in one query
SELECT 
  'table_exists' as check_type,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN 'yes' ELSE 'no' END as result
UNION ALL
SELECT 
  'review_count' as check_type,
  COUNT(*)::text as result
FROM reviews
UNION ALL
SELECT 
  'has_user_id' as check_type,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'user_id') THEN 'yes' ELSE 'no' END as result
UNION ALL
SELECT 
  'has_title' as check_type,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'title') THEN 'yes' ELSE 'no' END as result
UNION ALL
SELECT 
  'has_user_name' as check_type,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'user_name') THEN 'yes' ELSE 'no' END as result
UNION ALL
SELECT 
  'product_ratings' as check_type,
  COUNT(*)::text as result
FROM products
WHERE average_rating > 0 OR review_count > 0;
