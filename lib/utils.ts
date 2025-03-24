import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { BOOK, FIREBASE_COLLECTIONS, STORAGE_KEYS } from "./constants";

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
