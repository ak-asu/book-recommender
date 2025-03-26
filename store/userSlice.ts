import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "./store";

import { User, UserPreferences } from "@/types/user";
import { ACTION_TYPES } from "@/lib/constants";
import { reduxUtils } from "@/lib/utils";
import * as authService from "@/services/authService";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegistrationData extends LoginCredentials {
  displayName: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: UserState = reduxUtils.createInitialState({
  user: null,
});

export const registerUser = createAsyncThunk(
  ACTION_TYPES.USER.REGISTER,
  async (data: RegistrationData, { rejectWithValue }) => {
    try {
      return await authService.registerUser(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loginUser = createAsyncThunk(
  ACTION_TYPES.USER.LOGIN,
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await authService.loginUser(credentials);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  ACTION_TYPES.USER.LOGOUT,
  async (_, { rejectWithValue }) => {
    try {
      await authService.logoutUser();
      return null;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const updateUserPreferences = createAsyncThunk(
  ACTION_TYPES.USER.UPDATE_PREFERENCES,
  async (
    preferences: Partial<UserPreferences>,
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      return await authService.updateUserPreferences(preferences);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const resetPassword = createAsyncThunk(
  ACTION_TYPES.USER.RESET_PASSWORD,
  async (email: string, { rejectWithValue }) => {
    try {
      await authService.resetPassword(email);
      return email;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  ACTION_TYPES.USER.UPDATE_PROFILE,
  async (
    { displayName, photoURL }: { displayName?: string; photoURL?: string },
    { rejectWithValue },
  ) => {
    try {
      return await authService.updateUserProfile(displayName, photoURL);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    clearErrors: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    reduxUtils.createAsyncThunkReducers(
      builder,
      registerUser,
      (state, action) => {
        state.user = action.payload;
        state.success = "Registration successful";
      },
    );
    reduxUtils.createAsyncThunkReducers(builder, loginUser, (state, action) => {
      state.user = action.payload;
      state.success = "Login successful";
    });
    reduxUtils.createAsyncThunkReducers(builder, resetPassword, (state) => {
      state.success = "Password reset email sent";
    });
    reduxUtils.createAsyncThunkReducers(
      builder,
      updateUserProfile,
      (state, action) => {
        if (state.user) {
          state.user.displayName = action.payload.displayName;
          state.user.photoURL = action.payload.photoURL;
        }
        state.success = "Profile updated successfully";
      },
    );
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.success = "Logout successful";
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        if (state.user) {
          state.user.preferences = action.payload as UserPreferences;
        }
        state.success = "Preferences updated successfully";
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearErrors } = userSlice.actions;

export const selectUser = (state: RootState) => state.user.user;
export const selectLoading = (state: RootState) => state.user.loading;
export const selectError = (state: RootState) => state.user.error;
export const selectSuccess = (state: RootState) => state.user.success;
export const selectUserPreferences = (state: RootState) =>
  state.user.user?.preferences;

export default userSlice.reducer;
