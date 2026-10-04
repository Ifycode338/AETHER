-- Update order email to match logged-in user for testing
-- This updates ALL orders to use your logged-in email

UPDATE orders 
SET customer_email = 'obimmaifeanyi82@gmail.com'
WHERE customer_email != 'obimmaifeanyi82@gmail.com';
