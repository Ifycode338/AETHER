# Security & Authentication Documentation

## Overview

This document outlines the security measures implemented in the BennyCare/AETHER application to protect user data and prevent unauthorized access.

## Implemented Security Features

### 1. Password Reset Flow ✅

**Location:** `src/pages/ForgotPassword.jsx`, `src/pages/ResetPassword.jsx`

**Features:**
- Users can request password reset via email
- Secure password reset link with expiration
- Password strength validation (minimum 6 characters)
- Confirmation password matching
- Auto-redirect to login after successful reset

**Implementation:**
```javascript
// Request password reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});

// Update password
await supabase.auth.updateUser({ password });
```

**Supabase Configuration Required:**
- Enable email auth in Supabase dashboard
- Configure email templates for password reset
- Set appropriate email expiration time in Supabase settings

---

### 2. Email Verification Enhancement ✅

**Location:** `src/pages/Register.jsx`

**Features:**
- Email confirmation required for new registrations
- Resend verification email functionality
- Clear user feedback on verification status
- Graceful fallback if email confirmation is disabled

**Implementation:**
```javascript
// Resend verification email
await supabase.auth.resend({
  type: 'signup',
  email: userEmail,
  options: {
    emailRedirectTo: window.location.origin + '/login'
  }
});
```

**Supabase Configuration Required:**
- Enable email confirmation in Supabase Auth settings
- Configure email templates for email confirmation
- Set appropriate confirmation link expiration

---

### 3. Session Management with Timeout Warnings ✅

**Location:** `src/lib/AuthContext.jsx`, `src/components/SessionTimeoutWarning.jsx`

**Features:**
- 30-minute session timeout
- 5-minute warning before session expiration
- Visual countdown timer
- One-click session refresh
- Automatic sign-out on session expiration
- Session timeout persisted across page refreshes

**Configuration:**
```javascript
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING_MS = 5 * 60 * 1000; // 5 minutes before timeout
```

**Implementation:**
- Session timeout stored in localStorage
- Interval checks every minute for expiration
- Warning shown when < 5 minutes remaining
- User can dismiss warning or refresh session
- Automatic logout when timeout reached

---

### 4. Rate Limiting for Authentication ✅

**Location:** `src/lib/securityUtils.js`, `src/pages/Login.jsx`

**Features:**
- Maximum 5 failed login attempts
- 15-minute account lockout after max attempts
- Visual warning for remaining attempts
- Rate limit persisted across page refreshes
- Separate rate limits for different actions (login, register, etc.)

**Configuration:**
```javascript
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
```

**Implementation:**
```javascript
// Check rate limit before auth attempt
const rateLimitCheck = checkRateLimit('login');
if (!rateLimitCheck.allowed) {
  setError(rateLimitCheck.error);
  return;
}

// Record failed attempt
recordAttempt('login');

// Reset on successful login
resetRateLimit('login');
```

---

### 5. Security Headers Documentation ✅

**Location:** `src/lib/securityUtils.js`

**Recommended Headers:**
```javascript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}
```

**Implementation Notes:**
- These headers should be configured in your hosting/CDN
- Vite dev server: Configure in `vite.config.js` server options
- Production: Configure in web server (Nginx, Apache, etc.)
- Netlify/Vercel: Configure in `_headers` file or dashboard

**Vite Configuration Example:**
```javascript
// vite.config.js
export default {
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  }
}
```

**Netlify _headers File:**
```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## Additional Security Recommendations

### 1. Two-Factor Authentication (2FA)
- Already implemented using TOTP
- Encourage users to enable 2FA in profile settings
- Consider making 2FA mandatory for admin accounts

### 2. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Password strength indicator shown during registration

### 3. Environment Variables
- Never commit `.env.local` to version control
- Use different Supabase projects for development and production
- Rotate API keys regularly
- Use environment-specific configurations

### 4. Database Security
- Row Level Security (RLS) policies enabled
- Separate tables for sensitive data
- Regular database backups
- Audit logging for admin actions

### 5. API Security
- Validate all user inputs
- Sanitize data before database operations
- Use parameterized queries (Supabase handles this)
- Implement request size limits

### 6. HTTPS
- Enforce HTTPS in production
- Use HSTS headers
- Configure SSL certificates properly
- Redirect HTTP to HTTPS

---

## Supabase Security Configuration

### Auth Settings
1. **Email Confirmation:** Enable for production
2. **Phone Auth:** Disable if not needed
3. **Social Providers:** Configure carefully
4. **Session Duration:** Set appropriate timeout
5. **Email Templates:** Customize with your branding

### Database Policies
Review and enable appropriate RLS policies:
- `profiles` table
- `orders` table
- `chat_conversations` table
- `chat_messages` table
- `user_2fa` table
- `wishlist` table
- `discount_codes` table

### Storage Policies
Configure storage bucket policies:
- `product-images` bucket
- `product-videos` bucket
- `profile-images` bucket

---

## Monitoring and Logging

### Recommended Monitoring
- Failed login attempts
- Rate limit triggers
- Session timeouts
- Password reset requests
- Email verification failures

### Audit Logging
- Admin product changes
- Order status updates
- Discount code creation/deletion
- User profile changes

---

## Security Checklist

- [x] Password reset flow implemented
- [x] Email verification enhanced
- [x] Session timeout with warnings
- [x] Rate limiting for authentication
- [x] Security headers documented
- [ ] Configure security headers in hosting
- [ ] Enable email confirmation in Supabase
- [ ] Set up monitoring/alerts
- [ ] Regular security audits
- [ ] SSL/TLS configuration
- [ ] HSTS implementation
- [ ] CORS configuration
- [ ] CSP (Content Security Policy)

---

## Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Web Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [React Security Best Practices](https://react.dev/learn/keeping-components-pure)
