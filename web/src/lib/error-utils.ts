import { AxiosError } from 'axios';

/**
 * User-friendly error messages for common scenarios
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'Request timed out. Please try again.',
  429: 'Too many requests. Please wait a moment.',
  500: 'Something went wrong. Please try again later.',
  502: 'Server is temporarily unavailable.',
  503: 'Service is currently unavailable.',
  504: 'Request timed out. Please try again.',
};

/**
 * Errors that should be silently ignored (no toast shown)
 */
const SILENT_ERRORS = ['AbortError', 'CancelledError'];

/**
 * Extracts a user-friendly error message from any error type.
 *
 * @param error - Any error (AxiosError, Error, string, unknown)
 * @returns User-friendly message or null if error should be silent
 */
export function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  // Check for silent errors
  if (error instanceof Error && SILENT_ERRORS.includes(error.name)) {
    return null;
  }

  // Handle Axios errors
  if (error instanceof AxiosError) {
    // Network error (no response)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'Request timed out. Please try again.';
      }
      return 'Unable to connect to server. Please check your connection.';
    }

    // Server returned an error response
    const status = error.response.status;
    const data = error.response.data as { error?: string; message?: string } | undefined;

    // Use server-provided message if available
    if (data?.error) {
      return data.error;
    }
    if (data?.message) {
      return data.message;
    }

    // Fall back to status-based message
    return ERROR_MESSAGES[status] || `Request failed (${status})`;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Don't expose technical error messages
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Unable to connect to server. Please check your connection.';
    }
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Unknown error type
  return 'An unexpected error occurred.';
}
