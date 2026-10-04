import LogRocket from 'logrocket';

// Initialize LogRocket
export const initLogRocket = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_LOGROCKET_APP_ID) {
    LogRocket.init(import.meta.env.VITE_LOGROCKET_APP_ID, {
      console: {
        isEnabled: true, // Capture console logs
      },
      network: {
        isEnabled: true, // Capture network requests
        requestSanitizer: (request) => {
          // Sanitize sensitive data from requests
          if (request.url.includes('/auth/')) {
            // Remove sensitive auth data
            const sanitized = { ...request };
            if (sanitized.body) {
              delete sanitized.body.password;
              delete sanitized.body.email;
            }
            return sanitized;
          }
          return request;
        },
        responseSanitizer: (response) => {
          // Sanitize sensitive data from responses
          return response;
        },
      },
      dom: {
        isEnabled: true, // Capture DOM events
        textSanitizer: (text) => {
          // Sanitize sensitive text like credit card numbers
          if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) {
            return '[REDACTED]';
          }
          return text;
        },
      },
    });
    console.log('LogRocket initialized with app ID:', import.meta.env.VITE_LOGROCKET_APP_ID);
  } else {
    console.log('LogRocket not initialized:', {
      isProd: import.meta.env.PROD,
      hasAppId: !!import.meta.env.VITE_LOGROCKET_APP_ID
    });
  }
};

// Set user context
export const setLogRocketUser = (user) => {
  if (import.meta.env.PROD && user) {
    LogRocket.identify(user.id, {
      name: user.full_name || user.email,
      email: user.email,
      role: user.role || 'user',
    });
  }
};

// Clear user context
export const clearLogRocketUser = () => {
  if (import.meta.env.PROD) {
    LogRocket.identify(null);
  }
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
  if (import.meta.env.PROD) {
    LogRocket.track(eventName, properties);
  }
};

// Session URL getter
export const getSessionURL = () => {
  if (import.meta.env.PROD) {
    return LogRocket.sessionURL;
  }
  return null;
};
