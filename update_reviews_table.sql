-- Add average_rating column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE products ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE products ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create function to update product average rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE products
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE product_id = NEW.product_id
      ),
      review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE product_id = NEW.product_id
      )
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE product_id = OLD.product_id
      ),
      review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE product_id = OLD.product_id
      )
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_product_rating_on_insert ON reviews;
DROP TRIGGER IF EXISTS update_product_rating_on_update ON reviews;
DROP TRIGGER IF EXISTS update_product_rating_on_delete ON reviews;

-- Create triggers to update product rating when reviews change
CREATE TRIGGER update_product_rating_on_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER update_product_rating_on_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER update_product_rating_on_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Add title column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'title'
  ) THEN
    ALTER TABLE reviews ADD COLUMN title TEXT;
  END IF;
END $$;
