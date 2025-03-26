import { PayloadAction } from "@reduxjs/toolkit";

import { ErrorCategory, formatError, logError } from "@/lib/errorHandler";

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

export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  category: ErrorCategory,
) {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      const formattedError = formatError(error, category);
      logError(formattedError, category);
      throw new Error(formattedError.message);
    }
  };
}
