# Sentry Error Tracking Setup Guide

## ✅ What's Been Implemented

### **1. Sentry SDK Installed**
- ✅ `@sentry/react` - React error tracking
- ✅ `@sentry/vite-plugin` - Vite build integration

### **2. Sentry Configuration Files**
- ✅ `src/lib/sentry.js` - Sentry initialization and utilities
- ✅ `src/lib/sentry.ts` - TypeScript version (for future migration)
- ✅ Updated `vite.config.js` - Sentry plugin configured
- ✅ Updated `App.jsx` - Sentry initialization added
- ✅ Updated `ErrorBoundary.jsx` - Sentry error reporting added
- ✅ Updated `errorHandler.ts` - Sentry integration added

---

## 🔧 Required Setup Steps

### **Step 1: Create Sentry Account**

1. **Go to** https://sentry.io
2. **Sign up** for a free account
3. **Create a new project:**
   - Platform: React
   - Project name: `bennycare`
   - Organization: Your organization name

### **Step 2: Get Your DSN**

1. **After creating the project**, Sentry will show you the DSN (Data Source Name)
2. **Copy the DSN** - it looks like:
   ```
   https://examplePublicKey@o0.ingest.sentry.io/0
   ```

### **Step 3: Configure Environment Variables**

Add to your `.env.local` file:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-dsn-here@o0.ingest.sentry.io/0
SENTRY_AUTH_TOKEN=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
```

**To get the auth token:**
1. Go to Sentry → Settings → Auth Tokens
2. Create a new token with `project:releases` scope
3. Copy the token

### **Step 4: Update vite.config.js**

Edit `vite.config.js` and replace the placeholder values:

```javascript
sentryVitePlugin({
  org: "your-actual-org-name", // Replace with your Sentry organization
  project: "bennycare", // Replace with your Sentry project name
  authToken: process.env.SENTRY_AUTH_TOKEN, // Already configured
}),
```

### **Step 5: Test Sentry Integration**

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Run the production build:**
   ```bash
   npm run preview
   ```

3. **Trigger an error** to test:
   - Open browser console
   - Run: `throw new Error('Test Sentry error')`
   - Check Sentry dashboard for the error

---

## 🎯 Features Implemented

### **1. Automatic Error Reporting**
- ✅ React component errors (via ErrorBoundary)
- ✅ Unhandled exceptions
- ✅ Network errors
- ✅ Authentication errors
- ✅ Validation errors

### **2. Session Replay**
- ✅ Captures 10% of sessions for replay
- ✅ Captures 100% of sessions with errors
- ✅ Helps debug user issues

### **3. Performance Monitoring**
- ✅ Tracks page load times
- ✅ Tracks API response times
- ✅ Identifies slow transactions

### **4. User Context**
- ✅ Automatically captures user ID when logged in
- ✅ Adds context to errors (file, function, etc.)
- ✅ Custom error tags for filtering

### **5. Error Filtering**
- ✅ Filters out "Failed to fetch" network errors
- ✅ Custom beforeSend logic for filtering
- ✅ Reduces noise in Sentry dashboard

---

## 📊 Using Sentry in Your Code

### **Custom Error Reporting**

```javascript
import { reportError, reportMessage } from '@/lib/sentry';

// Report an error
try {
  // Your code
} catch (error) {
  reportError(error, { context: 'CheckoutPage' });
}

// Report a message
reportMessage('Payment successful', 'info');
reportMessage('Low stock warning', 'warning');
reportMessage('Payment failed', 'error');
```

### **Performance Monitoring**

```javascript
import { startTransaction } from '@/lib/sentry';

const transaction = startTransaction('checkout-process');

try {
  // Your code
  transaction.finish();
} catch (error) {
  transaction.setStatus('internal_error');
  transaction.finish();
  throw error;
}
```

### **User Context**

```javascript
import { setUserContext, clearUserContext } from '@/lib/sentry';

// Set user context after login
setUserContext({
  id: user.id,
  email: user.email,
  username: user.full_name
});

// Clear user context after logout
clearUserContext();
```

---

## 🔍 Viewing Errors in Sentry

1. **Go to** https://sentry.io
2. **Select your project** (bennycare)
3. **View Issues** - See all errors grouped by type
4. **View Performance** - See slow transactions
5. **View Replays** - See session recordings

---

## 📋 Production Checklist

Before deploying to production:

- [ ] Create Sentry account and project
- [ ] Add DSN to `.env.local`
- [ ] Add auth token to `.env.local`
- [ ] Update `vite.config.js` with org name
- [ ] Test error reporting in development
- [ ] Test error reporting in production
- [ ] Verify session replay is working
- [ ] Verify performance monitoring is working
- [ ] Set up alerts for critical errors
- [ ] Configure release tracking

---

## 🚀 Advanced Configuration

### **Alerts**

Set up alerts in Sentry:
1. Go to Settings → Alerts
2. Create alerts for:
   - New issues
   - Error rate increase
   - Performance degradation
   - Session replay availability

### **Release Tracking**

Automatically track releases:
```bash
# Build with release info
SENTRY_RELEASE=v1.0.0 npm run build
```

### **Custom Tags**

Add custom tags to errors:
```javascript
Sentry.captureException(error, {
  tags: {
    feature: 'checkout',
    environment: 'production'
  }
});
```

---

## 💡 Best Practices

1. **Don't log sensitive data** - Sentry may capture request/response data
2. **Filter PII** - Use beforeSend to remove personal information
3. **Set appropriate sample rates** - Adjust based on your traffic
4. **Use breadcrumbs** - Track user actions before errors
5. **Monitor error rates** - Set up alerts for sudden increases

---

## 📈 Monitoring

### **Key Metrics to Track**

- **Error Rate** - Percentage of requests that fail
- **Crash Free Users** - Percentage of users without errors
- **Session Duration** - Average session length
- **Page Load Time** - Average page load performance
- **API Response Time** - Average API response time

### **Alerts to Set Up**

- **New Issues** - When a new error type appears
- **Error Rate Spike** - When error rate increases by 50%
- **Performance Degradation** - When page load time exceeds 3s
- **High Severity Errors** - All errors with level 'error'

---

**Sentry is now integrated!** 🚀

Complete the setup steps above to enable error tracking in production.
