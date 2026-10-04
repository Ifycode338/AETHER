import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtIVu4NSc2wgubzrBIJ3QXYVlfjOh5G2o",
  authDomain: "bennycare-app.firebaseapp.com",
  projectId: "bennycare-app",
  storageBucket: "bennycare-app.firebasestorage.app",
  messagingSenderId: "16158426039",
  appId: "1:16158426039:web:63db74305226356dfe1e32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'BennyCare';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data,
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);
  
  event.notification.close();
  
  // Handle notification click
  if (event.notification.data) {
    const url = event.notification.data.url || '/';
    event.waitUntil(
      clients.openWindow(url, '_blank')
    );
  }
});
