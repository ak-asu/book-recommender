/**
 * Application-wide constants
 */

// API endpoints and limits
export const API = {
  OPENAI: {
    MODEL: "gpt-4",
    MAX_TOKENS: 2048,
    TEMPERATURE: 0.7,
  },
  REQUESTS: {
    RETRY_ATTEMPTS: 3,
    TIMEOUT_MS: 30000,
  },
};

// Firebase collection names
export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  BOOKS: "books",
  CHATS: "chats",
  MESSAGES: "messages",
  BOOKMARKS: "bookmarks",
  FAVORITES: "favorites",
  PREFERENCES: "preferences",
  RECOMMENDATIONS: "recommendations",
  FEEDBACK: "feedback",
};

// Search and recommendation defaults
export const SEARCH = {
  DEFAULT_OPTIONS: {
    genres: [],
    mood: "",
    length: "",
  },
  MAX_RESULTS: 20,
  POPULAR_BOOKS_LIMIT: 12,
  MIN_SEARCH_LENGTH: 3,
  RECOMMENDATION_COUNT: 6,
};

// User interface settings
export const UI = {
  ANIMATION_DURATION_MS: 300,
  TOAST_DURATION_MS: 5000,
  DEBOUNCE_MS: 300,
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    AVAILABLE_PAGE_SIZES: [5, 10, 20, 50],
  },
};

// Book-related constants
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

// Message templates
export const MESSAGES = {
  ERRORS: {
    GENERAL: "Something went wrong. Please try again.",
    AUTH: {
      REQUIRED: "You need to be logged in to perform this action.",
      INVALID_CREDENTIALS: "Invalid email or password.",
      EMAIL_IN_USE: "This email address is already in use.",
      WEAK_PASSWORD: "The password must be at least 6 characters long.",
    },
    SEARCH: {
      EMPTY: "Please enter a search term.",
      TOO_SHORT: "Search term must be at least 3 characters long.",
      NO_RESULTS: "No books found matching your search.",
    },
    RECOMMENDATIONS: {
      FAILED: "Failed to get recommendations. Please try again.",
      GENERATION_FAILED:
        "Failed to generate recommendations. Please try again.",
    },
    BOOK: {
      NOT_FOUND: "Book not found.",
      BOOKMARK_FAILED: "Failed to bookmark book. Please try again.",
      FAVORITE_FAILED: "Failed to add book to favorites. Please try again.",
    },
  },
  SUCCESS: {
    AUTH: {
      LOGIN: "You have been successfully logged in.",
      LOGOUT: "You have been successfully logged out.",
      REGISTER: "Your account has been created successfully.",
    },
    BOOK: {
      BOOKMARKED: "Book has been bookmarked successfully.",
      UNBOOKMARKED: "Book has been removed from bookmarks.",
      FAVORITED: "Book has been added to favorites.",
      UNFAVORITED: "Book has been removed from favorites.",
    },
    FEEDBACK: {
      RECEIVED: "Thank you for your feedback!",
    },
    CHAT: {
      EXPORTED: "Chat has been exported successfully.",
      DELETED: "Chat has been deleted successfully.",
      SHARED: "Link has been copied to clipboard.",
    },
  },
  PLACEHOLDERS: {
    SEARCH: "What kind of books are you looking for?",
    CHAT_INPUT: "Ask for book recommendations...",
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  THEME: "book-recommender-theme",
  USER: "book-recommender-user",
  AUTH_TOKEN: "book-recommender-auth-token",
  SEARCH_HISTORY: "book-recommender-search-history",
  GUEST_BOOKMARKS: "book-recommender-guest-bookmarks",
};

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  LOGOUT: "/logout",
  ACCOUNT: "/account",
  BOOK_DETAILS: "/books",
  CHAT: "/chat",
  ABOUT: "/about",
  BOOKMARKS: "/bookmarks",
  RESET_PASSWORD: "/reset-password",
};
