-- Create or Update Admin Account
-- This script helps you create a dedicated admin account or update an existing account to admin role

-- Option 1: Create a new admin account (recommended)
-- Replace the email and password with your desired admin credentials
-- Then run this in Supabase SQL Editor

-- Step 1: Sign up the user (this will create the user in auth.users)
-- NOTE: You can also do this through the Supabase Dashboard → Authentication → Users
-- Or use the signup form in your app first, then run Step 2

-- Step 2: Update the user's profile to have admin role
-- Replace 'admin@bennycare.com' with the email you used
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@bennycare.com';

-- Step 3: Verify the admin role was set
SELECT id, email, role, full_name 
FROM profiles 
WHERE email = 'admin@bennycare.com';

-- Alternative: Update by user ID (if you know the user ID)
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = 'YOUR_USER_ID_HERE';

-- To see all users and their current roles:
SELECT id, email, role, full_name, created_at 
FROM profiles 
ORDER BY created_at DESC;
