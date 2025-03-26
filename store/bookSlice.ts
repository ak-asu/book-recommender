import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "./store";

import { Book, Review } from "@/types/book";
import { SearchOptions } from "@/types/search";
import { ACTION_TYPES } from "@/lib/constants";
import { reduxUtils } from "@/lib/utils";
import * as bookService from "@/services/bookService";
import * as userService from "@/services/userService";

interface BookState {
  books: Book[];
  recommendedBooks: Book[];
  similarBooks: Book[];
  searchHistory: { query: string; options: SearchOptions; timestamp: number }[];
  currentSearch: string;
  currentSearchOptions: SearchOptions;
  bookmarks: Book[];
  savedForLater: Book[];
  favorites: Book[];
  loading: boolean;
  error: string | null;
  currentBookDetail: Book | null;
  reviews: Review[];
}

const initialState: BookState = reduxUtils.createInitialState({
  books: [],
  recommendedBooks: [],
  similarBooks: [],
  searchHistory: [],
  currentSearch: "",
  currentSearchOptions: {},
  bookmarks: [],
  savedForLater: [],
  favorites: [],
  currentBookDetail: null,
  reviews: [],
});

export const fetchPopularBooks = createAsyncThunk(
  ACTION_TYPES.BOOK.FETCH_POPULAR,
  async (_, { rejectWithValue }) => {
    try {
      const result = await bookService.getPopularBooks();
      return result.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const fetchUserBookmarks = createAsyncThunk(
  ACTION_TYPES.BOOK.FETCH_USER_BOOKMARKS,
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const bookmarks = await userService.getUserCollection(
        userId,
        "bookmarks",
      );
      const favorites = await userService.getUserCollection(
        userId,
        "favorites",
      );
      const savedForLater = await userService.getUserCollection(
        userId,
        "savedForLater",
      );
      return {
        bookmarks,
        favorites,
        savedForLater,
      };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const searchBooks = createAsyncThunk(
  ACTION_TYPES.BOOK.SEARCH,
  async (
    { query, options }: { query: string; options: SearchOptions },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch("/api/search-books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, options }),
      });
      if (!response.ok) {
        throw new Error("Failed to search books");
      }
      const data = await response.json();
      return data.books as Book[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const fetchBookDetail = createAsyncThunk(
  ACTION_TYPES.BOOK.FETCH_DETAIL,
  async (bookId: string, { rejectWithValue }) => {
    try {
      return await bookService.getBookById(bookId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const fetchSimilarBooks = createAsyncThunk(
  ACTION_TYPES.BOOK.FETCH_SIMILAR,
  async (bookId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const bookDetails = state.book.currentBookDetail;
      if (!bookDetails) {
        throw new Error("Book details not available");
      }
      return await bookService.getSimilarBooks(bookId, bookDetails);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const bookmarkBook = createAsyncThunk(
  ACTION_TYPES.BOOK.BOOKMARK,
  async (
    { book, type }: { book: Book; type: "bookmark" | "favorite" | "later" },
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      await userService.addToCollection(userId, book.id, type as any);
      return { book, type };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const removeBookmarkAsync = createAsyncThunk(
  ACTION_TYPES.BOOK.REMOVE_BOOKMARK,
  async (
    {
      bookId,
      type,
    }: { bookId: string; type: "bookmark" | "favorite" | "later" },
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      await userService.removeFromCollection(userId, bookId, type as any);
      return { bookId, type };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const submitReview = createAsyncThunk(
  ACTION_TYPES.BOOK.SUBMIT_REVIEW,
  async (
    {
      bookId,
      rating,
      comment,
    }: {
      bookId: string;
      rating: number;
      comment: string;
    },
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      const username = state.user?.user?.displayName || "Anonymous";
      if (!userId) {
        throw new Error("User not authenticated");
      }
      return await bookService.addBookReview({
        bookId,
        userId,
        userName: username,
        rating,
        text: comment,
      });
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const fetchBookReviews = createAsyncThunk(
  ACTION_TYPES.BOOK.FETCH_REVIEWS,
  async (bookId: string, { rejectWithValue }) => {
    try {
      return await bookService.getBookReviews(bookId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const regenerateRecommendations = createAsyncThunk(
  ACTION_TYPES.BOOK.REGENERATE,
  async (
    { query, options }: { query: string; options: SearchOptions },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch("/api/search-books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, options, regenerate: true }),
      });
      if (!response.ok) {
        throw new Error("Failed to regenerate recommendations");
      }
      const data = await response.json();
      return data.books as Book[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const provideFeedbackAsync = createAsyncThunk(
  ACTION_TYPES.BOOK.PROVIDE_FEEDBACK,
  async (
    { bookId, liked }: { bookId: string; liked: boolean },
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      // For guest users, just return the feedback without storing
      if (!userId) {
        return { bookId, liked, success: true };
      }
      // For authenticated users, record feedback
      await userService.recordUserFeedback(
        userId,
        bookId,
        liked ? "like" : "dislike",
      );
      return { bookId, liked, success: true };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const bookSlice = createSlice({
  name: "books",
  initialState,
  reducers: {
    setCurrentSearch: (state, action: PayloadAction<string>) => {
      state.currentSearch = action.payload;
    },
    setSearchOptions: (state, action: PayloadAction<SearchOptions>) => {
      state.currentSearchOptions = action.payload;
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    removeBookmark: (
      state,
      action: PayloadAction<{
        id: string;
        type: "bookmark" | "favorite" | "later";
      }>,
    ) => {
      const { id, type } = action.payload;
      if (type === "favorite") {
        state.favorites = state.favorites.filter((book) => book.id !== id);
      } else if (type === "later") {
        state.savedForLater = state.savedForLater.filter(
          (book) => book.id !== id,
        );
      } else {
        state.bookmarks = state.bookmarks.filter((book) => book.id !== id);
      }
    },
    clearCurrentBookDetail: (state) => {
      state.currentBookDetail = null;
      state.similarBooks = [];
      state.reviews = [];
    },
    provideFeedback: (
      _state,
      _action: PayloadAction<{ bookId: string; liked: boolean }>,
    ) => {
      // This is now a direct action without the async part
      // It can be used for immediate UI feedback before provideFeedbackAsync completes
    },
  },
  extraReducers: (builder) => {
    reduxUtils.createAsyncThunkReducers(
      builder,
      fetchPopularBooks,
      (state, action) => {
        state.books = action.payload;
      },
    );
    reduxUtils.createAsyncThunkReducers(
      builder,
      fetchUserBookmarks,
      (state, action) => {
        state.bookmarks = action.payload.bookmarks;
        state.favorites = action.payload.favorites;
        state.savedForLater = action.payload.savedForLater;
      },
    );
    reduxUtils.createAsyncThunkReducers(
      builder,
      searchBooks,
      (state, action) => {
        state.recommendedBooks = action.payload;
        state.searchHistory.push({
          query: state.currentSearch,
          options: state.currentSearchOptions,
          timestamp: Date.now(),
        });
      },
    );
    reduxUtils.createAsyncThunkReducers(
      builder,
      fetchBookDetail,
      (state, action) => {
        state.currentBookDetail = action.payload;
      },
    );
    reduxUtils.createAsyncThunkReducers(
      builder,
      fetchSimilarBooks,
      (state, action) => {
        state.similarBooks = action.payload;
      },
    );
    reduxUtils.createAsyncThunkReducers(
      builder,
      fetchBookReviews,
      (state, action) => {
        state.reviews = action.payload;
      },
    );
    reduxUtils.createAsyncThunkReducers(
      builder,
      regenerateRecommendations,
      (state, action) => {
        state.recommendedBooks = action.payload;
      },
    );
    builder
      .addCase(bookmarkBook.fulfilled, (state, action) => {
        const { book, type } = action.payload;
        if (type === "favorite") {
          if (!state.favorites.some((b) => b.id === book.id)) {
            state.favorites.push(book);
          }
        } else if (type === "later") {
          if (!state.savedForLater.some((b) => b.id === book.id)) {
            state.savedForLater.push(book);
          }
        } else {
          if (!state.bookmarks.some((b) => b.id === book.id)) {
            state.bookmarks.push(book);
          }
        }
      })
      .addCase(removeBookmarkAsync.fulfilled, (state, action) => {
        const { bookId, type } = action.payload;
        if (type === "favorite") {
          state.favorites = state.favorites.filter(
            (book) => book.id !== bookId,
          );
        } else if (type === "later") {
          state.savedForLater = state.savedForLater.filter(
            (book) => book.id !== bookId,
          );
        } else {
          state.bookmarks = state.bookmarks.filter(
            (book) => book.id !== bookId,
          );
        }
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.reviews.unshift(action.payload);
      });
  },
});

export const {
  setCurrentSearch,
  setSearchOptions,
  clearSearchHistory,
  removeBookmark,
  clearCurrentBookDetail,
  provideFeedback,
} = bookSlice.actions;

export const selectBooks = (state: RootState) => state.book.books;
export const selectRecommendedBooks = (state: RootState) =>
  state.book.recommendedBooks;
export const selectSimilarBooks = (state: RootState) => state.book.similarBooks;
export const selectSearchHistory = (state: RootState) =>
  state.book.searchHistory;
export const selectCurrentSearch = (state: RootState) =>
  state.book.currentSearch;
export const selectCurrentSearchOptions = (state: RootState) =>
  state.book.currentSearchOptions;
export const selectBookmarks = (state: RootState) => state.book.bookmarks;
export const selectFavorites = (state: RootState) => state.book.favorites;
export const selectSavedForLater = (state: RootState) =>
  state.book.savedForLater;
export const selectLoading = (state: RootState) => state.book.loading;
export const selectError = (state: RootState) => state.book.error;
export const selectCurrentBookDetail = (state: RootState) =>
  state.book.currentBookDetail;
export const selectReviews = (state: RootState) => state.book.reviews;

export default bookSlice.reducer;
