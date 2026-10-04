-- Add missing discount and shipping fields to orders table
-- This fixes the PGRST204 error when creating orders

-- Add discount_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add discount_code column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'discount_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_code TEXT;
  END IF;
END $$;

-- Add shipping_rate column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'shipping_rate'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_rate DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add subtotal column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add payment_reference column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_reference TEXT;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN orders.discount_amount IS 'The discount amount applied to the order';
COMMENT ON COLUMN orders.discount_code IS 'The discount code used for this order';
COMMENT ON COLUMN orders.shipping_rate IS 'The shipping rate charged for this order';
COMMENT ON COLUMN orders.subtotal IS 'The subtotal before discount and shipping';
COMMENT ON COLUMN orders.payment_reference IS 'The Paystack payment reference/transaction ID';
