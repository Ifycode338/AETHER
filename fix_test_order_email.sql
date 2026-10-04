-- Fix test order email to match logged-in user
-- This is for testing purposes only

UPDATE orders 
SET customer_email = 'obimmaifeanyi82@gmail.com'
WHERE id = 'c3756d02-d225-4c94-a816-a466ecdaf096';
