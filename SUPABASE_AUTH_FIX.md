# Fix Supabase Auth 500 Error

## Issue
The Supabase auth endpoint is returning a 500 Internal Server Error during signup attempts.

## Root Cause
This is typically caused by misconfiguration in your Supabase project settings, specifically related to email confirmation or URL configuration.

## Steps to Fix

### 1. Check Email Confirmation Settings
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Settings**
3. Scroll to **"Email confirmation"** section
4. **Try both options**:
   - First, ensure "Enable email confirmations" is **ON**
   - If that doesn't work, try turning it **OFF** temporarily to test
5. Click **Save**

### 2. Configure Site URL and Redirect URLs
1. In the same **Authentication** > **Settings** page
2. Scroll to **"Site URL"** section
3. Set **Site URL** to: `http://localhost:5173`
4. Under **"Redirect URLs"**, add:
   - `http://localhost:5173/**`
   - `http://localhost:5173/auth/callback`
5. Click **Save**

### 3. Check Email Provider Configuration
1. Go to **Authentication** > **Providers** > **Email**
2. Ensure **"Enable Email provider"** is turned **ON**
3. Check **"Confirm email"** setting matches your preference
4. If using custom SMTP, verify the configuration is correct
5. Click **Save**

### 4. Check Project Status
1. Go to **Project Settings** > **General**
2. Ensure your project is **not paused**
3. Check if you've exceeded any free tier limits

### 5. Test the Configuration
After making changes:
1. Wait 1-2 minutes for changes to propagate
2. Go to `http://localhost:5173/debug` and run diagnostics again
3. Try signing up at `http://localhost:5173/register`

## Alternative: Temporarily Disable Email Confirmation
If you want to test signup without email confirmation:

1. In **Authentication** > **Settings**
2. Turn **OFF** "Enable email confirmations"
3. Update your Register.jsx to handle the different response:
   - When email confirmation is disabled, users get a session immediately
   - When enabled, users need to confirm email first

## Common Issues and Solutions

### Issue: "AuthRetryableFetchError"
- **Cause**: Network or server configuration issue
- **Solution**: Check Site URL and Redirect URLs configuration

### Issue: 500 error on signup
- **Cause**: Email provider misconfiguration or missing settings
- **Solution**: Verify email provider settings and SMTP configuration

### Issue: Permission denied on profiles table
- **Cause**: RLS policies blocking access
- **Solution**: Run the SQL script in `fix_profiles_rls.sql`

## Next Steps
1. Apply the SQL fix for profiles table RLS
2. Configure Supabase auth settings as described above
3. Test with the diagnostic tool
4. Try signup again