# Firebase Cloud Messaging Setup Guide

## 📱 Firebase Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "bennycare-app")
4. Follow the setup wizard
5. Enable Google Analytics (optional but recommended)

### Step 2: Get Firebase Configuration

1. In Firebase Console, click the gear icon (Project Settings)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register the app (name it "BennyCare Web")
5. Copy the Firebase config object

### Step 3: Enable Cloud Messaging

1. In Firebase Console, go to "Cloud Messaging" (under Build)
2. Click "Get Started"
3. Copy the Server Key and Sender ID

### Step 4: Update Configuration

Replace the placeholder values in `src/lib/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",           // From Firebase Console
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",              // From Firebase Console
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // From Firebase Console
  appId: "YOUR_APP_ID"                       // From Firebase Console
};
```

And the VAPID key:

```javascript
const token = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY' // From Firebase Console → Project Settings → Cloud Messaging
});
```

### Step 5: Backend Setup (for Production)

For production notifications, you need to set up a backend server using Firebase Admin SDK:

**Node.js Example:**
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function sendNotification(token, title, body, data) {
  const message = {
    notification: { title, body },
    data,
    token
  };

  await admin.messaging().send(message);
}
```

**Download Service Account Key:**
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `service-account.json` (keep this secret!)

### Step 6: Test Notifications

The current implementation uses local notifications (toasts) for testing. Once Firebase is configured:

1. Update the Firebase config in `src/lib/firebase.js`
2. Test the notification system:
   - Place an order → Customer gets notification
   - Check admin dashboard → Low stock notifications
   - Update order status → Customer gets notification

## 🎯 Current Notification Events

### 1. Order Confirmation
- **Trigger:** Successful payment
- **Recipient:** Customer
- **Message:** "Order Confirmed! Your order #XXX has been placed successfully."

### 2. Low Stock Alert
- **Trigger:** Stock drops to ≤ 5
- **Recipient:** Admin
- **Message:** "Low Stock Alert - X products running low on stock"

### 3. New Order (Planned)
- **Trigger:** New order placed
- **Recipient:** Admin
- **Message:** "New Order #XXX received"

### 4. Order Status Update (Planned)
- **Trigger:** Order status changes
- **Recipient:** Customer
- **Message:** "Order status updated to [status]"

### 5. Marketing/Promotions (Planned)
- **Trigger:** Admin sends promotion
- **Recipient:** All customers or specific segment
- **Message:** Custom promotional message

## 🔧 Mobile/APK Setup

For APK notifications, you also need to set up Firebase for Android:

1. In Firebase Console, add an Android app
2. Download `google-services.json`
3. Place it in your Android project (if using Capacitor/React Native)
4. Configure the native notification plugin

## 📊 Monitoring

Firebase Console provides:
- Delivery analytics
- Open rates
- Click rates
- Device engagement
- A/B testing

## 🚀 Next Steps

1. Complete Firebase setup
2. Update configuration files
3. Set up backend server for production
4. Test all notification events
5. Monitor delivery in Firebase Console
