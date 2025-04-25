import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { AuthState, User } from "@/types";

// Simulated login function (in a real app, this would connect to Firebase Auth)
export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Demo login - accept any valid-looking email with any password
      if (!email.includes("@") || !email.includes(".")) {
        return rejectWithValue("Invalid email format");
      }

      // Return mock user data
      return {
        id: "123",
        name: email.split("@")[0],
        email,
        photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + email,
        preferences: {
          favoriteGenres: ["Fantasy", "Science Fiction"],
          favoriteAuthors: ["Brandon Sanderson", "Neil Gaiman"],
          readingGoal: 20,
          readingLevel: "Avid Reader",
        },
      } as User;
    } catch (error) {
      return rejectWithValue("Login failed");
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Simulate logout
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      return rejectWithValue("Logout failed");
    }
  },
);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer;
