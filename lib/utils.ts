import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { User as FirebaseUser } from "firebase/auth";

import {
  BOOK,
  FIREBASE_COLLECTIONS,
  STORAGE_KEYS,
  SEARCH,
  AI_PROMPTS,
  DEFAULT_VALUES,
} from "./constants";

import { ConversationItem } from "@/types/search";
import { Message } from "@/types/chat";
import { User, UserPreferences } from "@/types/user";
import { BookRecommendation } from "@/types/book";
import { SearchOptions } from "@/types/search";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const stringUtils = {
  truncate: (str: string, maxLength: number): string => {
    if (!str) return "";
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  },
  capitalize: (str: string): string => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  },
  slugify: (str: string): string => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  },
  encodeForUrl: (str: string): string => {
    return encodeURIComponent(str);
  },
};

export const dateUtils = {
  formatDate: (date: Date | string | number): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },
  formatDateTime: (date: Date | string | number): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  },
  getRelativeTimeString: (date: Date | string | number): string => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  },
};

export const validationUtils = {
  isValidEmail: (email: string): boolean => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  isValidPassword: (password: string): boolean => {
    if (!password) return false;
    return password.length >= 6;
  },
  isEmpty: (str: string | null | undefined): boolean => {
    return !str || str.trim() === "";
  },
  isValidGenre: (genre: string): boolean => {
    return BOOK.GENRES.includes(genre);
  },
  isValidMood: (mood: string): boolean => {
    return BOOK.MOODS.includes(mood);
  },
  isValidLength: (length: string): boolean => {
    return BOOK.LENGTHS.some((l) => l.value === length);
  },
};

