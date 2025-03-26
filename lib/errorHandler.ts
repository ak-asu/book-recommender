import { MESSAGES } from "./constants";

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export enum ErrorCategory {
  API = "api",
  AUTH = "auth",
  BOOK = "book",
  DATA = "data",
  FIREBASE = "firebase",
  NETWORK = "network",
  OPENAI = "openai",
  VALIDATION = "validation",
  USER = "user",
  UNKNOWN = "unknown",
}

const errorCodeMap: Record<string, string> = {
  // Auth errors
  "auth/email-already-in-use": MESSAGES.ERRORS.AUTH.EMAIL_IN_USE,
  "auth/weak-password": MESSAGES.ERRORS.AUTH.WEAK_PASSWORD,
  "auth/user-not-found": MESSAGES.ERRORS.AUTH.INVALID_CREDENTIALS,
  "auth/wrong-password": MESSAGES.ERRORS.AUTH.INVALID_CREDENTIALS,
  "auth/invalid-email": "Invalid email format",
  "auth/unauthorized": MESSAGES.ERRORS.AUTH.UNAUTHORIZED,
  "auth/expired-session": MESSAGES.ERRORS.AUTH.EXPIRED_SESSION,
  // Book errors
  "book/not-found": MESSAGES.ERRORS.BOOK.NOT_FOUND,
  "book/invalid-id": "Invalid book ID",
  "book/review-exists": MESSAGES.ERRORS.BOOK.REVIEW_EXISTS,
  "book/invalid-rating": MESSAGES.ERRORS.BOOK.INVALID_RATING,
  // Search errors
  "search/empty": MESSAGES.ERRORS.SEARCH.EMPTY,
  "search/too-short": MESSAGES.ERRORS.SEARCH.TOO_SHORT,
  "search/no-results": MESSAGES.ERRORS.SEARCH.NO_RESULTS,
  // General API errors
  "api/general": MESSAGES.ERRORS.API.GENERAL,
  "api/rate-limit": MESSAGES.ERRORS.API.RATE_LIMIT,
  "api/not-found": MESSAGES.ERRORS.API.NOT_FOUND,
  // Network errors
  "network/no-connection": "Network connection unavailable",
  "api/openai-error": "OpenAI service error. Please try again later.",
};

export interface FormattedError {
  message: string;
  code: string;
  category: ErrorCategory;
  details?: any;
}

export function formatError(
  error: any,
  category = ErrorCategory.UNKNOWN,
): FormattedError {
  if (error?.code && errorCodeMap[error.code]) {
    return {
      message: errorCodeMap[error.code],
      code: error.code,
      category: getErrorCategory(error.code),
      details: error.details || error.message,
    };
  }
  // Handle Firebase errors
  if (
    error?.code?.startsWith("auth/") ||
    error?.code?.startsWith("firestore/") ||
    error?.code?.startsWith("storage/")
  ) {
    return {
      message: error.message || "Firebase operation failed",
      code: error.code,
      category: ErrorCategory.FIREBASE,
      details: error.details,
    };
  }
  // Handle OpenAI errors
  if (error?.type === "invalid_request_error" || error?.type === "api_error") {
    return {
      message: error.message || "OpenAI API request failed",
      code: `openai/${error.type}`,
      category: ErrorCategory.OPENAI,
      details: {
        type: error.type,
        param: error.param,
      },
    };
  }
  // Handle validation errors
  if (
    error?.name === "ValidationError" ||
    category === ErrorCategory.VALIDATION
  ) {
    return {
      message: error.message || "Validation failed",
      code: "validation/error",
      category: ErrorCategory.VALIDATION,
      details: error.details,
    };
  }
  // Handle API errors
  if (category === ErrorCategory.API) {
    return {
      message: error.message || "API request failed",
      code: error.code || "api/error",
      category: ErrorCategory.API,
      details: error.details,
    };
  }
  // Handle unknown errors
  return {
    message: error?.message || "An unknown error occurred",
    code: error?.code || "unknown/error",
    category: ErrorCategory.UNKNOWN,
    details: error?.details,
  };
}

function getErrorCategory(code: string): ErrorCategory {
  if (
    code.startsWith("auth/") ||
    code.startsWith("firestore/") ||
    code.startsWith("storage/")
  ) {
    return ErrorCategory.FIREBASE;
  }
  if (code.startsWith("openai/")) {
    return ErrorCategory.OPENAI;
  }
  if (code.startsWith("validation/")) {
    return ErrorCategory.VALIDATION;
  }
  if (code.startsWith("api/") || code.startsWith("network/")) {
    return ErrorCategory.API;
  }
  return ErrorCategory.UNKNOWN;
}

// Safe async function wrapper to handle errors consistently
export async function safeAsync<T>(
  promise: Promise<T>,
  category = ErrorCategory.UNKNOWN,
): Promise<[T | null, FormattedError | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const formattedError = formatError(error, category);
    return [null, formattedError];
  }
}

export function logError(error: any, context?: any) {
  const formattedError = formatError(error);
  // TODO
  // eslint-disable-next-line no-console
  console.error("Error:", {
    ...formattedError,
    stack: error?.stack,
    context,
  });
  return formattedError;
}

// Create error objects with consistent structure
export function createError(
  code: string,
  message?: string,
  details?: any,
): AppError {
  const errorMessage = message || errorCodeMap[code] || "An error occurred";
  return {
    code,
    message: errorMessage,
    details,
  };
}
