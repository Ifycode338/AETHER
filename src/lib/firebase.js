import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { supabase } from '@/api/supabaseClient';

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
const functions = getFunctions(app);

// Store FCM token locally
let currentFCMToken = localStorage.getItem('fcm_token');

// Request notification permission and get token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      const token = await getToken(messaging, {
        vapidKey: 'BBMyw9jARz-atm8GvxQqrPaSLbhOhehCQDZ9u8zFfXpx0Frv-8Rwb6VlSKW_I_ta8EFmfvCa_wuIqk4mHBIihis'
      });
      
      console.log('FCM Token:', token);
      currentFCMToken = token;
      localStorage.setItem('fcm_token', token);
      
      // Send token to backend
      await sendTokenToBackend(token);
      
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Get current FCM token
export const getFCMToken = () => {
  return currentFCMToken || localStorage.getItem('fcm_token');
};

// Listen for incoming messages (foreground)
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Firebase message received:', payload);
      
      // Show in-app notification using the notification context
      // The notification will appear in the notification center
      if (payload.notification) {
        const { title, body } = payload.notification;
        // Dispatch custom event for notification context
        window.dispatchEvent(new CustomEvent('firebase-notification', {
          detail: {
            title,
            body,
            url: payload.data?.url
          }
        }));
      }
      
      resolve(payload);
    });
  });
};

// Send FCM token to backend
export const sendTokenToBackend = async (token) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase.from('user_fcm_tokens').upsert({
        user_id: user.id,
        fcm_token: token,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        },
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error saving FCM token:', error);
      } else {
        console.log('FCM token saved successfully');
      }
    }
  } catch (error) {
    console.error('Error sending token to backend:', error);
  }
};

// Call Firebase Cloud Function to send notification
export const sendPushNotification = async (token, title, body, data = {}) => {
  try {
    const sendNotificationFn = httpsCallable(functions, 'sendNotification');
    const result = await sendNotificationFn({
      token,
      title,
      body,
      url: data?.url
    });
    
    console.log('Notification sent successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

// Send broadcast notification to multiple users via Firebase Cloud Function
export const sendBroadcastNotification = async (tokens, title, body, data = {}) => {
  try {
    const sendBroadcastFn = httpsCallable(functions, 'sendBroadcast');
    const result = await sendBroadcastFn({
      tokens,
      title,
      body,
      url: data?.url
    });
    
    console.log('Broadcast sent successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending broadcast:', error);
    return { success: false, error: error.message };
  }
};

// Get FCM tokens for a user
export const getUserFCMTokens = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_fcm_tokens')
      .select('fcm_token')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching FCM tokens:', error);
      return [];
    }
    
    return data?.map(row => row.fcm_token) || [];
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return [];
  }
};

// Get FCM tokens for all admins
export const getAdminFCMTokens = async () => {
  try {
    // Get all admin user IDs
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'admin');
    
    if (adminError) {
      console.error('Error fetching admin profiles:', adminError);
      return [];
    }
    
    if (!adminProfiles || adminProfiles.length === 0) {
      console.log('No admin profiles found');
      return [];
    }
    
    const adminUserIds = adminProfiles.map(p => p.user_id);
    
    // Get FCM tokens for all admins
    const { data, error } = await supabase
      .from('user_fcm_tokens')
      .select('fcm_token')
      .in('user_id', adminUserIds);
    
    if (error) {
      console.error('Error fetching admin FCM tokens:', error);
      return [];
    }
    
    return data?.map(row => row.fcm_token) || [];
  } catch (error) {
    console.error('Error fetching admin tokens:', error);
    return [];
  }
};

export { messaging };