export const storageUtils = {
  saveItem: <T>(key: string, data: T): void => {
    if (typeof window === "undefined") return;
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
    } catch {}
  },
  getItem: <T>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const serializedData = localStorage.getItem(key);
      return serializedData ? JSON.parse(serializedData) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },
  saveGuestBookmarks: (bookmarks: any[]): void => {
    storageUtils.saveItem(STORAGE_KEYS.GUEST_BOOKMARKS, bookmarks);
  },
  getGuestBookmarks: (): any[] => {
    return storageUtils.getItem<any[]>(STORAGE_KEYS.GUEST_BOOKMARKS, []);
  },
  saveSearchHistory: (history: any[]): void => {
    storageUtils.saveItem(STORAGE_KEYS.SEARCH_HISTORY, history);
  },
  getSearchHistory: (): any[] => {
    return storageUtils.getItem<any[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
  },
  saveConversation: (conversation: ConversationItem[]): void => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CONVERSATION,
        JSON.stringify(conversation),
      );
    } catch {}
  },
  getConversation: (): ConversationItem[] => {
    try {
      const storedConversation = localStorage.getItem(
        STORAGE_KEYS.CONVERSATION,
      );
      return storedConversation ? JSON.parse(storedConversation) : [];
    } catch {
      return [];
    }
  },
  saveChatMessages: (sessionId: string, messages: Message[]): void => {
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.CHAT_SESSION_PREFIX}${sessionId}`,
        JSON.stringify(messages),
      );
      const sessions = miscUtils.safeJsonParse<any[]>(
        localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS) || "[]",
        [],
      );
      const sessionIndex = sessions.findIndex((s: any) => s.id === sessionId);
      const sessionInfo = {
        id: sessionId,
        title:
          messages.length > 0 && messages[0].type === "query"
            ? messages[0].content.substring(0, 30) +
              (messages[0].content.length > 30 ? "..." : "")
            : "New Chat",
        lastActive: Date.now(),
        messageCount: messages.length,
      };
      if (sessionIndex >= 0) {
        sessions[sessionIndex] = sessionInfo;
      } else {
        sessions.push(sessionInfo);
      }
      localStorage.setItem(
        STORAGE_KEYS.CHAT_SESSIONS,
        JSON.stringify(sessions),
      );
    } catch {}
  },
  getChatMessages: (sessionId: string): Message[] => {
    try {
      const messagesString = localStorage.getItem(
        `${STORAGE_KEYS.CHAT_SESSION_PREFIX}${sessionId}`,
      );
      return messagesString ? JSON.parse(messagesString) : [];
    } catch {
      return [];
    }
  },
  getChatSessions: (): any[] => {
    try {
      const sessionsString = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      return sessionsString ? JSON.parse(sessionsString) : [];
    } catch {
      return [];
    }
  },
};

export const arrayUtils = {
  chunk: <T>(array: T[], size: number): T[][] => {
    if (!array || !Array.isArray(array)) return [];
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size),
    );
  },
  sortBy: <T>(
    array: T[],
    key: keyof T,
    direction: "asc" | "desc" = "asc",
  ): T[] => {
    if (!array || !Array.isArray(array)) return [];
    const sortedArray = [...array].sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];
      if (typeof valueA === "string" && typeof valueB === "string") {
        return direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      if (valueA < valueB) return direction === "asc" ? -1 : 1;
      if (valueA > valueB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortedArray;
  },
  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    if (!array || !Array.isArray(array)) return {};
    return array.reduce(
      (result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
          result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
      },
      {} as Record<string, T[]>,
    );
  },
};

export const bookUtils = {
  createExternalLink: (
    site: keyof typeof BOOK.EXTERNAL_SITES,
    book: { title: string; author: string },
  ): string => {
    const baseUrl = BOOK.EXTERNAL_SITES[site];
    const searchQuery = `${book.title} ${book.author}`;
    return `${baseUrl}${stringUtils.encodeForUrl(searchQuery)}`;
  },
  formatRating: (rating: number): string => {
    if (!rating && rating !== 0) return "N/A";
    return `${rating.toFixed(1)}/5`;
  },
  formatReviewCount: (count: number): string => {
    if (!count && count !== 0) return "No reviews";
    if (count < 1000) return `${count} reviews`;
    return `${(count / 1000).toFixed(1)}K reviews`;
  },
  getDescriptionPreview: (
    description: string,
    maxLength: number = 150,
  ): string => {
    return stringUtils.truncate(description, maxLength);
  },
  getBookLengthCategory: (
    pageCount: number,
  ): "short" | "medium" | "long" | "unknown" => {
    if (!pageCount) return "unknown";
    if (pageCount < 300) return "short";
    if (pageCount < 500) return "medium";
    return "long";
  },
  validateBook: (book: any): boolean => {
    if (!book) return false;
    if (!book.title || typeof book.title !== "string") return false;
    if (!book.author || typeof book.author !== "string") return false;
    return true;
  },
  normalizeBook: (book: any): any => {
    if (!book) return null;
    return {
      id:
        book.id ||
        `unknown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: book.title || "Unknown Title",
      author: book.author || "Unknown Author",
      publicationDate: book.publicationDate || "Unknown",
      description: book.description || "No description available",
      genres: Array.isArray(book.genres)
        ? book.genres
        : book.genre
          ? [book.genre]
          : [],
      rating: typeof book.rating === "number" ? book.rating : 0,
      reviewCount: typeof book.reviewCount === "number" ? book.reviewCount : 0,
      pageCount: typeof book.pageCount === "number" ? book.pageCount : 0,
      imageUrl: book.imageUrl || book.image || "/images/default-book-cover.jpg",
      buyLinks: book.buyLinks || {},
      readLinks: book.readLinks || {},
    };
  },
};

