import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

import { RootState } from "./store";

import { auth, firestore } from "@/lib/firebase";
import { User, UserPreferences } from "@/types/user";
import { ACTION_TYPES, DEFAULT_VALUES } from "@/lib/constants";
import { firebaseUtils, reduxUtils } from "@/lib/utils";

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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });
      const userRef = doc(firestore, "users", userCredential.user.uid);
      await setDoc(userRef, {
        email: data.email,
        displayName: data.displayName,
        createdAt: new Date().toISOString(),
        preferences: DEFAULT_VALUES.USER_PREFERENCES,
      });
      return firebaseUtils.formatUser(userCredential.user);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loginUser = createAsyncThunk(
  ACTION_TYPES.USER.LOGIN,
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );
      const userRef = doc(firestore, "users", userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      let preferences = DEFAULT_VALUES.USER_PREFERENCES;
      if (userDoc.exists()) {
        preferences =
          userDoc.data().preferences || DEFAULT_VALUES.USER_PREFERENCES;
      }
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString(),
      });
      return firebaseUtils.formatUser(userCredential.user, preferences);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loginWithGoogle = createAsyncThunk(
  ACTION_TYPES.USER.GOOGLE_LOGIN,
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userRef = doc(firestore, "users", userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      let preferences = DEFAULT_VALUES.USER_PREFERENCES;
      if (userDoc.exists()) {
        preferences =
          userDoc.data().preferences || DEFAULT_VALUES.USER_PREFERENCES;
        await updateDoc(userRef, {
          lastLogin: new Date().toISOString(),
        });
      } else {
        await setDoc(userRef, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: new Date().toISOString(),
          preferences: DEFAULT_VALUES.USER_PREFERENCES,
        });
      }
      return firebaseUtils.formatUser(userCredential.user, preferences);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  ACTION_TYPES.USER.LOGOUT,
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
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
      const userRef = doc(firestore, "users", userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }
      const currentPreferences =
        userDoc.data().preferences || DEFAULT_VALUES.USER_PREFERENCES;
      const updatedPreferences = { ...currentPreferences, ...preferences };
      await updateDoc(userRef, {
        preferences: updatedPreferences,
      });
      return updatedPreferences;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const resetPassword = createAsyncThunk(
  ACTION_TYPES.USER.RESET_PASSWORD,
  async (email: string, { rejectWithValue }) => {
    try {
      await sendPasswordResetEmail(auth, email);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { rejectWithValue, getState },
  ) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      await updateProfile(currentUser, {
        displayName: displayName || currentUser.displayName,
        photoURL: photoURL || currentUser.photoURL,
      });
      const userRef = doc(firestore, "users", currentUser.uid);
      const updateData: Record<string, any> = {};
      if (displayName) updateData.displayName = displayName;
      if (photoURL) updateData.photoURL = photoURL;
      await updateDoc(userRef, updateData);
      return {
        displayName: displayName || currentUser.displayName,
        photoURL: photoURL || currentUser.photoURL,
      };
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
    reduxUtils.createAsyncThunkReducers(
      builder,
      loginWithGoogle,
      (state, action) => {
        state.user = action.payload;
        state.success = "Google login successful";
      },
    );
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
