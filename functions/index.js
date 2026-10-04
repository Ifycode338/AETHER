const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'bennycare-app'
});

// Send notification to a single user
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const { token, title, body, url } = data;

  if (!token || !title || !body) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: token, title, body'
    );
  }

  const message = {
    notification: {
      title,
      body,
    },
    webpush: {
      fcm_options: {
        link: url || '/'
      },
      notification: {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      }
    },
    token: token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Send broadcast notification to multiple users
exports.sendBroadcast = functions.https.onCall(async (data, context) => {
  const { tokens, title, body, url } = data;

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0 || !title || !body) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: tokens (array), title, body'
    );
  }

  const message = {
    notification: {
      title,
      body,
    },
    webpush: {
      fcm_options: {
        link: url || '/'
      },
      notification: {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      }
    },
    tokens: tokens
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log('Successfully sent multicast message:', response);
    return { 
      success: true, 
      successCount: response.successCount, 
      failureCount: response.failureCount 
    };
  } catch (error) {
    console.error('Error sending multicast message:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
