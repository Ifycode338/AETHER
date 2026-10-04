-- Create a function to handle order status updates and send email notifications
-- This function will be called when order status changes

CREATE OR REPLACE FUNCTION handle_order_status_update()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
BEGIN
  -- Get the order details
  SELECT * INTO order_record
  FROM orders
  WHERE id = NEW.id;

  -- Note: Email sending should be handled by the application
  -- This trigger can be used for logging or other database-level actions
  
  -- Log the status change (optional)
  INSERT INTO order_status_log (order_id, old_status, new_status, changed_at)
  VALUES (NEW.id, OLD.status, NEW.status, NOW())
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create order status log table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_status_log (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_status_log_order_id ON order_status_log(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_log_changed_at ON order_status_log(changed_at DESC);

-- Create trigger to call the function
DROP TRIGGER IF EXISTS on_order_status_update ON orders;
CREATE TRIGGER on_order_status_update
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_status_update();

-- Add comment to document the trigger
COMMENT ON FUNCTION handle_order_status_update() IS 'Handles order status updates - email notifications are sent by the application';
