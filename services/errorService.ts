import { PayloadAction } from "@reduxjs/toolkit";

import {
  ErrorCategory,
  FormattedError,
  formatError,
  logError,
} from "@/lib/errorHandler";

export function handleRejection(error: unknown, category?: ErrorCategory) {
  const formattedError = formatError(error, category);
  logError(formattedError, category);
  return formattedError.message;
}

export function setErrorState(
  state: { error: string | null },
  action: PayloadAction<string>,
) {
  state.error = action.payload;
}

export function clearErrorState(state: { error: string | null }) {
  state.error = null;
}

export function createErrorHandler(
  category: ErrorCategory = ErrorCategory.UNKNOWN,
) {
  return {
    handleAuthError: (message = "Authentication required") => {
      return formatError(new Error(message), ErrorCategory.AUTH).message;
    },
    handleNetworkError: (error: unknown) => {
      return formatError(error, ErrorCategory.NETWORK).message;
    },
    handleApiError: (error: unknown) => {
      return formatError(error, ErrorCategory.API).message;
    },
    handleDataError: (error: unknown) => {
      return formatError(error, ErrorCategory.DATA).message;
    },
    handleCustomError: (error: unknown) => {
      return formatError(error, category).message;
    },
  };
}

export function withErrorHandling<T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
): (...args: A) => Promise<T> {
  return async (...args: A): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      const formattedError = formatError(error, category);
      // Log the error (consoles in dev, could be a service in prod)
      logError(formattedError, {
        functionName: fn.name,
        args,
      });
      throw formattedError;
    }
  };
}

export function formatAPIError(error: any): FormattedError {
  // Already formatted error
  if (error && error.code && error.message) {
    return error as FormattedError;
  }
  // Error from fetch
  if (error instanceof Response) {
    return {
      code: `api/${error.status || "error"}`,
      message: error.statusText || "API Error",
      category: ErrorCategory.API,
      details: { status: error.status },
    };
  }
  // Network or other error
  if (error instanceof Error) {
    return {
      code: "api/error",
      message: error.message || "An error occurred while calling the API",
      category: ErrorCategory.API,
      details: { stack: error.stack },
    };
  }
  // Unknown error shape
  return {
    code: "api/unknown",
    message: String(error) || "Unknown API error",
    category: ErrorCategory.API,
    details: { raw: error },
  };
}

export function reportError(error: any, context?: any): void {
  const formattedError = error.code ? error : formatError(error);
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    // TODO
    // eslint-disable-next-line no-console
    console.error("[ERROR]", formattedError, context);
    return;
  }
  // In production, could send to error tracking service
  // Example: Sentry.captureException(error, { extra: { ...context, ...formattedError } });
  // For now, log to console even in production
}
