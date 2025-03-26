// API and service configurations
export const API = {
  OPENAI: {
    MODEL: "gpt-3.5-turbo-1106", // Or 'gpt-4' for better quality if budget allows
    TEMPERATURE: 0.7,
    MAX_TOKENS: 1000,
  },
  REQUESTS: {
    TIMEOUT_MS: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  },
};

// Firebase collection names
export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  BOOKS: "books",
  REVIEWS: "reviews",
  USER_HISTORY: "userHistory",
  USER_FEEDBACK: "userFeedback",
  USER_PREFERENCES: "userPreferences",
  BOOKMARKS: "bookmarks",
  FAVORITES: "favorites",
  SAVED_FOR_LATER: "savedForLater",
  CHAT_SESSIONS: "chatSessions",
  CHAT_MESSAGES: "chatMessages",
  ANONYMOUS_CHATS: "anonymousChats",
  SHARED_CHATS: "sharedChats",
  SEARCH_CACHE: "searchCache",
  SEARCH_STATS: "searchStats",
  BOOK_RECOMMENDATIONS: "bookRecommendations",
};

// Search configuration
export const SEARCH = {
  MAX_RESULTS: 20,
  POPULAR_BOOKS_LIMIT: 12,
  RECOMMENDATION_COUNT: 6,
  MIN_SEARCH_LENGTH: 3,
  CACHE_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
};

// Collection configurations for user collections (bookmarks, favorites, etc.)
export const COLLECTION_CONFIG = {
  bookmarks: {
    collectionName: FIREBASE_COLLECTIONS.BOOKMARKS,
    userField: "bookmarks",
    historyAction: "bookmark",
  },
  favorites: {
    collectionName: FIREBASE_COLLECTIONS.FAVORITES,
    userField: "favorites",
    historyAction: "favorite",
  },
  savedForLater: {
    collectionName: FIREBASE_COLLECTIONS.SAVED_FOR_LATER,
    userField: "savedForLater",
    historyAction: "savedForLater",
  },
};

// Default values
export const DEFAULT_VALUES = {
  USER_PREFERENCES: {
    favoriteGenres: [],
    darkMode: false,
    notificationsEnabled: true,
  },
};

// Chat/message types
export enum MessageType {
  USER = "user",
  ASSISTANT = "assistant",
}

// Standard error and success messages
export const MESSAGES = {
  ERRORS: {
    AUTH: {
      EMAIL_IN_USE:
        "This email is already registered. Please try logging in or use a different email.",
      WEAK_PASSWORD:
        "Please use a stronger password. Passwords should be at least 6 characters long.",
      INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
      UNAUTHORIZED: "You must be logged in to perform this action.",
      EXPIRED_SESSION: "Your session has expired. Please log in again.",
    },
    BOOK: {
      NOT_FOUND: "The requested book could not be found.",
      REVIEW_EXISTS: "You have already reviewed this book.",
      INVALID_RATING: "Rating must be between 1 and 5 stars.",
    },
    RECOMMENDATIONS: {
      FAILED: "Failed to get book recommendations.",
    },
    SEARCH: {
      EMPTY: "Please enter a search term.",
      TOO_SHORT: "Search query is too short. Please use at least 3 characters.",
      NO_RESULTS: "No books found matching your search criteria.",
    },
    API: {
      GENERAL:
        "An error occurred while processing your request. Please try again later.",
      RATE_LIMIT:
        "You've made too many requests. Please try again in a few minutes.",
      NOT_FOUND: "The requested resource could not be found.",
    },
  },
  SUCCESS: {
    AUTH: {
      REGISTER: "Account successfully created. Welcome!",
      LOGIN: "Successfully logged in.",
      LOGOUT: "Successfully logged out.",
      PASSWORD_RESET: "Password reset email sent. Please check your inbox.",
    },
    BOOK: {
      REVIEW_ADDED: "Your review has been successfully added.",
      ADDED_TO_COLLECTION: "Book added to your collection.",
      REMOVED_FROM_COLLECTION: "Book removed from your collection.",
    },
    USER: {
      PREFERENCES_UPDATED: "Your preferences have been updated.",
      FEEDBACK_RECORDED: "Your feedback has been recorded. Thank you!",
    },
  },
};

