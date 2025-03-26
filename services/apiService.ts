import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import * as storageService from "./storageService";

import { getCsrfToken } from "@/lib/csrf";
import {
  API,
  DEFAULT_VALUES,
  FIREBASE_COLLECTIONS,
  MESSAGES,
} from "@/lib/constants";
import { aiUtils } from "@/lib/utils";
import { auth, firestore } from "@/lib/firebase";
import { ErrorCategory, formatError, logError } from "@/lib/errorHandler";
import { AIProviderFactory } from "@/app/api/utils/genai";
import { User } from "@/types/user";

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

// Enhanced fetch with retry, timeout, error handling, and security measures
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
  // Handle authentication
  if (isAuthenticated) {
    const token = storageService.getUserAuth();
    if (!token) {
      return {
        data: null,
        error: new Error(MESSAGES.ERRORS.AUTH.UNAUTHORIZED),
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
  // Add CSRF protection for state-changing methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(fetchOptions.method || "")) {
    // Get or generate a CSRF token
    const csrfToken = getCsrfToken();
    fetchOptions.headers = {
      ...fetchOptions.headers,
      "X-CSRF-Token": csrfToken,
    };
    // Add additional headers to help prevent request forgery
    fetchOptions.headers = {
      ...fetchOptions.headers,
      "X-Requested-With": "XMLHttpRequest",
    };
    // If available, add a nonce for state freshness verification
    const state = window.sessionStorage.getItem("stateFreshness");
    if (state) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        "X-State-Nonce": state,
      };
    }
  }
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
          errorData?.error ||
          `HTTP error ${response.status}: ${response.statusText}`;
        return {
          data: null,
          error: new Error(errorMessage),
          statusCode: response.status,
        };
      }
      const data = response.status !== 204 ? await response.json() : null;
      return {
        data: data?.data || data, // Most API routes return { data: {...} }
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

// API routes for book-related operations
export const bookApi = {
  getPopularBooks: async (limit?: number) => {
    try {
      const queryParams = limit ? `?limit=${limit}` : "";
      const response = await api.get(`/api/books/popular${queryParams}`);
      if (response.error) throw response.error;
      return response.data.books;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Book API - Get Popular Books");
      throw formattedError;
    }
  },
  searchBooks: async (params: any) => {
    try {
      // Convert params object to URL search params
      const queryString = new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)]),
      ).toString();

      const response = await api.get(`/api/books/search?${queryString}`);
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Book API - Search Books");
      throw formattedError;
    }
  },
  getBookById: async (id: string) => {
    try {
      const response = await api.get(`/api/books/${id}`);
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Book API - Get Book By ID");
      throw formattedError;
    }
  },
  getSimilarBooks: async (id: string) => {
    try {
      const response = await api.get(`/api/books/${id}/similar`);
      if (response.error) throw response.error;
      return response.data.books;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Book API - Get Similar Books");
      throw formattedError;
    }
  },
  getBookReviews: async (id: string, params?: any) => {
    try {
      const queryString = params ? new URLSearchParams(params).toString() : "";
      const url = `/api/books/${id}/reviews${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      if (response.error) throw response.error;
      return response.data.reviews;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Book API - Get Book Reviews");
      throw formattedError;
    }
  },
};

// API routes for user-related operations
export const userApi = {
  register: async (userData: any): Promise<User> => {
    try {
      const { email, password, displayName } = userData;
      // Input validation
      if (!email || !password || !displayName) {
        throw Error("Email, password, and display name are required");
      }
      if (password.length < 6) {
        throw Error("Password should be at least 6 characters long");
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: displayName,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        preferences: DEFAULT_VALUES.USER_PREFERENCES,
      });
      // Return the new user data (excluding sensitive information)
      const data = {
        email: user.email,
        displayName: displayName,
        preferences: DEFAULT_VALUES.USER_PREFERENCES,
        isAnonymous: user.isAnonymous,
      };
      return data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.AUTH);
      logError(formattedError, "User API - Register");
      throw formattedError;
    }
  },
  login: async (credentials: any): Promise<User> => {
    try {
      const { email, password } = credentials;
      // Input validation
      if (!email || !password) {
        throw Error("Email and password are required");
      }
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      // Get user data from Firestore
      const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userRef);
      // Update last login timestamp
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
      let userData;
      let preferences = DEFAULT_VALUES.USER_PREFERENCES;
      if (userDoc.exists()) {
        userData = userDoc.data();
        preferences = userData.preferences || DEFAULT_VALUES.USER_PREFERENCES;
      }
      // Get the authentication token
      const token = await user.getIdToken();
      const data = {
        email: user.email,
        displayName: user.displayName || userData?.displayName,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
        preferences,
        token,
      };
      // Store the token in local storage
      if (data.token) {
        storageService.saveUserAuth(data.token);
      }
      return data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.AUTH);
      logError(formattedError, "User API - Login");
      throw formattedError;
    }
  },
  resetPassword: async (email: string) => {
    try {
      if (!email) {
        throw Error("Email is required");
      }
      await sendPasswordResetEmail(auth, email);
      return "Password reset email sent successfully";
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.AUTH);
      logError(formattedError, "User API - Reset Password");
      throw formattedError;
    }
  },
  updateProfile: async (updateData: {
    displayName?: string;
    photoURL?: string;
  }): Promise<User> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw Error("User is not authenticated");
      }
      const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, user.uid);
      await updateDoc(userRef, updateData);
      const result = {
        preferences: DEFAULT_VALUES.USER_PREFERENCES,
        isAnonymous: user.isAnonymous,
        ...updateData,
      };
      return result;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.USER);
      logError(formattedError, "User API - Update Profile");
      throw formattedError;
    }
  },
  getPreferences: async () => {
    try {
      const response = await api.get("/api/user/preferences", {
        isAuthenticated: true,
      });
      if (response.error) throw response.error;
      return response.data.preferences;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "User API - Get Preferences");
      throw formattedError;
    }
  },
  updatePreferences: async (preferences: any) => {
    try {
      const response = await api.patch("/api/user/preferences", preferences, {
        isAuthenticated: true,
      });
      if (response.error) throw response.error;
      return response.data.preferences;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "User API - Update Preferences");
      throw formattedError;
    }
  },
  submitFeedback: async (bookId: string, liked: boolean) => {
    try {
      const response = await api.post(
        "/api/user/feedback",
        { bookId, liked },
        { isAuthenticated: true },
      );
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "User API - Submit Feedback");
      throw formattedError;
    }
  },
};

// API routes for collections-related operations
export const collectionsApi = {
  getCollection: async (type: string) => {
    try {
      const response = await api.get(`/api/user/collections?type=${type}`, {
        isAuthenticated: true,
      });
      if (response.error) throw response.error;
      return response.data.items;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, `Collections API - Get ${type}`);
      throw formattedError;
    }
  },
  addToCollection: async (bookId: string, collectionType: string) => {
    try {
      const response = await api.post(
        "/api/user/collections",
        { bookId, collectionType },
        { isAuthenticated: true },
      );
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, `Collections API - Add to ${collectionType}`);
      throw formattedError;
    }
  },
  removeFromCollection: async (bookId: string, collectionType: string) => {
    try {
      const response = await api.delete(
        `/api/user/collections?bookId=${bookId}&type=${collectionType}`,
        { isAuthenticated: true },
      );
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(
        formattedError,
        `Collections API - Remove from ${collectionType}`,
      );
      throw formattedError;
    }
  },
};

// Recommendation and AI API routes
export const recommendationApi = {
  getPersonalizedRecommendations: async () => {
    try {
      const response = await api.get("/api/recommendations", {
        isAuthenticated: true,
      });
      if (response.error) throw response.error;
      return response.data.books;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Recommendation API - Get Personalized");
      throw formattedError;
    }
  },
  searchBooks: async (query: string, options?: any, regenerate = false) => {
    try {
      const response = await api.post(
        "/api/search-books",
        {
          query,
          options,
          regenerate,
        },
        { isAuthenticated: true },
      );
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Recommendation API - Search Books");
      throw formattedError;
    }
  },
};

// Chat API routes
export const chatApi = {
  sendMessage: async (
    message: string,
    sessionId?: string,
    options?: any,
    regenerate = false,
  ) => {
    try {
      const response = await api.post(
        "/api/chat",
        {
          message,
          sessionId,
          options,
          regenerate,
        },
        { isAuthenticated: true },
      );
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Chat API - Send Message");
      throw formattedError;
    }
  },
  getSessionList: async () => {
    try {
      const response = await api.get("/api/chat/sessions", {
        isAuthenticated: true,
      });
      if (response.error) throw response.error;
      return response.data.sessions;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Chat API - Get Sessions");
      throw formattedError;
    }
  },
  getSession: async (sessionId: string) => {
    try {
      const response = await api.get(`/api/chat/sessions/${sessionId}`, {
        isAuthenticated: true,
      });
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Chat API - Get Session");
      throw formattedError;
    }
  },
  deleteSession: async (sessionId: string) => {
    try {
      const response = await api.delete(`/api/chat/sessions/${sessionId}`, {
        isAuthenticated: true,
      });
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Chat API - Delete Session");
      throw formattedError;
    }
  },
  exportChat: async (sessionId?: string, format: "json" | "text" = "json") => {
    try {
      const response = await api.post(
        "/api/chat/export",
        {
          sessionId,
          format,
        },
        { isAuthenticated: true },
      );
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Chat API - Export Chat");
      throw formattedError;
    }
  },
  shareChat: async (sessionId: string) => {
    try {
      const response = await api.post(
        "/api/chat/share",
        { sessionId },
        { isAuthenticated: true },
      );
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Chat API - Share Chat");
      throw formattedError;
    }
  },
  getSharedChat: async (shareId: string) => {
    try {
      const response = await api.get(`/api/shared-chat/${shareId}`);
      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      logError(formattedError, "Chat API - Get Shared Chat");
      throw formattedError;
    }
  },
};

// Wrapper for OpenAI API calls
export const aiApi = {
  getBookRecommendations: async (prompt: string) => {
    try {
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
