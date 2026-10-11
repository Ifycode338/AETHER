import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import App from '@/App.jsx';
import '@/index.css';
import { registerSW } from 'virtual:pwa-register';
import { initMobileOptimizations } from '@/lib/mobileUtils';
import { initKeyboardNavigation } from '@/lib/keyboardUtils';
import { requestNotificationPermission } from '@/lib/firebase';

// Initialize mobile optimizations
initMobileOptimizations();

// Initialize keyboard navigation
initKeyboardNavigation();

// Request notification permission
if ('Notification' in window) {
  requestNotificationPermission()
    .then((token) => {
      if (token) {
        console.log('FCM Token obtained:', token);
      }
    })
    .catch((error) => {
      console.error(
        'Notification permission request failed:',
        error
      );
    });
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,

    onNeedRefresh() {
      const shouldUpdate = window.confirm(
        'A new version of BennyCare is available. Would you like to update?'
      );

      if (shouldUpdate) {
        // Activate the new service worker and reload the page
        updateSW(true);
      }
    },

    onOfflineReady() {
      console.log('BennyCare is ready to work offline.');
    },

    onRegistered(registration) {
      console.log(
        'BennyCare service worker registered:',
        registration
      );

      // Register Firebase messaging service worker
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((firebaseRegistration) => {
          console.log(
            'Firebase messaging service worker registered:',
            firebaseRegistration
          );
        })
        .catch((error) => {
          console.error(
            'Firebase messaging service worker registration failed:',
            error
          );
        });
    },

    onRegisterError(error) {
      console.error(
        'PWA service worker registration failed:',
        error
      );
    },
  });
}

// Render BennyCare
ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
  >
    <App />
  </ThemeProvider>
);