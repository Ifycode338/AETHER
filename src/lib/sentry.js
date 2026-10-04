import * as Sentry from "@sentry/react";

// Initialize Sentry
export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || "",
      environment: import.meta.env.MODE,
      tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
      replaysSessionSampleRate: 0.1, // Capture 10% of sessions for replay
      replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors for replay
      
      integrations: [
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
        Sentry.browserTracingIntegration(),
      ],

      beforeSend(event, hint) {
        // Filter out certain errors if needed
        if (event.exception) {
          const error = hint.originalException;
          // Ignore certain error types
          if (error instanceof Error && error.message.includes('Failed to fetch')) {
            return null;
          }
        }
        return event;
      },

      // Set user context when available
      beforeSend(event) {
        const userId = localStorage.getItem('user_id');
        if (userId) {
          event.user = { id: userId };
        }
        return event;
      },
    });
  }
};

// Custom error reporting function
export const reportError = (error, context) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// Custom error message reporting
export const reportMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};

// Performance monitoring
export const startTransaction = (name) => {
  return Sentry.startTransaction({ name });
};

// Set user context
export const setUserContext = (user) => {
  Sentry.setUser(user);
};

// Clear user context
export const clearUserContext = () => {
  Sentry.setUser(null);
};
