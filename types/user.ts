export interface UserPreferences {
  favoriteGenres: string[];
  preferredLength?: "short" | "medium" | "long";
  preferredMoods?: string[];
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt?: number;
  lastLogin?: number;
  preferences: UserPreferences;
}

export interface UserHistory {
  userId: string;
  bookId: string;
  progress?: number;
  timestamp: any; // Firestore Timestamp or Date
  action: "view" | "read" | "bookmark" | "favorite" | "feedback";
}

export interface GenrePreference {
  count: number;
  likes: number;
  probability?: number; // likes/count
}

export interface UserPreferenceProbabilities {
  userId: string;
  genrePreferences: Record<string, GenrePreference>;
  lengthPreferences?: Record<string, GenrePreference>;
  moodPreferences?: Record<string, GenrePreference>;
  updatedAt: any; // Firestore Timestamp or Date
}

export type CollectionType = "bookmarks" | "favorites" | "savedForLater";
