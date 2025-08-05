import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Book, BookmarkState } from "@/types";

const initialState: BookmarkState = {
  favorites: [],
  bookmarked: [],
  savedForLater: [],
};

const bookmarkSlice = createSlice({
  name: "bookmark",
  initialState,
  reducers: {
    toggleFavorite(state, action: PayloadAction<Book>) {
      const book = action.payload;
      const existingIndex = state.favorites.findIndex((b) => b.id === book.id);

      if (existingIndex >= 0) {
        state.favorites.splice(existingIndex, 1);
      } else {
        state.favorites.push(book);
      }
    },
    toggleBookmark(state, action: PayloadAction<Book>) {
      const book = action.payload;
      const existingIndex = state.bookmarked.findIndex((b) => b.id === book.id);

      if (existingIndex >= 0) {
        state.bookmarked.splice(existingIndex, 1);
      } else {
        state.bookmarked.push(book);
      }
    },
    toggleSaveForLater(state, action: PayloadAction<Book>) {
      const book = action.payload;
      const existingIndex = state.savedForLater.findIndex(
        (b) => b.id === book.id,
      );

      if (existingIndex >= 0) {
        state.savedForLater.splice(existingIndex, 1);
      } else {
        state.savedForLater.push(book);
      }
    },
    removeFromFavorites(state, action: PayloadAction<string>) {
      state.favorites = state.favorites.filter(
        (book) => book.id !== action.payload,
      );
    },
    removeFromBookmarked(state, action: PayloadAction<string>) {
      state.bookmarked = state.bookmarked.filter(
        (book) => book.id !== action.payload,
      );
    },
    removeFromSavedForLater(state, action: PayloadAction<string>) {
      state.savedForLater = state.savedForLater.filter(
        (book) => book.id !== action.payload,
      );
    },
  },
});

export const {
  toggleFavorite,
  toggleBookmark,
  toggleSaveForLater,
  removeFromFavorites,
  removeFromBookmarked,
  removeFromSavedForLater,
} = bookmarkSlice.actions;

export default bookmarkSlice.reducer;
