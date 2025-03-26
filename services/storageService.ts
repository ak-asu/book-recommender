import { STORAGE_KEYS } from "@/lib/constants";
import { ConversationItem } from "@/types/search";
import { Message } from "@/types/chat";
import { logError } from "@/lib/errorHandler";

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

export function saveUserAuth(token: string): void {
  setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

export function getUserAuth(): string | null {
  return getItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
}

export function clearUserAuth(): void {
  removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

export function saveTheme(theme: "light" | "dark"): void {
  setItem(STORAGE_KEYS.THEME, theme);
}

export function getTheme(): "light" | "dark" {
  return getItem<"light" | "dark">(STORAGE_KEYS.THEME, "light");
}

export function saveGuestBookmarks(bookmarks: any[]): void {
  setItem(STORAGE_KEYS.GUEST_BOOKMARKS, bookmarks);
}

export function getGuestBookmarks(): any[] {
  return getItem<any[]>(STORAGE_KEYS.GUEST_BOOKMARKS, []);
}

export function saveSearchHistory(history: any[]): void {
  setItem(STORAGE_KEYS.SEARCH_HISTORY, history);
}

export function getSearchHistory(): any[] {
  return getItem<any[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
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
