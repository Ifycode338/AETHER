# Supabase Edge Function for FCM - Setup Guide

## ✅ What's Been Created

### **1. Edge Functions**
- ✅ `supabase/functions/send-notification/index.ts` - Send notification to single user
- ✅ `supabase/functions/send-notification/send-broadcast.ts` - Send to multiple users

### **2. Database Table**
- ✅ `create_fcm_tokens_table.sql` - Table to store user FCM tokens

### **3. Firebase Functions Updated**
- ✅ `sendTokenToBackend()` - Saves FCM token to database
- ✅ `sendPushNotification()` - Calls Edge Function to send notification
- ✅ `sendBroadcastNotification()` - Sends to multiple users
- ✅ `getUserFCMTokens()` - Gets tokens for a user

---

## 🔧 Setup Steps

### **Step 1: Create Database Table**

Run this SQL in Supabase SQL Editor:

```sql
-- File: create_fcm_tokens_table.sql
```

This creates the `user_fcm_tokens` table with RLS policies.

### **Step 2: Get Firebase Access Token**

Since the Legacy API is deprecated, we'll use the HTTP v1 API with an access token.

**Option A: Using gcloud CLI (Recommended)**

1. **Install gcloud CLI** if not already installed
   - Windows: https://cloud.google.com/sdk/docs/install#windows
   - Mac: `brew install google-cloud-sdk`
   - Linux: Follow instructions at https://cloud.google.com/sdk/docs/install#linux

2. **Authenticate with Google Cloud**
   ```bash
   gcloud auth login
   ```

3. **Set your project**
   ```bash
   gcloud config set project bennycare-app
   ```

4. **Generate an access token**
   ```bash
   gcloud auth print-access-token
   ```

5. **Copy the token** (it's a long string starting with `ya29...`)

**Option B: Using Google Cloud Console**

1. **Go to** https://console.cloud.google.com/apis/credentials
2. **Select your project:** bennycare-app
3. **Create an OAuth 2.0 Client ID** if you don't have one
4. **Use Google OAuth Playground** to get an access token:
   - Go to https://developers.google.com/oauthplayground
   - Select "Firebase Cloud Messaging API" scope
   - Authorize and exchange for access token

**Add to Supabase Environment:**
- Go to Supabase Dashboard → Edge Functions → Settings
- Add environment variable: `FIREBASE_ACCESS_TOKEN`
- Paste your access token
- Add environment variable: `FIREBASE_PROJECT_ID`
- Set to: `bennycare-app`

**Note:** Access tokens expire after 1 hour. You'll need to regenerate it periodically or set up automated token refresh.

### **Step 3: Deploy Edge Functions**

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref chlfmkeplogbkornbwqc

# Deploy functions
supabase functions deploy

# Set environment variables
supabase secrets set FIREBASE_ACCESS_TOKEN your-ya29-access-token-here
supabase secrets set FIREBASE_PROJECT_ID bennycare-app
```

**Option B: Using Supabase Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Click "New Function"
3. Create function named `send-notification`
4. Copy content from `supabase/functions/send-notification/index.ts`
5. Create function named `send-broadcast`
6. Copy content from `supabase/functions/send-notification/send-broadcast.ts`
7. Add environment variables in Edge Functions → Settings:
   - `FIREBASE_ACCESS_TOKEN`: your access token
   - `FIREBASE_PROJECT_ID`: `bennycare-app`

### **Step 4: Test Edge Function**

**Test single notification:**
```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "USER_FCM_TOKEN",
    "title": "Test Notification",
    "body": "This is a test from BennyCare",
    "data": {
      "url": "/order/123"
    }
  }'
```

---

## 🎯 How to Use in Your App

### **Send Notification to Single User**

```javascript
import { sendPushNotification, getUserFCMTokens } from '@/lib/firebase';

// Get user's FCM tokens
const tokens = await getUserFCMTokens(userId);

// Send notification
if (tokens.length > 0) {
  await sendPushNotification(tokens[0], 'Order Shipped', 'Your order #123 has been shipped!', {
    type: 'order',
    orderId: '123',
    url: '/order/123'
  });
}
```

### **Send Notification to All Users**

```javascript
import { sendBroadcastNotification } from '@/lib/firebase';

// Get all users' tokens (you'll need to create this function)
const allTokens = await getAllUserFCMTokens();

// Send broadcast
await sendBroadcastNotification(allTokens, 'Sale Alert', '50% off all products!', {
  type: 'promotion',
  url: '/shop'
});
```

---

## 📋 Integration Points

### **1. Admin Order Status Update**

Update `src/pages/admin/Orders.jsx`:

```javascript
import { sendPushNotification, getUserFCMTokens } from '@/lib/firebase';

