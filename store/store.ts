import { configureStore, Middleware } from "@reduxjs/toolkit";

import userReducer from "./userSlice";
import searchReducer from "./searchSlice";
import bookReducer from "./bookSlice";
import chatReducer from "./chatSlice";

const isAuthenticated = (state: RootState): boolean => {
  return !!state.user?.user?.uid;
};

// Create middleware to handle guest vs authenticated user logic
const persistenceMiddleware: Middleware =
  (store) => (next) => (action: any) => {
    // Run the action first
    const result = next(action);
    const state = store.getState();
    // Then check if we need to persist data to localStorage for guest users
    if (!isAuthenticated(state)) {
      // Handle any localStorage persistence based on the action type
      // This centralizes the guest user persistence logic
      if (
        action.type.startsWith("books/") ||
        action.type.startsWith("search/")
      ) {
        // Persist relevant data for guest users
        // Example: if (action.type === 'books/bookmark') { ... }
      }
    }
    return result;
  };

export const store = configureStore({
  reducer: {
    user: userReducer,
    search: searchReducer,
    book: bookReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
