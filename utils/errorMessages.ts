import axios from 'axios';

/**
 * Maps raw API / network errors to clean, user-friendly messages.
 * Keeps a single source of truth so every screen shows consistent copy.
 */

// Server-message → friendly-message map (case-insensitive matching)
const SERVER_MESSAGE_MAP: Record<string, string> = {
  // Auth
  'invalid credentials':
    'The email/username or password you entered is incorrect. Please try again.',
  'invalid password': 'The password you entered is incorrect. Please try again.',
  'user not found':
    "We couldn't find an account with that email or username. Please check your details or create an account.",
  'account not found':
    "We couldn't find an account with that email or username. Please check your details or create an account.",
  'user already exists': 'An account with this email already exists. Try logging in instead.',
  'email and password are required': 'Please enter both your email and password.',
  'identifier and password required': 'Please enter your email/username and password.',
  'authentication required': 'Your session has ended. Please log in again to continue.',
  'invalid or expired token': 'Your session has expired. Please log in again.',
  'invalid refresh token': 'Your session has expired. Please log in again.',
  'refresh token required': 'Your session has expired. Please log in again.',
  'no refresh token': 'Your session has expired. Please log in again.',

  // Generic
  'server error': 'Something went wrong on our end. Please try again in a moment.',
  'not found': "The content you're looking for doesn't exist or has been removed.",
  unauthorized: 'You need to be logged in to do this.',
  forbidden: "You don't have permission to perform this action.",
};

// HTTP status → friendly fallback
const STATUS_MESSAGE_MAP: Record<number, string> = {
  400: "Something doesn't look right. Please check your input and try again.",
  401: 'Your session has expired. Please log in again.',
  403: "You don't have permission to do this.",
  404: "We couldn't find what you were looking for.",
  408: 'The request took too long. Please check your connection and try again.',
  409: 'This action conflicts with something that already exists.',
  422: "Some of the information provided isn't valid. Please double-check and try again.",
  429: "You're doing that too fast. Please wait a moment and try again.",
  500: 'Something went wrong on our end. Please try again in a moment.',
  502: 'Our servers are temporarily unavailable. Please try again shortly.',
  503: 'The service is temporarily down for maintenance. Please try again later.',
};

/**
 * Extracts a user-friendly error message from any error object.
 * Priority:
 *   1. Mapped server message (from response body)
 *   2. Mapped HTTP status code
 *   3. Network / timeout detection
 *   4. Generic fallback
 */
export function getUserFriendlyError(error: unknown): string {
  // Axios errors
  if (axios.isAxiosError(error)) {
    // Network / timeout errors (no response at all)
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return 'The request timed out. Please check your internet connection and try again.';
      }
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
      return 'Unable to reach the server. Please check your connection and try again.';
    }

    // Try to match server's error message
    const serverMsg = (error.response.data as any)?.message || (error.response.data as any)?.error;

    if (typeof serverMsg === 'string') {
      const key = serverMsg.toLowerCase().trim();
      if (SERVER_MESSAGE_MAP[key]) {
        return SERVER_MESSAGE_MAP[key];
      }
    }

    // Fall back to HTTP status code
    const status = error.response.status;
    if (STATUS_MESSAGE_MAP[status]) {
      return STATUS_MESSAGE_MAP[status];
    }

    return 'Something went wrong. Please try again.';
  }

  // Standard JS errors
  if (error instanceof Error) {
    const msg = error.message.toLowerCase().trim();

    // Already user-friendly custom messages
    if (
      msg.includes('session has expired') ||
      msg.includes('account was not found') ||
      msg.includes('unable to connect') ||
      msg.includes('please log in')
    ) {
      return error.message;
    }

    // Token-related errors thrown by our own client code
    if (msg.includes('no refresh token') || msg.includes('refresh token')) {
      return 'Your session has expired. Please log in again.';
    }

    if (msg.includes('user not found') || msg.includes('account not found')) {
      return "We couldn't find an account matching those details. Please check your info or sign up.";
    }

    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection.';
    }

    // Don't expose raw JS error messages to users
    return 'Something went wrong. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Returns true if the error indicates the user's session has expired
 * and they should be redirected to the login screen.
 */
export function isSessionExpiredError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return true;
    const msg = ((error.response?.data as any)?.message || '').toLowerCase();
    return (
      msg.includes('expired') ||
      msg.includes('invalid token') ||
      msg.includes('authentication required') ||
      msg.includes('refresh token')
    );
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('no refresh token') || msg.includes('session');
  }
  return false;
}
