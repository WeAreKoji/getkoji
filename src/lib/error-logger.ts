/**
 * Safe error logging utility that sanitizes sensitive information
 * before logging to console or external services
 */

interface SanitizedError {
  message: string;
  code?: string;
  timestamp: string;
}

/**
 * Sanitizes error messages by removing sensitive information
 */
function sanitizeErrorMessage(message: string): string {
  // Remove email addresses
  let sanitized = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
  
  // Remove phone numbers
  sanitized = sanitized.replace(/\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}/g, '[PHONE]');
  
  // Remove tokens and API keys
  sanitized = sanitized.replace(/\b[a-zA-Z0-9_-]{20,}\b/g, '[TOKEN]');
  
  // Remove URLs with sensitive params
  sanitized = sanitized.replace(/https?:\/\/[^\s]+\?[^\s]+/g, '[URL_WITH_PARAMS]');
  
  // Remove credit card numbers
  sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_NUMBER]');
  
  return sanitized;
}

/**
 * Logs error safely to console with sanitization
 * Use this instead of console.error for user-facing errors
 */
export function logError(error: any, context?: string): SanitizedError {
  const sanitizedError: SanitizedError = {
    message: sanitizeErrorMessage(error?.message || String(error)),
    code: error?.code,
    timestamp: new Date().toISOString(),
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', context ? `${context}:` : '', sanitizedError);
  }
  
  // In production, send to error tracking service (e.g., Sentry)
  // Example: Sentry.captureException(sanitizedError);
  
  return sanitizedError;
}

/**
 * Logs warning safely to console with sanitization
 */
export function logWarning(message: string, context?: string): void {
  const sanitized = sanitizeErrorMessage(message);
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Warning]', context ? `${context}:` : '', sanitized);
  }
}

/**
 * Logs info safely to console with sanitization
 */
export function logInfo(message: string, context?: string): void {
  const sanitized = sanitizeErrorMessage(message);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Info]', context ? `${context}:` : '', sanitized);
  }
}

/**
 * Gets user-friendly error message from error object
 */
export function getUserFriendlyError(error: any): string {
  const message = error?.message || 'An unexpected error occurred';
  
  // Map common error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'PGRST116': 'No data found',
    'PGRST301': 'Permission denied',
  };
  
  // Check for known error codes
  if (error?.code && errorMap[error.code]) {
    return errorMap[error.code];
  }
  
  // Return sanitized message
  return sanitizeErrorMessage(message);
}