export const firebasePathUtils = {
  userDoc: (userId: string): string => {
    return `${FIREBASE_COLLECTIONS.USERS}/${userId}`;
  },
  userBookmarks: (userId: string): string => {
    return `${FIREBASE_COLLECTIONS.USERS}/${userId}/${FIREBASE_COLLECTIONS.BOOKMARKS}`;
  },
  userFavorites: (userId: string): string => {
    return `${FIREBASE_COLLECTIONS.USERS}/${userId}/${FIREBASE_COLLECTIONS.FAVORITES}`;
  },
  userPreferences: (userId: string): string => {
    return `${FIREBASE_COLLECTIONS.USERS}/${userId}/${FIREBASE_COLLECTIONS.PREFERENCES}`;
  },
  chatMessages: (chatId: string): string => {
    return `${FIREBASE_COLLECTIONS.CHATS}/${chatId}/${FIREBASE_COLLECTIONS.MESSAGES}`;
  },
  userHistory: (userId: string): string => {
    return `${FIREBASE_COLLECTIONS.USERS}/${userId}/searchHistory`;
  },
  bookmarkDoc: (userId: string, bookId: string): string => {
    return `${FIREBASE_COLLECTIONS.BOOKMARKS}/${userId}_${bookId}`;
  },
  favoriteDoc: (userId: string, bookId: string): string => {
    return `${FIREBASE_COLLECTIONS.FAVORITES}/${userId}_${bookId}`;
  },
  savedForLaterDoc: (userId: string, bookId: string): string => {
    return `${FIREBASE_COLLECTIONS.SAVED_FOR_LATER}/${userId}_${bookId}`;
  },
  userFeedbackDoc: (userId: string, bookId: string): string => {
    return `${FIREBASE_COLLECTIONS.USER_FEEDBACK}/${userId}_${bookId}`;
  },
  readingProgressDoc: (userId: string, bookId: string): string => {
    return `${FIREBASE_COLLECTIONS.USER_READING_PROGRESS}/${userId}_${bookId}`;
  },
  bookRecommendationsDoc: (bookId: string): string => {
    return `${FIREBASE_COLLECTIONS.BOOK_RECOMMENDATIONS}/${bookId}`;
  },
};

