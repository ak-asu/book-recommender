import { CollectionItem } from "./collectionsService";

import { ConversationItem } from "@/types/search";
import { Message } from "@/types/chat";
import { logError } from "@/lib/errorHandler";

// Local storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER: "user",
  USER_PREFERENCES: "user_preferences",
  THEME: "theme",
  GUEST_BOOKMARKS: "guest_bookmarks",
  SEARCH_HISTORY: "search_history",
  CONVERSATION: "conversation",
  CHAT_SESSIONS: "chat_sessions",
  CHAT_SESSION_PREFIX: "chat_session_",
};

// Maximum number of items to keep in history
const MAX_HISTORY_ITEMS = 20;

// Type-safe wrapper for localStorage operations
export function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    logError(error, `StorageService: Failed to save to ${key}`);
  }
}

// Get an item from localStorage with proper typing and error handling
export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) return defaultValue;
    return JSON.parse(serialized) as T;
  } catch (error) {
    logError(error, `StorageService: Failed to retrieve from ${key}`);
    return defaultValue;
  }
}

export function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logError(error, `StorageService: Failed to remove ${key}`);
  }
}

export function hasItem(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) !== null;
}

export function getUserAuth(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!storedData) return null;
    const tokenData = JSON.parse(storedData);
    // Check if token has expired
    if (tokenData.expiry < Date.now()) {
      clearUserAuth();
      return null;
    }
    // Verify browser fingerprint hasn't changed (could indicate token theft)
    const currentFingerprint = generateBrowserFingerprint();
    if (tokenData.fingerprint !== currentFingerprint) {
      // console.warn("Security warning: Browser fingerprint mismatch");
      clearUserAuth();
      return null;
    }
    // Check if the session cookie is still present
    if (document.cookie && !document.cookie.includes("sessionActive=true")) {
      // console.warn("Session cookie not found, possible security issue");
      clearUserAuth();
      return null;
    }
    return tokenData.value;
  } catch {
    return null;
  }
}

export function saveUserAuth(token: string): void {
  if (typeof window === "undefined") return;
  try {
    // Store the token with an expiration
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour expiry
    const tokenData = {
      value: token,
      expiry: expiry.getTime(),
      fingerprint: generateBrowserFingerprint(), // Add a browser fingerprint
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(tokenData));
    // Also set a session cookie if possible (more secure but shorter-lived)
    if (document.cookie) {
      // Set a session identifier (not the actual token)
      document.cookie = `sessionActive=true; path=/; SameSite=Strict; secure`;
    }
  } catch {}
}

export function clearUserAuth(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {}
}

// Generate a simple browser fingerprint to detect if token is used from different browser
function generateBrowserFingerprint(): string {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
  ].join("||");
  // Create a hash of the fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = (hash << 5) - hash + fingerprint.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

export function getGuestBookmarks(): CollectionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const bookmarks = localStorage.getItem(STORAGE_KEYS.GUEST_BOOKMARKS);
    return bookmarks ? JSON.parse(bookmarks) : [];
  } catch {
    return [];
  }
}

export function saveGuestBookmarks(bookmarks: CollectionItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.GUEST_BOOKMARKS,
      JSON.stringify(bookmarks),
    );
  } catch {}
}

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const history = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

// Add a search query to history
export function addToSearchHistory(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const history = getSearchHistory();
    // Remove duplicates and add new query to beginning
    const updatedHistory = [
      query,
      ...history.filter((item) => item !== query),
    ].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(
      STORAGE_KEYS.SEARCH_HISTORY,
      JSON.stringify(updatedHistory),
    );
  } catch {}
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch {}
}

export function getUserPreferences(): any {
  if (typeof window === "undefined") return {};
  try {
    const preferences = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return preferences ? JSON.parse(preferences) : {};
  } catch {
    return {};
  }
}

export function saveUserPreferences(preferences: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.USER_PREFERENCES,
      JSON.stringify(preferences),
    );
  } catch {}
}

export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function saveTheme(theme: "light" | "dark"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {}
}

export function saveConversation(conversation: ConversationItem[]): void {
  setItem(STORAGE_KEYS.CONVERSATION, conversation);
}

export function getConversation(): ConversationItem[] {
  return getItem<ConversationItem[]>(STORAGE_KEYS.CONVERSATION, []);
}

export function saveChatMessages(sessionId: string, messages: Message[]): void {
  try {
    setItem(`${STORAGE_KEYS.CHAT_SESSION_PREFIX}${sessionId}`, messages);
    const sessions = getItem<any[]>(STORAGE_KEYS.CHAT_SESSIONS, []);
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
    const sessionInfo = {
      id: sessionId,
      title:
        messages.length > 0
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
    setItem(STORAGE_KEYS.CHAT_SESSIONS, sessions);
  } catch (error) {
    logError(
      error,
      `StorageService: Failed to save chat messages for ${sessionId}`,
    );
  }
}

export function getChatMessages(sessionId: string): Message[] {
  return getItem<Message[]>(
    `${STORAGE_KEYS.CHAT_SESSION_PREFIX}${sessionId}`,
    [],
  );
}

export function getChatSessions(): any[] {
  return getItem<any[]>(STORAGE_KEYS.CHAT_SESSIONS, []);
}

export function clearAllChatData(): void {
  const sessions = getChatSessions();
  // Remove all session data
  for (const session of sessions) {
    removeItem(`${STORAGE_KEYS.CHAT_SESSION_PREFIX}${session.id}`);
  }
  // Remove sessions list
  removeItem(STORAGE_KEYS.CHAT_SESSIONS);
}

export function clearAllUserData(): void {
  removeItem(STORAGE_KEYS.AUTH_TOKEN);
  removeItem(STORAGE_KEYS.USER);
  removeItem(STORAGE_KEYS.GUEST_BOOKMARKS);
  removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  removeItem(STORAGE_KEYS.CONVERSATION);
  clearAllChatData();
}

export function clearAllStorage(): void {
  if (typeof window === "undefined") return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {}
}
