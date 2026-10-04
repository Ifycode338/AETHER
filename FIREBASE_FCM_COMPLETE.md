# Firebase Cloud Messaging (FCM) Complete Setup Guide

## ✅ What's Been Implemented

### **1. Firebase SDK**
- ✅ Firebase Web SDK installed
- ✅ Firebase configuration added to `src/lib/firebase.js`
- ✅ Firebase messaging service worker created

### **2. FCM Integration**
- ✅ Service worker for background messages (`public/firebase-messaging-sw.js`)
- ✅ Foreground message listener
- ✅ Notification permission request
- ✅ FCM token generation and storage
- ✅ Integration with notification context

### **3. Notification Context Updates**
- ✅ Firebase event listener added
- ✅ Custom event handling for Firebase notifications
- ✅ Toast notifications for Firebase messages
- ✅ URL navigation on notification click

---

## 🔧 Required Setup Steps

### **Step 1: Firebase Console Configuration**

**Your Firebase project is already configured:**
- Project: bennycare-app
- API Key: Configured
- VAPID Key: Configured

**Verify Cloud Messaging is enabled:**
1. Go to https://console.firebase.google.com
2. Select your project: bennycare-app
3. Go to Project Settings → Cloud Messaging
4. Verify the Web Push Certificate is configured
5. Copy the VAPID key (already in your code)

### **Step 2: Enable Realtime Notifications (Database)**

**In Supabase Dashboard:**
1. Go to Database → Replication
2. Click "Realtime" tab
3. Enable Realtime for `notifications` table
4. Click "Save"

### **Step 3: Build and Test**

```bash
npm run build
npm run preview
```

### **Step 4: Test FCM**

**In Development:**
1. Open browser console
2. Check for: "Notification permission granted"
3. Check for: "FCM Token: [token]"
4. Copy the FCM token

**In Production:**
- FCM only initializes in production mode
- To test in dev, temporarily change `src/lib/firebase.js` line 4:
  ```javascript
  if (import.meta.env.PROD || true) { // Force for testing
  ```

---

## 🎯 How FCM Works

### **Foreground Notifications (App Open)**
1. User has app open
2. Firebase message arrives
3. `onMessageListener` catches it
4. Custom event dispatched
5. Notification context adds it to state
6. Toast notification appears
7. Notification center updates

### **Background Notifications (App Closed/Minimized)**
1. App is closed or minimized
2. Firebase message arrives
3. Service worker (`firebase-messaging-sw.js`) handles it
4. System notification shown
5. User clicks notification
6. App opens to specified URL

---

## 📊 Backend Integration Required

### **Option 1: Supabase Edge Function (Recommended)**

Create a Supabase Edge Function to send FCM notifications:

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { token, title, body, data } = await req.json()
  
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body },
      data: data || {}
    })
  })
  
  return response.json()
})
```

### **Option 2: Use Firebase Admin SDK**

Set up a Node.js server with Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const sendNotification = async (token, title, body, data = {}) => {
  const message = {
    token,
    notification: { title, body },
    data
  };

  await admin.messaging().send(message);
};
```

### **Option 3: Use Third-Party Service**

Use services like:
- OneSignal
- Pusher Beams
- Amazon SNS

---

## 📋 Store FCM Tokens in Database

Create a table to store user FCM tokens:

```sql
CREATE TABLE user_fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

-- Enable RLS
ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tokens
CREATE POLICY "Users can view own tokens"
  ON user_fcm_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert own tokens"
  ON user_fcm_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update own tokens"
  ON user_fcm_tokens FOR UPDATE
  USING (auth.uid() = user_id);
```

Update `src/lib/firebase.js` to save token:

```javascript
export const sendTokenToBackend = async (token) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    await supabase.from('user_fcm_tokens').upsert({
      user_id: user.id,
      fcm_token: token,
      device_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      },
      updated_at: new Date().toISOString()
    });
  }
};
```

---

## 🧪 Testing FCM

### **Test 1: Permission Request**
1. Open the app
2. Check browser console for permission request
3. Allow notification permission
4. Check for FCM token in console

### **Test 2: Send Test Notification**

**Using Firebase Console:**
1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter FCM token (from console)
4. Send test notification
5. Check if notification appears

**Using cURL:**
```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "YOUR_FCM_TOKEN",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test from BennyCare"
    },
    "data": {
      "url": "/order/123"
    }
  }'
```

### **Test 3: Background Notification**
1. Close the app
2. Send notification via Firebase Console
3. Check system notification
4. Click notification
5. Verify app opens to correct URL

---

## 🎯 Notification Types

### **Order Notifications**
```javascript
{
  title: "Order Status Updated",
  body: "Your order #123 status has been updated to shipped",
  data: {
    type: "order",
    orderId: "123",
    url: "/order/123"
  }
}
```

### **Low Stock Alerts (Admin)**
```javascript
{
  title: "Low Stock Alert",
  body: "Product XYZ has only 5 items left",
  data: {
    type: "low_stock",
    productId: "prod-123",
    url: "/admin/products"
  }
}
```

### **New Order (Admin)**
```javascript
{
  title: "New Order Received",
  body: "Order #456 from customer@example.com",
  data: {
    type: "new_order",
    orderId: "456",
    url: "/admin/orders"
  }
}
```

### **Promotional (Customer)**
```javascript
{
  title: "Special Offer!",
  body: "Get 20% off on all health products",
  data: {
    type: "promotion",
    url: "/shop"
  }
}
```

---

## 🔒 Security Considerations

### **1. Server Key Protection**
- Never expose FCM server key in frontend code
- Store in environment variables or Edge Function secrets
- Rotate keys regularly

### **2. Token Validation**
- Validate FCM tokens before storing
- Remove invalid/expired tokens
- Implement token refresh logic

### **3. User Consent**
- Always request permission
- Allow users to opt-out
- Respect Do Not Track settings

### **4. Data Privacy**
- Don't send sensitive data in notifications
- Sanitize notification content
- Follow GDPR/CCPA guidelines

---

## 📱 PWA Integration

FCM works seamlessly with PWA:
- Service workers coexist (PWA + FCM)
- Both run in background
- No conflicts expected
- Offline support maintained

---

## 🚀 Production Deployment

### **Before Deploying:**
- [ ] Test FCM in production environment
- [ ] Set up backend for sending notifications
- [ ] Implement token storage in database
- [ ] Test background notifications
- [ ] Test on mobile devices
- [ ] Verify service worker registration

### **After Deploying:**
- [ ] Monitor FCM delivery rates
- [ ] Track token registration
- [ ] Set up error alerts
- [ ] Optimize notification content
- [ ] A/B test notification timing

---

## 💡 Best Practices

1. **Batch Notifications** - Group similar notifications
2. **Rate Limiting** - Don't spam users
3. **Time Zones** - Send at appropriate times
4. **Localization** - Support multiple languages
5. **Analytics** - Track open rates, click rates
6. **A/B Testing** - Test different messages
7. **Quiet Hours** - Respect user preferences

---

## 📊 Monitoring

### **Key Metrics**
- Delivery rate
- Open rate
- Click rate
- Opt-out rate
- Error rate

### **Firebase Console**
- Go to Firebase Console → Cloud Messaging
- View delivery reports
- Monitor message statistics
- Analyze engagement

---

**Firebase FCM is now integrated!** 🚀

The foundation is in place. To enable actual push notifications, you need to:
1. Set up a backend service (Edge Function or Firebase Admin SDK)
2. Store FCM tokens in the database
3. Implement notification sending logic
4. Test end-to-end

For now, the app is ready to receive FCM notifications once the backend is configured.
