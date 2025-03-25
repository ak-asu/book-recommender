import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  orderBy,
  limit,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import { RootState } from "./store";

import { firestore } from "@/lib/firebase";
import { Book, Review } from "@/types/book";
import { SearchOptions } from "@/types/search";
import { ACTION_TYPES, FIREBASE_COLLECTIONS } from "@/lib/constants";
import { reduxUtils } from "@/lib/utils";

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
      const booksRef = collection(firestore, FIREBASE_COLLECTIONS.BOOKS);
      const q = query(booksRef, orderBy("ranking", "asc"), limit(20));
      const querySnapshot = await getDocs(q);
      const books: Book[] = [];
      querySnapshot.forEach((doc) => {
        books.push(reduxUtils.normalizeBook({ id: doc.id, ...doc.data() }));
      });
      return books;
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
      const bookmarksPromise = getDocs(
        collection(firestore, "users", userId, "bookmarks"),
      );
      const favoritesPromise = getDocs(
        collection(firestore, "users", userId, "favorites"),
      );
      const savedForLaterPromise = getDocs(
        collection(firestore, "users", userId, "savedForLater"),
      );
      const [bookmarksSnapshot, favoritesSnapshot, savedForLaterSnapshot] =
        await Promise.all([
          bookmarksPromise,
          favoritesPromise,
          savedForLaterPromise,
        ]);
      const bookmarkIds = bookmarksSnapshot.docs.map(
        (doc) => doc.data().bookId,
      );
      const favoriteIds = favoritesSnapshot.docs.map(
        (doc) => doc.data().bookId,
      );
      const savedForLaterIds = savedForLaterSnapshot.docs.map(
        (doc) => doc.data().bookId,
      );
      const allBookIds = Array.from(
        new Set([...bookmarkIds, ...favoriteIds, ...savedForLaterIds]),
      );
      const booksRef = collection(firestore, "books");
      const q = query(booksRef, where("id", "in", allBookIds));
      const booksSnapshot = await getDocs(q);
      const books: { [id: string]: any } = {};
      booksSnapshot.forEach((doc) => {
        books[doc.id] = reduxUtils.normalizeBook({ id: doc.id, ...doc.data() });
      });
      return {
        bookmarks: bookmarkIds.map((id) => books[id]).filter(Boolean),
        favorites: favoriteIds.map((id) => books[id]).filter(Boolean),
        savedForLater: savedForLaterIds.map((id) => books[id]).filter(Boolean),
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
      const docSnap = await getDocs(
        query(collection(firestore, "books"), where("id", "==", bookId)),
      );
      if (docSnap.empty) {
        throw new Error("Book not found");
      }
      return { id: docSnap.docs[0].id, ...docSnap.docs[0].data() } as Book;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const fetchSimilarBooks = createAsyncThunk(
  ACTION_TYPES.BOOK.FETCH_SIMILAR,
  async (bookId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/similar-books?bookId=${bookId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch similar books");
      }
      const data = await response.json();
      return data.books as Book[];
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
      const collectionName =
        type === "favorite"
          ? "favorites"
          : type === "later"
            ? "savedForLater"
            : "bookmarks";
      const bookmarksRef = collection(
        firestore,
        "users",
        userId,
        collectionName,
      );
      await addDoc(bookmarksRef, {
        bookId: book.id,
        timestamp: Date.now(),
      });
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
      const collectionName =
        type === "favorite"
          ? "favorites"
          : type === "later"
            ? "savedForLater"
            : "bookmarks";
      const bookmarksRef = collection(
        firestore,
        "users",
        userId,
        collectionName,
      );
      const q = query(bookmarksRef, where("bookId", "==", bookId));
      const querySnapshot = await getDocs(q);
      // Delete all matching bookmarks
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref),
      );
      await Promise.all(deletePromises);
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
      const reviewRef = collection(firestore, "reviews");
      const newReview = {
        bookId,
        userId,
        username,
        rating,
        comment,
        createdAt: Date.now(),
      };
      const docRef = await addDoc(reviewRef, newReview);
      return {
        id: docRef.id,
        ...newReview,
      } as Review;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const fetchBookReviews = createAsyncThunk(
  ACTION_TYPES.BOOK.FETCH_REVIEWS,
  async (bookId: string, { rejectWithValue }) => {
    try {
      const reviewsRef = collection(firestore, "reviews");
      const q = query(
        reviewsRef,
        where("bookId", "==", bookId),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];
      querySnapshot.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() } as Review);
      });
      return reviews;
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
      // For authenticated users, store feedback in Firebase
      const feedbackRef = collection(firestore, "users", userId, "feedback");
      await setDoc(doc(feedbackRef, bookId), {
        bookId,
        liked,
        timestamp: Date.now(),
      });
      // Also send the feedback to update recommendation model
      await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, bookId, liked }),
      });
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
      state,
      action: PayloadAction<{ bookId: string; liked: boolean }>,
    ) => {
      // This is now a direct action without the async part
      // It can be used for immediate UI feedback before provideFeedbackAsync completes
      const { bookId } = action.payload;
      const book = state.recommendedBooks.find((b) => b.id === bookId);
      if (book) {
        // Optional: Update any UI feedback state here if needed
      }
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
    builder
      .addCase(fetchPopularBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPopularBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload;
      })
      .addCase(fetchPopularBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendedBooks = action.payload;
        state.searchHistory.push({
          query: state.currentSearch,
          options: state.currentSearchOptions,
          timestamp: Date.now(),
        });
      })
      .addCase(searchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchBookDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBookDetail = action.payload;
      })
      .addCase(fetchBookDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSimilarBooks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSimilarBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.similarBooks = action.payload;
      })
      .addCase(fetchSimilarBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
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
      })
      .addCase(fetchBookReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(regenerateRecommendations.pending, (state) => {
        state.loading = true;
      })
      .addCase(regenerateRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendedBooks = action.payload;
      })
      .addCase(regenerateRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(provideFeedbackAsync.fulfilled, (_state, _action) => {
        // Could update local state to reflect feedback was recorded
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