// When admin updates order status
const handleStatusUpdate = async (orderId, newStatus) => {
  // Update order in database
  await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  
  // Get order
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  
  // Get customer's FCM tokens
  const tokens = await getUserFCMTokens(order.user_id);
  
  // Send notification
  if (tokens.length > 0) {
    await sendPushNotification(tokens[0], 'Order Status Updated', 
      `Your order #${orderId.slice(0, 8)} status is now ${newStatus}`, {
        type: 'order',
        orderId,
        url: `/order/${orderId}`
      });
  }
  
  // Also create database notification
  await supabase.from('notifications').insert({
    user_id: order.user_id,
    title: 'Order Status Updated',
    body: `Your order #${orderId.slice(0, 8)} status is now ${newStatus}`,
    type: 'order',
    link: `/order/${orderId}`,
    read: false
  });
};
```

### **2. Low Stock Alert**

Update `src/pages/admin/Dashboard.jsx`:

```javascript
import { sendBroadcastNotification } from '@/lib/firebase';

// When stock is low
const handleLowStock = async (product) => {
  // Get all admin tokens (you'll need to implement this)
  const adminTokens = await getAdminFCMTokens();
  
  // Send notification to all admins
  await sendBroadcastNotification(adminTokens, 'Low Stock Alert', 
    `${product.name} has only ${product.stock} items left!`, {
      type: 'low_stock',
      productId: product.id,
      url: '/admin/products'
  });
};
```

---

## 🔒 Security Notes

### **1. Server Key Protection**
- ✅ Server key stored in Supabase Edge Function environment
- ✅ Never exposed to frontend
- ✅ Accessible only to Edge Functions

### **2. RLS Policies**
- ✅ Users can only see their own tokens
- ✅ Service role has full access
- ✅ Tokens are unique per user per device

### **3. CORS**
- ✅ CORS headers configured in Edge Functions
- ✅ Allows requests from your domain
- ✅ Prevents unauthorized access

---

## 🧪 Testing

### **Test 1: Token Registration**
1. Open app
2. Allow notification permission
3. Check console for "FCM Token: [token]"
4. Check console for "FCM token saved successfully"
5. Verify token in Supabase database

### **Test 2: Send Notification**
1. Get FCM token from database
2. Use curl to test Edge Function
3. Check if notification appears on device
4. Test both foreground and background

### **Test 3: Admin Order Update**
1. Log in as admin
2. Update an order status
3. Check if customer receives push notification
4. Verify notification works when app is closed

---

## 📊 Monitoring

### **Supabase Dashboard**
- Go to Edge Functions → Logs
- View function execution logs
- Monitor performance
- Check error rates

### **Firebase Console**
- Go to Cloud Messaging
- View delivery reports
- Monitor message statistics
- Analyze engagement

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Create `user_fcm_tokens` table in Supabase
- [ ] Add FCM_SERVER_KEY to Supabase Edge Functions environment
- [ ] Deploy Edge Functions to Supabase
- [ ] Test single notification function
- [ ] Test broadcast notification function
- [ ] Integrate with admin order status update
- [ ] Integrate with low stock alerts
- [ ] Test on multiple devices
- [ ] Test background notifications
- [ ] Verify token registration works

---

## 💡 Next Steps

After this is set up:

1. **Add "Send Notification" button** to admin panel for testing
2. **Create function to get all admin tokens** for broadcasts
3. **Add notification preferences** to user settings
4. **Implement notification scheduling** (e.g., daily summaries)
5. **Add notification analytics** (open rates, click rates)

---

## 📚 API Reference

### **Single Notification Endpoint**

**URL:** `/functions/v1/send-notification`

**Method:** POST

**Body:**
```json
{
  "token": "USER_FCM_TOKEN",
  "title": "Notification Title",
  "body": "Notification body text",
  "data": {
    "url": "/order/123",
    "type": "order"
  }
}
```

### **Broadcast Notification Endpoint**

**URL:** `/functions/v1/send-notification/send-broadcast`

**Method:** POST

**Body:**
```json
{
  "tokens": ["TOKEN1", "TOKEN2", "TOKEN3"],
  "title": "Broadcast Title",
  "body": "Broadcast body text",
  "data": {
    "url": "/shop",
    "type": "promotion"
  }
}
```

---

**The Edge Function setup is complete!** 🚀

Follow the setup steps above to deploy the functions and enable real push notifications in your BennyCare app.
