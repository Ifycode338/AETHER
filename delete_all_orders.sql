-- DELETE ALL ORDERS - DESTRUCTIVE OPERATION
-- This will permanently delete all orders from the database
-- Run this in your Supabase SQL Editor

-- WARNING: This will delete ALL orders and cannot be undone!
-- Consider filtering by date or status instead if you only want to remove test orders

-- Option 1: Delete all orders (uncomment below to use)
DELETE FROM orders;

-- Option 2: Delete only test orders (orders created with test payment)
-- You can identify test orders by checking payment_reference or created_date
-- DELETE FROM orders WHERE payment_reference LIKE '%test%' OR payment_reference IS NULL;

-- Option 3: Delete orders by date range (example: last 24 hours)
-- DELETE FROM orders WHERE created_date >= NOW() - INTERVAL '24 hours';

-- Option 4: Delete only pending/cancelled orders
-- DELETE FROM orders WHERE status IN ('pending', 'cancelled');

-- To see what will be deleted before running, uncomment this:
SELECT id, customer_name, total, status, created_date FROM orders;
