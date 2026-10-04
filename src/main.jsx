import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from '@/App.jsx'
import '@/index.css'
import { registerSW } from 'virtual:pwa-register'
import { initMobileOptimizations } from '@/lib/mobileUtils'
import { initKeyboardNavigation } from '@/lib/keyboardUtils'
import { requestNotificationPermission } from '@/lib/firebase'

// Initialize mobile optimizations
initMobileOptimizations()

// Initialize keyboard navigation improvements
initKeyboardNavigation()

// Request notification permission
if ('Notification' in window) {
  requestNotificationPermission().then(token => {
    if (token) {
      console.log('FCM Token obtained:', token);
      // In production, send this token to your backend
      // to store it for sending push notifications
    }
  });
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      // Show a notification to the user that a new version is available
      if (confirm('A new version of BennyCare is available. Would you like to update?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App is ready to work offline');
    },
    onRegistered(registration) {
      console.log('Service worker registered:', registration);
      
      // Register Firebase messaging service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('Firebase messaging service worker registered:', registration);
          })
          .catch((error) => {
            console.error('Firebase messaging service worker registration failed:', error);
          });
      }
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
)