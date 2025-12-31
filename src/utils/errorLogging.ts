import { PostgrestError } from '@supabase/supabase-js';

export interface LoggedError {
  type: 'RLS_VIOLATION' | 'DATABASE_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details: string;
  table?: string;
  operation?: string;
  timestamp: string;
  userId?: string;
  context?: Record<string, unknown>;
}

export interface ErrorContext {
  table?: string;
  operation?: string;
  userId?: string;
  context?: Record<string, unknown>;
}

// Parse Supabase/Postgres errors to identify the specific issue
export const parseSupabaseError = (error: unknown, context?: ErrorContext): LoggedError => {
  const timestamp = new Date().toISOString();
  const baseError: Partial<LoggedError> = {
    timestamp,
    table: context?.table,
    operation: context?.operation,
    userId: context?.userId,
  };

  // Handle PostgrestError from Supabase
  if (isPostgrestError(error)) {
    const pgError = error as PostgrestError;
    
    // RLS Policy Violations
    if (pgError.code === '42501' || pgError.message?.includes('row-level security') || pgError.message?.includes('RLS')) {
      return {
        ...baseError,
        type: 'RLS_VIOLATION',
        message: `Access denied: You don't have permission to ${context?.operation || 'perform this action'} on ${context?.table || 'this resource'}`,
        details: `RLS Policy Violation - Code: ${pgError.code}, Message: ${pgError.message}, Hint: ${pgError.hint || 'Check user role and permissions'}`,
      } as LoggedError;
    }

    // Foreign key violations
    if (pgError.code === '23503') {
      return {
        ...baseError,
        type: 'DATABASE_ERROR',
        message: 'Referenced record not found',
        details: `Foreign Key Violation - ${pgError.message}`,
      } as LoggedError;
    }

    // Unique constraint violations
    if (pgError.code === '23505') {
      return {
        ...baseError,
        type: 'DATABASE_ERROR',
        message: 'A record with this value already exists',
        details: `Unique Constraint Violation - ${pgError.message}`,
      } as LoggedError;
    }

    // Not null violations
    if (pgError.code === '23502') {
      return {
        ...baseError,
        type: 'VALIDATION_ERROR',
        message: 'Required field is missing',
        details: `Not Null Violation - ${pgError.message}`,
      } as LoggedError;
    }

    // Check constraint violations
    if (pgError.code === '23514') {
      return {
        ...baseError,
        type: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        details: `Check Constraint Violation - ${pgError.message}`,
      } as LoggedError;
    }

    // Connection/network issues
    if (pgError.code === 'PGRST301' || pgError.message?.includes('connection')) {
      return {
        ...baseError,
        type: 'NETWORK_ERROR',
        message: 'Unable to connect to the database. Please check your connection.',
        details: `Connection Error - ${pgError.message}`,
      } as LoggedError;
    }

    // JWT/Auth issues
    if (pgError.code === 'PGRST301' || pgError.message?.includes('JWT') || pgError.message?.includes('expired')) {
      return {
        ...baseError,
        type: 'AUTH_ERROR',
        message: 'Your session has expired. Please log in again.',
        details: `Authentication Error - ${pgError.message}`,
      } as LoggedError;
    }

    // Generic Postgres error
    return {
      ...baseError,
      type: 'DATABASE_ERROR',
      message: pgError.message || 'A database error occurred',
      details: `Code: ${pgError.code}, Message: ${pgError.message}, Details: ${pgError.details || 'N/A'}, Hint: ${pgError.hint || 'N/A'}`,
    } as LoggedError;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
      return {
        ...baseError,
        type: 'NETWORK_ERROR',
        message: 'Network error. Please check your internet connection.',
        details: error.message,
      } as LoggedError;
    }

    // Auth errors
    if (error.message.includes('auth') || error.message.includes('unauthorized') || error.message.includes('401')) {
      return {
        ...baseError,
        type: 'AUTH_ERROR',
        message: 'Authentication error. Please log in again.',
        details: error.message,
      } as LoggedError;
    }

    return {
      ...baseError,
      type: 'UNKNOWN_ERROR',
      message: error.message,
      details: error.stack || error.message,
    } as LoggedError;
  }

  // Handle unknown error types
  return {
    ...baseError,
    type: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: JSON.stringify(error),
  } as LoggedError;
};

// Type guard for PostgrestError
const isPostgrestError = (error: unknown): error is PostgrestError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error || 'details' in error)
  );
};

// Log error to console with structured format
export const logError = (error: LoggedError): void => {
  const logStyle = getLogStyle(error.type);
  
  console.group(`%c[${error.type}] ${error.timestamp}`, logStyle);
  console.log('%cMessage:', 'font-weight: bold', error.message);
  console.log('%cDetails:', 'font-weight: bold', error.details);
  if (error.table) console.log('%cTable:', 'font-weight: bold', error.table);
  if (error.operation) console.log('%cOperation:', 'font-weight: bold', error.operation);
  if (error.userId) console.log('%cUser ID:', 'font-weight: bold', error.userId);
  if (error.context) console.log('%cContext:', 'font-weight: bold', error.context);
  console.groupEnd();
};

const getLogStyle = (type: LoggedError['type']): string => {
  const styles: Record<LoggedError['type'], string> = {
    RLS_VIOLATION: 'color: #ff6b6b; font-weight: bold; background: #ffe0e0; padding: 2px 6px; border-radius: 3px;',
    DATABASE_ERROR: 'color: #e67700; font-weight: bold; background: #fff3e0; padding: 2px 6px; border-radius: 3px;',
    NETWORK_ERROR: 'color: #1976d2; font-weight: bold; background: #e3f2fd; padding: 2px 6px; border-radius: 3px;',
    AUTH_ERROR: 'color: #7b1fa2; font-weight: bold; background: #f3e5f5; padding: 2px 6px; border-radius: 3px;',
    VALIDATION_ERROR: 'color: #388e3c; font-weight: bold; background: #e8f5e9; padding: 2px 6px; border-radius: 3px;',
    UNKNOWN_ERROR: 'color: #616161; font-weight: bold; background: #f5f5f5; padding: 2px 6px; border-radius: 3px;',
  };
  return styles[type];
};

// Get user-friendly error message based on error type
export const getUserFriendlyMessage = (error: LoggedError): string => {
  switch (error.type) {
    case 'RLS_VIOLATION':
      return `Permission denied: ${error.message}. Please contact your administrator if you believe you should have access.`;
    case 'AUTH_ERROR':
      return 'Your session has expired or you are not authorized. Please log in again.';
    case 'NETWORK_ERROR':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'VALIDATION_ERROR':
      return error.message;
    case 'DATABASE_ERROR':
      return 'A database error occurred. Please try again or contact support if the issue persists.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

// Helper to handle errors in async operations
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context: { table?: string; operation?: string; userId?: string }
): Promise<{ data: T | null; error: LoggedError | null }> => {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    const parsedError = parseSupabaseError(err, context);
    logError(parsedError);
    return { data: null, error: parsedError };
  }
};
