import { MESSAGES } from "./constants";

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export enum ErrorCategory {
  AUTH = "auth",
  BOOK = "book",
  SEARCH = "search",
  API = "api",
  DATA = "data",
  NETWORK = "network",
  UNKNOWN = "unknown",
}

const errorCodeMap: Record<string, string> = {
  "auth/email-already-in-use": MESSAGES.ERRORS.AUTH.EMAIL_IN_USE,
  "auth/weak-password": MESSAGES.ERRORS.AUTH.WEAK_PASSWORD,
  "auth/user-not-found": MESSAGES.ERRORS.AUTH.INVALID_CREDENTIALS,
  "auth/wrong-password": MESSAGES.ERRORS.AUTH.INVALID_CREDENTIALS,
  "auth/invalid-email": "Invalid email format",
  "book/not-found": MESSAGES.ERRORS.BOOK.NOT_FOUND,
  "book/invalid-id": "Invalid book ID",
  "search/empty": MESSAGES.ERRORS.SEARCH.EMPTY,
  "search/too-short": MESSAGES.ERRORS.SEARCH.TOO_SHORT,
  "search/no-results": MESSAGES.ERRORS.SEARCH.NO_RESULTS,
  // General errors
  "network/no-connection": "Network connection unavailable",
  "api/rate-limit": "API rate limit exceeded. Please try again later.",
  "api/openai-error": "OpenAI service error. Please try again later.",
};

export function formatError(
  error: unknown,
  category = ErrorCategory.UNKNOWN,
): AppError {
  // Handle Firebase errors
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    const errorCode = error.code;
    return {
      code: errorCode,
      message: errorCodeMap[errorCode] || String(error),
      details: error,
    };
  }
  if (error instanceof Error) {
    return {
      code: `${category}/error`,
      message: error.message || MESSAGES.ERRORS.GENERAL,
      details: error,
    };
  }
  return {
    code: `${category}/unknown`,
    message: String(error) || MESSAGES.ERRORS.GENERAL,
    details: error,
  };
}

export async function safeAsync<T>(
  promise: Promise<T>,
  category = ErrorCategory.UNKNOWN,
): Promise<[T | null, AppError | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, formatError(error, category)];
  }
}

export function logError(error: unknown, context?: string): void {
  const formattedError =
    error instanceof Error ? error : new Error(String(error));
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context || "ERROR"}]`, formattedError);
  } else {
    // For production, this could integrate with a real error logging service
    console.error(`[${context || "ERROR"}]`, formattedError.message);
    // Example integration point with error monitoring services like Sentry
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(formattedError, { extra: { context } });
    // }
  }
}