// AI Prompt templates
export const AI_PROMPTS = {
  BOOK_RECOMMENDATION: (
    query: string,
    genre?: string,
    length?: string,
    mood?: string,
    userPreferences?: any,
  ) => {
    let prompt = `Please recommend books based on the following query: "${query}".\n`;
    if (genre) {
      prompt += `Focus on the ${genre} genre.\n`;
    }
    if (length) {
      prompt += `I prefer ${length} books.\n`;
    }
    if (mood) {
      prompt += `I'm looking for books with a ${mood} mood or atmosphere.\n`;
    }
    if (userPreferences) {
      if (userPreferences.favoriteGenres?.length > 0) {
        prompt += `I generally enjoy these genres: ${userPreferences.favoriteGenres.join(", ")}.\n`;
      }
      if (userPreferences.preferredLength) {
        prompt += `I typically prefer ${userPreferences.preferredLength} books.\n`;
      }
      if (userPreferences.preferredMoods?.length > 0) {
        prompt += `I often enjoy books with these moods: ${userPreferences.preferredMoods.join(", ")}.\n`;
      }
    }
    prompt += `\nPlease provide 5-8 book recommendations with the following details for each:
    - Title
    - Author
    - Publication date
    - Genre(s)
    - Brief description (100-150 words)
    - Average rating (1-5 scale)
    - Page count (approximate)
    
    Format your response as a JSON array of objects with these fields.`;
    return prompt;
  },
  CHAT_PROMPT: (
    message: string,
    context: string[] = [],
    userPreferences?: any,
  ) => {
    let prompt = "";
    // Add conversation context if available
    if (context.length > 0) {
      prompt += `Previous conversation:\n${context.join("\n")}\n\n`;
    }
    prompt += `User: ${message}\n\n`;
    // Add user preferences if available
    if (userPreferences) {
      prompt +=
        "Consider the following user preferences in your recommendations:\n";
      if (userPreferences.favoriteGenres?.length > 0) {
        prompt += `- Favorite genres: ${userPreferences.favoriteGenres.join(", ")}\n`;
      }
      if (userPreferences.preferredLength) {
        prompt += `- Preferred book length: ${userPreferences.preferredLength}\n`;
      }
      if (userPreferences.preferredMoods?.length > 0) {
        prompt += `- Preferred moods: ${userPreferences.preferredMoods.join(", ")}\n`;
      }
      prompt += "\n";
    }
    prompt += `Assistant: `;
    return prompt;
  },
  SIMILAR_BOOKS: (book: any) => {
    return `Please recommend books similar to "${book.title}" by ${book.author}. 
    This book is in the ${book.genres?.join(", ") || "unknown"} genre(s).
    Brief description: ${book.description || "Not available"}
    
    Please suggest 6 similar books that readers might enjoy, providing the following details for each:
    - Title
    - Author
    - Publication date
    - Genre(s)
    - Brief description of the book
    - Average rating (1-5 scale)
    
    Format your response as a JSON array of objects with these fields.`;
  },
};

export const ACTION_TYPES = {
  USER: {
    REGISTER: "user/register",
    LOGIN: "user/login",
    LOGOUT: "user/logout",
    UPDATE_PREFERENCES: "user/updatePreferences",
    RESET_PASSWORD: "user/resetPassword",
    UPDATE_PROFILE: "user/updateProfile",
  },
  SEARCH: {
    EXPORT: "search/export",
    SHARE: "search/share",
    CLEAR: "search/clear",
    NAVIGATE: "search/navigate",
  },
  CHAT: {
    SEND_MESSAGE: "chat/sendMessage",
    REGENERATE_RESPONSE: "chat/regenerateResponse",
    LOAD_SESSIONS: "chat/loadSessions",
    LOAD_MESSAGES: "chat/loadMessages",
    EXPORT: "chat/export",
    SHARE: "chat/share",
  },
  BOOK: {
    FETCH_POPULAR: "books/fetchPopular",
    SEARCH: "books/search",
    FETCH_DETAIL: "books/fetchDetail",
    FETCH_SIMILAR: "books/fetchSimilar",
    BOOKMARK: "books/bookmark",
    REMOVE_BOOKMARK: "books/removeBookmark",
    SUBMIT_REVIEW: "books/submitReview",
    FETCH_REVIEWS: "books/fetchReviews",
    REGENERATE: "books/regenerate",
    PROVIDE_FEEDBACK: "books/provideFeedback",
    FETCH_USER_BOOKMARKS: "books/fetchUserBookmarks",
  },
  // New common slice for unified conversation handling
  CONVERSATION: {
    ADD_MESSAGE: "conversation/addMessage",
    EXPORT: "conversation/export",
    SHARE: "conversation/share",
    CLEAR: "conversation/clear",
  },
};

export const UI = {
  ANIMATION_DURATION_MS: 300,
  TOAST_DURATION_MS: 5000,
  DEBOUNCE_MS: 300,
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    AVAILABLE_PAGE_SIZES: [5, 10, 20, 50],
  },
};

export const BOOK = {
  GENRES: [
    "Fiction",
    "Non-Fiction",
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Thriller",
    "Romance",
    "Historical Fiction",
    "Biography",
    "Self-Help",
    "Horror",
    "Adventure",
    "Young Adult",
    "Children's",
    "Poetry",
    "Comics & Graphic Novels",
    "Drama",
    "Dystopian",
    "Memoir",
    "True Crime",
  ],
  MOODS: [
    "Happy",
    "Sad",
    "Uplifting",
    "Dark",
    "Funny",
    "Romantic",
    "Thrilling",
    "Relaxing",
    "Inspiring",
    "Thought-provoking",
    "Adventurous",
    "Nostalgic",
    "Mysterious",
    "Emotional",
  ],
  LENGTHS: [
    { name: "Short", value: "short", description: "Less than 300 pages" },
    { name: "Medium", value: "medium", description: "300-500 pages" },
    { name: "Long", value: "long", description: "More than 500 pages" },
  ],
  EXTERNAL_SITES: {
    AMAZON: "https://www.amazon.com/s?k=",
    GOODREADS: "https://www.goodreads.com/search?q=",
    GOOGLE_BOOKS: "https://www.google.com/search?tbm=bks&q=",
    WORLDCAT: "https://www.worldcat.org/search?q=",
    LIBRARY_THING: "https://www.librarything.com/search.php?term=",
  },
};

export const MESSAGE_TYPES = {
  QUERY: "query",
  RESPONSE: "response",
  ERROR: "error",
  RESULT: "result",
};
