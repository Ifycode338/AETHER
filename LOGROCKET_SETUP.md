# LogRocket Session Replay Setup Guide

## ✅ What's Been Implemented

### **1. LogRocket SDK Installed**
- ✅ `logrocket` - Session recording and replay

### **2. LogRocket Configuration**
- ✅ `src/lib/logrocket.js` - LogRocket initialization and utilities
- ✅ Updated `App.jsx` - LogRocket initialization added
- ✅ Updated `AuthContext.jsx` - User context tracking added

---

## 🔧 Required Setup Steps

### **Step 1: Create LogRocket Account**

1. **Go to** https://app.logrocket.com
2. **Sign up** for a free account
3. **Create a new application:**
   - Application name: `BennyCare`
   - Framework: React
   - Environment: Production

### **Step 2: Get Your App ID**

1. **After creating the app**, LogRocket will show you the app ID
2. **Copy the app ID** - it looks like:
   ```
   bennycare/your-app-id
   ```

### **Step 3: Configure Environment Variable**

Add to your `.env.local` file:

```bash
# LogRocket Configuration
VITE_LOGROCKET_APP_ID=bennycare/your-app-id
```

### **Step 4: Test LogRocket Integration**

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Run the production build:**
   ```bash
   npm run preview
   ```

3. **Navigate the app** and perform some actions
4. **Check LogRocket dashboard** to see recorded sessions

---

## 🎯 Features Implemented

### **1. Session Recording**
- ✅ Records user sessions in production
- ✅ Captures console logs
- ✅ Captures network requests
- ✅ Captures DOM events
- ✅ Captures user interactions

### **2. Data Sanitization**
- ✅ Sanitizes password/email from auth requests
- ✅ Sanitizes credit card numbers from text
- ✅ Prevents sensitive data capture

### **3. User Context**
- ✅ Automatically tracks user ID on login
- ✅ Tracks user email
- ✅ Tracks user role
- ✅ Clears user context on logout

### **4. Custom Events**
- ✅ Track custom events
- ✅ Add properties to events
- ✅ Filter events in dashboard

---

## 📊 Using LogRocket in Your Code

### **Custom Event Tracking**

```javascript
import { trackEvent } from '@/lib/logrocket';

// Track payment success
trackEvent('payment_completed', {
  amount: 5000,
  payment_method: 'paystack',
  order_id: '12345'
});

// Track product view
trackEvent('product_viewed', {
  product_id: 'prod-123',
  product_name: 'Product Name',
  category: 'Health'
});

// Track admin action
trackEvent('product_updated', {
  product_id: 'prod-123',
  admin_id: 'admin-123'
});
```

### **Get Session URL**

```javascript
import { getSessionURL } from '@/lib/logrocket';

// Get the current session URL
const sessionURL = getSessionURL();
console.log('Session URL:', sessionURL);

// You can send this to support or save with error reports
```

### **Manual User Context**

```javascript
import { setLogRocketUser, clearLogRocketUser } from '@/lib/logrocket';

// Set user context manually
setLogRocketUser({
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin'
});

// Clear user context
clearLogRocketUser();
```

---

## 🔍 Viewing Sessions in LogRocket

1. **Go to** https://app.logrocket.com
2. **Select your app** (BennyCare)
3. **View Sessions** - See all recorded sessions
4. **Filter by** - User, events, errors, etc.
5. **Replay** - Watch session recordings
6. **Inspect** - View console logs, network requests, DOM events

---

## 📋 Production Checklist

Before deploying to production:

- [ ] Create LogRocket account and app
- [ ] Add app ID to `.env.local`
- [ ] Test session recording in development
- [ ] Test session recording in production
- [ ] Verify user context is working
- [ ] Verify data sanitization is working
- [ ] Set up custom events for key actions
- [ ] Configure team member access
- [ ] Set up alerts for errors
- [ ] Review privacy settings

---

## 🚀 Advanced Configuration

### **Privacy Settings**

Configure in LogRocket dashboard:
1. Go to Settings → Privacy
2. Enable/disable features:
   - Block certain URLs
   - Sanitize specific data
   - Mask sensitive inputs
   - Exclude certain elements

### **Team Access**

Add team members:
1. Go to Settings → Team
2. Invite team members
3. Set permissions:
   - View only
   - Full access
   - Admin

### **Integrations**

**LogRocket + Sentry Integration:**
```javascript
import LogRocket from 'logrocket';
import * as Sentry from '@sentry/react';

// Add LogRocket session URL to Sentry errors
Sentry.init({
  beforeSend(event, hint) {
    event.contexts = {
      ...event.contexts,
      logrocket: {
        sessionURL: LogRocket.sessionURL
      }
    };
    return event;
  }
});
```

---

## 💡 Best Practices

1. **Don't record sensitive data** - Use sanitizers
2. **Set appropriate recording rate** - Based on your traffic
3. **Use custom events** - Track key user actions
4. **Review sessions regularly** - Identify UX issues
5. **Set up filters** - Focus on important sessions
6. **Privacy first** - Get user consent if required

---

## 📈 Key Events to Track

### **Customer Events**
- `signup_completed` - User registration
- `login_completed` - User login
- `product_viewed` - Product page view
- `cart_item_added` - Item added to cart
- `checkout_started` - Checkout initiated
- `payment_completed` - Payment successful
- `order_placed` - Order confirmed

### **Admin Events**
- `product_created` - New product added
- `product_updated` - Product modified
- `order_status_updated` - Order status changed
- `discount_code_created` - Discount code added
- `low_stock_alert` - Stock threshold reached

### **Error Events**
- `payment_failed` - Payment error
- `checkout_error` - Checkout error
- `api_error` - API request failed
- `network_error` - Network connection issue

---

## 🔒 Privacy & Compliance

### **GDPR Compliance**
- LogRocket respects user consent
- Users can opt-out of recording
- Data can be deleted on request
- Session URLs can be shared safely

### **CCPA Compliance**
- California residents can opt-out
- Data can be deleted
- Right to know what's recorded

### **Data Retention**
- Sessions retained for 30 days (free tier)
- Upgrade for longer retention
- Can delete sessions manually

---

## 🎯 Use Cases

### **Debug User Issues**
- User reports a problem
- Find their session in LogRocket
- Replay exactly what they did
- Identify the root cause

### **Improve UX**
- Watch how users navigate
- Identify friction points
- Optimize user flows
- A/B test improvements

### **Support**
- Share session URL with support team
- See exactly what user experienced
- Resolve issues faster
- Reduce support tickets

---

**LogRocket is now integrated!** 🚀

Complete the setup steps above to enable session recording in production.
