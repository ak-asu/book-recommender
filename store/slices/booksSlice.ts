import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

import { SearchFilters, SearchState } from "@/types";

// In a real app, this would be an API call
export const searchBooks = createAsyncThunk(
  "books/searchBooks",
  async (
    { query, filters }: { query: string; filters?: SearchFilters },
    { rejectWithValue },
  ) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Filter mock books based on query and filters
      let filteredBooks: any[] = [];

      if (query) {
        filteredBooks = filteredBooks.filter(
          (book) =>
            book.title.toLowerCase().includes(query.toLowerCase()) ||
            book.author.toLowerCase().includes(query.toLowerCase()) ||
            book.description.toLowerCase().includes(query.toLowerCase()),
        );
      }

      if (filters?.genre) {
        filteredBooks = filteredBooks.filter((book) =>
          book.genre.some(
            (g: any) => g.toLowerCase() === filters.genre?.toLowerCase(),
          ),
        );
      }

      if (filters?.rating) {
        filteredBooks = filteredBooks.filter(
          (book) => book.rating >= (filters.rating || 0),
        );
      }

      // Sort results
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case "rating":
            filteredBooks.sort((a, b) => b.rating - a.rating);
            break;
          case "newest":
            filteredBooks.sort(
              (a, b) =>
                new Date(b.publishedDate || "").getTime() -
                new Date(a.publishedDate || "").getTime(),
            );
            break;
          case "oldest":
            filteredBooks.sort(
              (a, b) =>
                new Date(a.publishedDate || "").getTime() -
                new Date(b.publishedDate || "").getTime(),
            );
            break;
          // popularity is default
          default:
            break;
        }
      }

      return {
        books: filteredBooks,
        totalPages: Math.ceil(filteredBooks.length / 10),
      };
    } catch (error) {
      return rejectWithValue("Failed to search books");
    }
  },
);

export const fetchBookById = createAsyncThunk(
  "books/fetchBookById",
  async (id: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const book = [].find((book: any) => book.id === id);

      if (!book) {
        return rejectWithValue("Book not found");
      }

      return book;
    } catch (error) {
      return rejectWithValue("Failed to fetch book");
    }
  },
);

const initialState: SearchState = {
  query: "",
  filters: {},
  results: [],
  loading: false,
  error: null,
  history: [],
  currentPage: 1,
  totalPages: 0,
};

const booksSlice = createSlice({
  name: "books",
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setFilters(state, action: PayloadAction<SearchFilters>) {
      state.filters = action.payload;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    addToHistory(
      state,
      action: PayloadAction<{
        id: string;
        query: string;
        timestamp: number;
        filters?: SearchFilters;
      }>,
    ) {
      state.history.unshift(action.payload);
      // Keep only last 10 searches
      if (state.history.length > 10) {
        state.history.pop();
      }
    },
    clearHistory(state) {
      state.history = [];
    },
    removeFromHistory(state, action: PayloadAction<string>) {
      state.history = state.history.filter(
        (item) => item.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.books;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(searchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setQuery,
  setFilters,
  setCurrentPage,
  addToHistory,
  clearHistory,
  removeFromHistory,
} = booksSlice.actions;

export default booksSlice.reducer;
