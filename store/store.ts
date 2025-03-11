import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./userSlice";
import searchReducer from "./searchSlice";
import bookReducer from "./bookSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    search: searchReducer,
    book: bookReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
