import * as storageService from "./storageService";

import { API, MESSAGES } from "@/lib/constants";
import { aiUtils } from "@/lib/utils";
import { ErrorCategory, formatError, logError } from "@/lib/errorHandler";
import { AIProviderFactory } from "@/lib/genai";

interface FetchOptions extends RequestInit {
  isAuthenticated?: boolean;
  retries?: number;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  statusCode: number;
}

// Enhanced fetch with retry, timeout, and error handling
export async function fetchWithTimeout<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const {
    isAuthenticated = false,
    retries = API.REQUESTS.RETRY_ATTEMPTS,
    timeout = API.REQUESTS.TIMEOUT_MS,
    ...fetchOptions
  } = options;
  if (isAuthenticated) {
    const token = storageService.getUserAuth();
    if (!token) {
      return {
        data: null,
        error: new Error(MESSAGES.ERRORS.AUTH.REQUIRED),
        statusCode: 401,
      };
    }
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  // Ensure we have proper headers
  fetchOptions.headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };
  let currentRetry = 0;
  let lastError: Error | null = null;
  while (currentRetry <= retries) {
    try {
      // Create an abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      // Return error if request failed
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message ||
          `HTTP error ${response.status}: ${response.statusText}`;
        return {
          data: null,
          error: new Error(errorMessage),
          statusCode: response.status,
        };
      }
      const data = response.status !== 204 ? await response.json() : null;
      return {
        data,
        error: null,
        statusCode: response.status,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Don't retry if it was an abort
      if (lastError.name === "AbortError") {
        return {
          data: null,
          error: new Error("Request timeout"),
          statusCode: 408,
        };
      }
      // Exponential backoff
      if (currentRetry < retries) {
        await new Promise((r) => setTimeout(r, 2 ** currentRetry * 100));
      }
      currentRetry++;
    }
  }
  logError(lastError, "API Fetch (all retries failed)");
  return {
    data: null,
    error: lastError,
    statusCode: 0,
  };
}

// Standard HTTP methods with type safety
export const api = {
  get: <T = any>(url: string, options?: FetchOptions) =>
    fetchWithTimeout<T>(url, { method: "GET", ...options }),
  post: <T = any>(url: string, data: any, options?: FetchOptions) =>
    fetchWithTimeout<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    }),
  put: <T = any>(url: string, data: any, options?: FetchOptions) =>
    fetchWithTimeout<T>(url, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    }),
  patch: <T = any>(url: string, data: any, options?: FetchOptions) =>
    fetchWithTimeout<T>(url, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    }),
  delete: <T = any>(url: string, options?: FetchOptions) =>
    fetchWithTimeout<T>(url, { method: "DELETE", ...options }),
};

// Wrapper for OpenAI API calls
export const aiApi = {
  getBookRecommendations: async (prompt: string) => {
    try {
      // Using backend API approach
      const response = await api.post("/api/recommendations", {
        prompt,
        model: API.OPENAI.MODEL,
        temperature: API.OPENAI.TEMPERATURE,
        max_tokens: API.OPENAI.MAX_TOKENS,
      });
      if (response.error) {
        throw response.error;
      }
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "AI API - Book Recommendations");
      throw formattedError;
    }
  },

  // Direct approach using AIProviderFactory
  getBookRecommendationsDirect: async (prompt: string) => {
    try {
      const aiProvider = AIProviderFactory.getProvider("openai", {
        model: API.OPENAI.MODEL,
        temperature: API.OPENAI.TEMPERATURE,
        maxTokens: API.OPENAI.MAX_TOKENS,
      });
      const response = await aiProvider.getRecommendations(prompt);
      return response;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "AI API - Book Recommendations Direct");
      throw formattedError;
    }
  },
  getSimilarBooks: async (bookDetails: any) => {
    try {
      const aiProvider = AIProviderFactory.getProvider("openai", {
        model: API.OPENAI.MODEL,
        temperature: 0.7,
        maxTokens: 1000,
      });
      const prompt = aiUtils.getSimilarBooksPrompt(bookDetails);
      const response = await aiProvider.getRecommendations(prompt);
      return response.recommendations || [];
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "AI API - Similar Books");
      throw formattedError;
    }
  },
  analyzeUserFeedback: async (userId: string, feedbackData: any) => {
    try {
      const response = await api.post(
        "/api/analyze-feedback",
        {
          userId,
          feedback: feedbackData,
        },
        { isAuthenticated: true },
      );
      if (response.error) {
        throw response.error;
      }
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "AI API - Analyze Feedback");
      throw formattedError;
    }
  },
};
