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
  USER_HISTORY: "userHistory",
  USER_READING_PROGRESS: "userReadingProgress",
  USER_PREFERENCES: "userPreferences",
  USER_FEEDBACK: "userFeedback",
  SEARCH_CACHE: "searchCache",
  SEARCH_STATS: "searchStats",
  BOOK_RECOMMENDATIONS: "bookRecommendations",
  REVIEWS: "reviews",
  SAVED_FOR_LATER: "savedForLater",
};

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
  PAGINATION_SIZE: 10,
  CACHE_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
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

export const STORAGE_KEYS = {
  THEME: "book-recommender-theme",
  USER: "book-recommender-user",
  AUTH_TOKEN: "book-recommender-auth-token",
  SEARCH_HISTORY: "book-recommender-search-history",
  GUEST_BOOKMARKS: "book-recommender-guest-bookmarks",
  CONVERSATION: "bookRecommenderConversation",
  CHAT_SESSION_PREFIX: "bookRecommenderChat_",
  CHAT_SESSIONS: "bookRecommenderSessions",
};

export const DEFAULT_VALUES = {
  USER_PREFERENCES: {
    favoriteGenres: [],
    darkMode: false,
    notificationsEnabled: true,
  },
  EXPORT_FORMATS: ["json", "txt", "pdf"] as const,
};

export const ACTION_TYPES = {
  USER: {
    REGISTER: "user/register",
    LOGIN: "user/login",
    GOOGLE_LOGIN: "user/googleLogin",
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

export const MESSAGE_TYPES = {
  QUERY: "query",
  RESPONSE: "response",
  ERROR: "error",
  RESULT: "result",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  LOGOUT: "/logout",
  ACCOUNT: "/account",
  BOOK_DETAILS: "/books",
  CHAT: "/chat",
  ABOUT: "/about",
};

export const COLLECTION_CONFIG = {
  bookmarks: {
    userField: "bookmarks",
    collectionName: FIREBASE_COLLECTIONS.BOOKMARKS,
    historyAction: "bookmark",
  },
  favorites: {
    userField: "favorites",
    collectionName: FIREBASE_COLLECTIONS.FAVORITES,
    historyAction: "favorite",
  },
  savedForLater: {
    userField: "savedForLater",
    collectionName: FIREBASE_COLLECTIONS.SAVED_FOR_LATER,
  },
};

export const AI_PROMPTS = {
  SYSTEM_ROLE:
    "You are a knowledgeable literary assistant that recommends books. Provide recommendations as structured JSON data.",
  BOOK_RECOMMENDATION: (
    text: string,
    genre?: string,
    length?: string,
    mood?: string,
    userPreferences?: any,
  ): string => {
    let prompt = `Recommend books that match the following criteria: ${text}`;
    if (genre) prompt += ` in the ${genre} genre`;
    if (length) prompt += ` that are ${length} in length`;
    if (mood) prompt += ` with a ${mood} mood`;
    if (userPreferences) {
      prompt += `. Consider that the user has shown preference for `;
      if (userPreferences.favoriteGenres?.length) {
        prompt += `genres like ${userPreferences.favoriteGenres.join(", ")}, `;
      }
      if (userPreferences.preferredLength) {
        prompt += `${userPreferences.preferredLength} length books, `;
      }
      if (userPreferences.preferredMoods?.length) {
        prompt += `moods like ${userPreferences.preferredMoods.join(", ")}`;
      }
    }
    prompt += `. For each book, provide the following information in valid JSON format: 
      title, author, publicationDate, rating (1-5), reviewCount, description, genres (array), pageCount, 
      imageUrl (a URL if available), and where to purchase or read the book as buyLinks and readLinks objects. 
      Return at least 5 books if possible. Format your response as a JSON array of book objects.`;
    return prompt;
  },
  SIMILAR_BOOKS: (book: any): string => {
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
