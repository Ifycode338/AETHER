-- Reset all product ratings to 0 since reviews table is empty
UPDATE products
SET 
  average_rating = 0,
  review_count = 0
WHERE average_rating > 0 OR review_count > 0;
