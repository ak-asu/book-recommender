import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
} from "firebase/firestore";

import { firestore } from "../lib/firebase";

import { RootState } from "./store";

// Define the book interface
export interface Book {
  id: string;
  title: string;
  author: string;
  publicationDate: string;
  description: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  genres: string[];
  pageCount: number;
  series?: string;
  volume?: number;
}

// Define search options interface
export interface SearchOptions {
  genre?: string;
  length?: "short" | "medium" | "long";
  mood?: string;
  timeFrame?: string;
}

// Define the book state interface
interface BookState {
  books: Book[];
  recommendedBooks: Book[];
  searchHistory: { query: string; options: SearchOptions; timestamp: number }[];
  currentSearch: string;
  currentSearchOptions: SearchOptions;
  bookmarks: Book[];
  loading: boolean;
  error: string | null;
  currentBookDetail: Book | null;
}

// Initial state
const initialState: BookState = {
  books: [],
  recommendedBooks: [],
  searchHistory: [],
  currentSearch: "",
  currentSearchOptions: {},
  bookmarks: [],
  loading: false,
  error: null,
  currentBookDetail: null,
};

// Async thunks
export const fetchPopularBooks = createAsyncThunk(
  "books/fetchPopular",
  async (_, { rejectWithValue }) => {
    try {
      const booksRef = collection(firestore, "books");
      // Assuming you have a field 'popularity' to rank books
      const q = query(booksRef);
      const querySnapshot = await getDocs(q);

      const books: Book[] = [];

      querySnapshot.forEach((doc) => {
        books.push({ id: doc.id, ...doc.data() } as Book);
      });

      return books;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const searchBooks = createAsyncThunk(
  "books/search",
  async (
    { query, options }: { query: string; options: SearchOptions },
    { rejectWithValue },
  ) => {
    try {
      // Here you would call your API which then calls OpenAI
      // This is a placeholder - implement the actual API call to your backend
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
  "books/fetchDetail",
  async (bookId: string, { rejectWithValue }) => {
    try {
      const docRef = doc(firestore, "books", bookId);
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

export const bookmarkBook = createAsyncThunk(
  "books/bookmark",
  async (book: Book, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user; // .uid; // Using the correct user slice structure

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const bookmarksRef = collection(firestore, "users", userId, "bookmarks");

      await addDoc(bookmarksRef, {
        bookId: book.id,
        timestamp: Date.now(),
      });

      return book;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

// Create the slice
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
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter(
        (book) => book.id !== action.payload,
      );
    },
    clearCurrentBookDetail: (state) => {
      state.currentBookDetail = null;
    },
    provideFeedback: (
      state,
      action: PayloadAction<{ bookId: string; liked: boolean }>,
    ) => {
      // In a real implementation, you would also send this to your backend API
      // to update user preferences in the database
      // This reducer is just a placeholder
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchPopularBooks
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

      // Handle searchBooks
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

      // Handle fetchBookDetail
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

      // Handle bookmarkBook
      .addCase(bookmarkBook.fulfilled, (state, action) => {
        if (!state.bookmarks.some((book) => book.id === action.payload.id)) {
          state.bookmarks.push(action.payload);
        }
      });
  },
});

// Export actions
export const {
  setCurrentSearch,
  setSearchOptions,
  clearSearchHistory,
  removeBookmark,
  clearCurrentBookDetail,
  provideFeedback,
} = bookSlice.actions;

// Export selectors
export const selectBooks = (state: RootState) => state.book.books;
export const selectRecommendedBooks = (state: RootState) =>
  state.book.recommendedBooks;
export const selectSearchHistory = (state: RootState) =>
  state.book.searchHistory;
export const selectCurrentSearch = (state: RootState) =>
  state.book.currentSearch;
export const selectCurrentSearchOptions = (state: RootState) =>
  state.book.currentSearchOptions;
export const selectBookmarks = (state: RootState) => state.book.bookmarks;
export const selectLoading = (state: RootState) => state.book.loading;
export const selectError = (state: RootState) => state.book.error;
export const selectCurrentBookDetail = (state: RootState) =>
  state.book.currentBookDetail;

// Export reducer
export default bookSlice.reducer;
