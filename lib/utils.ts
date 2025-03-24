/**
 * Utility functions for the book recommender application
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { BOOK, FIREBASE_COLLECTIONS, STORAGE_KEYS } from "./constants";

/**
 * Combine class names with tailwind merge for conditional styling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * String manipulation utilities
 */
export const stringUtils = {
  /**
   * Truncate a string to a maximum length and append ellipsis
   */
  truncate: (str: string, maxLength: number): string => {
    if (!str) return "";

    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  },

  /**
   * Capitalize the first letter of each word in a string
   */
  capitalize: (str: string): string => {
    if (!str) return "";

    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  },

  /**
   * Generate a slug from a string (URL-friendly identifier)
   */
  slugify: (str: string): string => {
    if (!str) return "";

    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  },

  /**
   * Encode a string for use in a URL
   */
  encodeForUrl: (str: string): string => {
    return encodeURIComponent(str);
  },
};

/**
 * Date formatting utilities
 */
export const dateUtils = {
  /**
   * Format a date as a readable string (e.g., "Jan 1, 2023")
   */
  formatDate: (date: Date | string | number): string => {
    if (!date) return "";
    const d = new Date(date);

    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  /**
   * Format a date with time (e.g., "Jan 1, 2023, 12:00 PM")
   */
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

  /**
   * Get a relative time string (e.g., "2 hours ago")
   */
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

/**
 * Validation utilities
 */
export const validationUtils = {
  /**
   * Check if a string is a valid email address
   */
  isValidEmail: (email: string): boolean => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return re.test(email);
  },

  /**
   * Check if a password meets minimum requirements
   */
  isValidPassword: (password: string): boolean => {
    if (!password) return false;

    return password.length >= 6;
  },

  /**
   * Check if a string is empty or only whitespace
   */
  isEmpty: (str: string | null | undefined): boolean => {
    return !str || str.trim() === "";
  },

  /**
   * Check if a value is a valid genre
   */
  isValidGenre: (genre: string): boolean => {
    return BOOK.GENRES.includes(genre);
  },

  /**
   * Check if a value is a valid mood
   */
  isValidMood: (mood: string): boolean => {
    return BOOK.MOODS.includes(mood);
  },

  /**
   * Check if a value is a valid length
   */
  isValidLength: (length: string): boolean => {
    return BOOK.LENGTHS.some((l) => l.value === length);
  },
};

/**
 * Local storage utilities
 */
export const storageUtils = {
  /**
   * Save data to local storage
   */
  saveItem: <T>(key: string, data: T): void => {
    if (typeof window === "undefined") return;
    try {
      const serializedData = JSON.stringify(data);

      localStorage.setItem(key, serializedData);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },

  /**
   * Get data from local storage
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const serializedData = localStorage.getItem(key);

      return serializedData ? JSON.parse(serializedData) : defaultValue;
    } catch (error) {
      console.error("Error getting from localStorage:", error);

      return defaultValue;
    }
  },

  /**
   * Remove data from local storage
   */
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  },

  /**
   * Save guest user bookmarks
   */
  saveGuestBookmarks: (bookmarks: any[]): void => {
    storageUtils.saveItem(STORAGE_KEYS.GUEST_BOOKMARKS, bookmarks);
  },

  /**
   * Get guest user bookmarks
   */
  getGuestBookmarks: (): any[] => {
    return storageUtils.getItem<any[]>(STORAGE_KEYS.GUEST_BOOKMARKS, []);
  },

  /**
   * Save search history for guest users
   */
  saveSearchHistory: (history: any[]): void => {
    storageUtils.saveItem(STORAGE_KEYS.SEARCH_HISTORY, history);
  },

  /**
   * Get search history for guest users
   */
  getSearchHistory: (): any[] => {
    return storageUtils.getItem<any[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
  },
};

/**
 * Array and data processing utilities
 */
export const arrayUtils = {
  /**
   * Chunk an array into smaller arrays of a specified size
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    if (!array || !Array.isArray(array)) return [];

    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size),
    );
  },

  /**
   * Sort an array of objects by a specified property
   */
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

  /**
   * Group an array of objects by a specified property
   */
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

/**
 * Book-related utilities
 */
export const bookUtils = {
  /**
   * Create a formatted external link for a book
   */
  createExternalLink: (
    site: keyof typeof BOOK.EXTERNAL_SITES,
    book: { title: string; author: string },
  ): string => {
    const baseUrl = BOOK.EXTERNAL_SITES[site];
    const searchQuery = `${book.title} ${book.author}`;

    return `${baseUrl}${stringUtils.encodeForUrl(searchQuery)}`;
  },

  /**
   * Format a book rating (e.g., 4.5 -> "4.5/5")
   */
  formatRating: (rating: number): string => {
    if (!rating && rating !== 0) return "N/A";

    return `${rating.toFixed(1)}/5`;
  },

  /**
   * Format the number of reviews (e.g., 1234 -> "1.2K reviews")
   */
  formatReviewCount: (count: number): string => {
    if (!count && count !== 0) return "No reviews";
    if (count < 1000) return `${count} reviews`;

    return `${(count / 1000).toFixed(1)}K reviews`;
  },

  /**
   * Generate a description preview for a book
   */
  getDescriptionPreview: (
    description: string,
    maxLength: number = 150,
  ): string => {
    return stringUtils.truncate(description, maxLength);
  },
};

/**
 * Firebase path utilities
 */
export const firebasePathUtils = {
  /**
   * Generate a path to a user's document
   */
  userDoc: (userId: string): string => {
    return `${FIREBASE_COLLECTIONS.USERS}/${userId}`;
  },

  /**
   * Generate a path to a user's bookmarks collection
   */
  userBookmarks: (userId: string): string => {
    return `${FIREBASE_COLLECTIONS.USERS}/${userId}/${FIREBASE_COLLECTIONS.BOOKMARKS}`;
  },

  /**
   * Generate a path to a user's favorites collection
   */
  userFavorites: (userId: string): string => {
    return `${FIREBASE_COLLECTIONS.USERS}/${userId}/${FIREBASE_COLLECTIONS.FAVORITES}`;
  },

  /**
   * Generate a path to a user's preferences document
   */
  userPreferences: (userId: string): string => {
    return `${FIREBASE_COLLECTIONS.USERS}/${userId}/${FIREBASE_COLLECTIONS.PREFERENCES}`;
  },

  /**
   * Generate a path to a chat's messages collection
   */
  chatMessages: (chatId: string): string => {
    return `${FIREBASE_COLLECTIONS.CHATS}/${chatId}/${FIREBASE_COLLECTIONS.MESSAGES}`;
  },
};

/**
 * Miscellaneous utilities
 */
export const miscUtils = {
  /**
   * Generate a random ID for temporary use
   */
  generateRandomId: (length: number = 10): string => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  },

  /**
   * Generate a URL for the book detail page
   */
  getBookDetailUrl: (bookId: string): string => {
    return `/books/${bookId}`;
  },

  /**
   * Create a debounced function
   */
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

  /**
   * Safely parse JSON, returning a default value if parsing fails
   */
  safeJsonParse: <T>(json: string, defaultValue: T): T => {
    try {
      return JSON.parse(json) as T;
    } catch (error) {
      return defaultValue;
    }
  },
};
