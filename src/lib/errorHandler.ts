// Centralized Error Handling System
import { toast } from 'sonner';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  PAYMENT = 'PAYMENT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

// Custom error class
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType = ErrorType.UNKNOWN,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error handler class
export class ErrorHandler {
  static handle(error: unknown, context?: string): void {
    console.error(`[${context || 'App'}] Error:`, error);

    // Send to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            context: context || 'App',
            errorType: error instanceof AppError ? error.type : 'UNKNOWN'
          },
          extra: error instanceof AppError ? {
            code: error.code,
            details: error.details
          } : undefined
        });
      }
    }

    if (error instanceof AppError) {
      this.showUserError(error.message, error.type);
    } else if (error instanceof Error) {
      this.showUserError(error.message, ErrorType.UNKNOWN);
    } else {
      this.showUserError('An unexpected error occurred', ErrorType.UNKNOWN);
    }
  }

  static handleAsync(error: unknown, context?: string): void {
    console.error(`[${context || 'App'}] Async Error:`, error);
    this.handle(error, context);
  }

  static showUserError(message: string, type: ErrorType): void {
    const toastConfig: Record<ErrorType, { icon: string; title: string; description: string }> = {
      network: {
        icon: '🌐',
        title: 'Network Error',
        description: message
      },
      auth: {
        icon: '🔐',
        title: 'Authentication Error',
        description: message
      },
      validation: {
        icon: '⚠️',
        title: 'Validation Error',
        description: message
      },
      database: {
        icon: '💾',
        title: 'Database Error',
        description: message
      },
      payment: {
        icon: '💳',
        title: 'Payment Error',
        description: message
      },
      unknown: {
        icon: '❌',
        title: 'Error',
        description: message
      }
    };

    const config = toastConfig[type] || toastConfig.unknown;
    toast.error(config.title, {
      description: config.description,
      icon: config.icon
    });
  }

  static logError(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorData = {
      timestamp,
      context: context || 'App',
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };

    console.error('[Error Log]', errorData);

    // Send to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.captureException(error, {
        tags: {
          context: context || 'App',
          source: 'ErrorHandler'
        },
        extra: errorData
      });
    }
  }
}

// Async error wrapper
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    ErrorHandler.handleAsync(error, context);
    throw error;
  }
};

// Supabase error handler
export const handleSupabaseError = (error: any): AppError => {
  if (!error) {
    return new AppError('Unknown error occurred', ErrorType.UNKNOWN);
  }

  const message = error.message || 'An error occurred';
  
  // Handle specific Supabase error codes
  if (error.code === '23505') {
    return new AppError('This record already exists', ErrorType.VALIDATION, 'DUPLICATE_RECORD');
  }
  
  if (error.code === '23503') {
    return new AppError('Related record not found', ErrorType.VALIDATION, 'FOREIGN_KEY_VIOLATION');
  }
  
  if (error.code === '42501') {
    return new AppError('Permission denied', ErrorType.AUTHORIZATION, 'PERMISSION_DENIED');
  }

  // Network errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return new AppError('Network connection failed. Please check your internet connection.', ErrorType.NETWORK);
  }

  // Auth errors
  if (message.includes('Invalid login credentials') || message.includes('Invalid email or password')) {
    return new AppError('Invalid email or password', ErrorType.AUTHENTICATION);
  }

  return new AppError(message, ErrorType.UNKNOWN, error.code);
};

// Validation error handler
export const handleValidationError = (field: string, message: string): AppError => {
  return new AppError(`${field}: ${message}`, ErrorType.VALIDATION);
};