export const miscUtils = {
  generateRandomId: (length: number = 10): string => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  getBookDetailUrl: (bookId: string): string => {
    return `/books/${bookId}`;
  },
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;
    return function (...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  safeJsonParse: <T>(json: string, defaultValue: T): T => {
    try {
      return JSON.parse(json) as T;
    } catch {
      return defaultValue;
    }
  },
};

export const cacheUtils = {
  createCacheKey: (query: string, options: SearchOptions): string => {
    const normalizedQuery = query.toLowerCase().trim();
    const optionsStr = JSON.stringify(options);
    // Create a deterministic key that's safe for Firestore document IDs
    return (
      miscUtils.generateRandomId(8) +
      "-" +
      Buffer.from(`${normalizedQuery}-${optionsStr}`)
        .toString("base64")
        .replace(/\//g, "_")
        .replace(/\+/g, "-")
        .replace(/=/g, "")
        .substring(0, 40)
    );
  },
  isCacheExpired: (
    timestamp: Date | null,
    cacheDuration: number = SEARCH.CACHE_DURATION_MS,
  ): boolean => {
    if (!timestamp) return true;
    const now = new Date();
    const cacheAge = now.getTime() - timestamp.getTime();
    return cacheAge > cacheDuration;
  },
};

export const aiUtils = {
  buildPrompt: (query: any, userPreferences?: any): string => {
    return AI_PROMPTS.BOOK_RECOMMENDATION(
      query.text,
      query.genre,
      query.length,
      query.mood,
      userPreferences,
    );
  },
  parseRecommendations: (content: string): BookRecommendation[] => {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }
      const jsonContent = jsonMatch[0];
      const recommendations: any[] = JSON.parse(jsonContent);
      return recommendations.map((book) => ({
        id: generateBookId(book),
        title: book.title || "Unknown Title",
        author: book.author || "Unknown Author",
        publicationDate: book.publicationDate || "Unknown",
        rating: typeof book.rating === "number" ? book.rating : 0,
        reviewCount:
          typeof book.reviewCount === "number" ? book.reviewCount : 0,
        description: book.description || "No description available",
        genres: Array.isArray(book.genres)
          ? book.genres
          : [book.genre || "Unknown"],
        pageCount: typeof book.pageCount === "number" ? book.pageCount : 0,
        imageUrl:
          book.imageUrl || book.coverImage || "/images/default-book-cover.jpg",
        buyLinks: book.buyLinks || {},
        readLinks: book.readLinks || {},
        timestamp: new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },
  getSimilarBooksPrompt: (book: any): string => {
    return AI_PROMPTS.SIMILAR_BOOKS(book);
  },
};

export const firebaseUtils = {
  formatUser: (
    firebaseUser: FirebaseUser,
    preferences: UserPreferences = DEFAULT_VALUES.USER_PREFERENCES,
  ): User => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      isAnonymous: firebaseUser.isAnonymous,
      createdAt: firebaseUser.metadata.creationTime
        ? new Date(firebaseUser.metadata.creationTime).getTime()
        : undefined,
      lastLogin: firebaseUser.metadata.lastSignInTime
        ? new Date(firebaseUser.metadata.lastSignInTime).getTime()
        : undefined,
      preferences,
    };
  },
};

export const exportUtils = {
  exportData: async (
    data: any,
    format: "json" | "txt" | "pdf",
    fileNamePrefix: string,
    textFormatter?: (data: any) => string,
  ): Promise<{ success: boolean; format: string }> => {
    try {
      let content = "";
      let filename = `${fileNamePrefix}-${new Date().toISOString().split("T")[0]}`;
      switch (format) {
        case "json":
          content = JSON.stringify(data, null, 2);
          filename += ".json";
          break;
        case "txt":
          content = textFormatter ? textFormatter(data) : JSON.stringify(data);
          filename += ".txt";
          break;
        case "pdf":
          // Return for component to handle PDF generation
          return { format, success: true };
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      // For non-PDF formats, create and trigger download
      const blob = new Blob([content], {
        type: format === "json" ? "application/json" : "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Clean up
      URL.revokeObjectURL(url);
      return { success: true, format };
    } catch {
      return { success: false, format };
    }
  },
  shareData: async (
    data: any,
    title: string,
    text: string,
  ): Promise<{ success: boolean; method: string }> => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
        return { success: true, method: "navigator.share" };
      }
      // Fallback to clipboard
      let shareText = `${title}\n\n`;
      if (Array.isArray(data)) {
        shareText += data
          .map((item) => {
            if (item.type === "query" || item.type === "result") {
              return `${item.type === "query" ? "Q" : "A"}: ${item.content}`;
            }
            return item.content || JSON.stringify(item);
          })
          .join("\n\n");
      } else {
        shareText += JSON.stringify(data);
      }
      shareText += `\n\nGenerated via: ${url}`;
      await navigator.clipboard.writeText(shareText);
      return { success: true, method: "clipboard" };
    } catch {
      return { success: false, method: "error" };
    }
  },
};

export const reduxUtils = {
  // Common loading/error state pattern for async thunks
  createAsyncThunkReducers: (
    builder: any,
    thunk: any,
    customHandler?: (state: any, action: any) => void,
  ) => {
    builder
      .addCase(thunk.pending, (state: any) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(thunk.fulfilled, (state: any, action: any) => {
        state.loading = false;
        if (customHandler) {
          customHandler(state, action);
        }
      })
      .addCase(thunk.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
  // Helper for creating initial state with common fields
  createInitialState: <T>(stateProps: T) => {
    return {
      loading: false,
      error: null,
      success: null,
      ...stateProps,
    };
  },
  // Normalize book data for consistent storage
  normalizeBook: (book: any) => {
    if (!book) return null;
    return {
      id: book.id,
      title: book.title || "Unknown",
      author: book.author || "Unknown",
      description: book.description || "",
      genres: Array.isArray(book.genres) ? book.genres : [],
      imageUrl: book.imageUrl || "/images/default-book-cover.jpg",
      // Add other essential fields
      ...book,
    };
  },
};

function generateBookId(book: Partial<BookRecommendation>): string {
  const titleStr = (book.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const authorStr = (book.author || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${titleStr}-${authorStr}-${miscUtils.generateRandomId(6)}`;
}
