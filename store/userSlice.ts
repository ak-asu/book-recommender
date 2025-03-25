import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User as FirebaseUser,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { RootState } from "./store";

import { auth, firestore } from "@/lib/firebase";
import { User, UserPreferences } from "@/types/user";

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

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
  success: null,
};

const defaultPreferences: UserPreferences = {
  favoriteGenres: [],
  darkMode: false,
  notificationsEnabled: true,
};

const formatUser = (
  firebaseUser: FirebaseUser,
  preferences: UserPreferences = defaultPreferences,
): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    isAnonymous: firebaseUser.isAnonymous,
    createdAt: firebaseUser.metadata.creationTime
      ? new Date(firebaseUser.metadata.creationTime).getTime()
      : undefined,
    lastLogin: firebaseUser.metadata.lastSignInTime
      ? new Date(firebaseUser.metadata.lastSignInTime).getTime()
      : undefined,
    preferences,
  };
};

export const registerUser = createAsyncThunk(
  "user/register",
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
        preferences: defaultPreferences,
      });
      return formatUser(userCredential.user);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loginUser = createAsyncThunk(
  "user/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );
      const userRef = doc(firestore, "users", userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      let preferences = defaultPreferences;
      if (userDoc.exists()) {
        preferences = userDoc.data().preferences || defaultPreferences;
      }
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString(),
      });
      return formatUser(userCredential.user, preferences);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loginWithGoogle = createAsyncThunk(
  "user/googleLogin",
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userRef = doc(firestore, "users", userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      let preferences = defaultPreferences;
      if (userDoc.exists()) {
        preferences = userDoc.data().preferences || defaultPreferences;
        await updateDoc(userRef, {
          lastLogin: new Date().toISOString(),
        });
      } else {
        await setDoc(userRef, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: new Date().toISOString(),
          preferences: defaultPreferences,
        });
      }
      return formatUser(userCredential.user, preferences);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "user/logout",
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
  "user/updatePreferences",
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
        userDoc.data().preferences || defaultPreferences;
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

export const fetchUserBookmarks = createAsyncThunk(
  "user/fetchBookmarks",
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
        books[doc.id] = { id: doc.id, ...doc.data() };
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

export const resetPassword = createAsyncThunk(
  "user/resetPassword",
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
  "user/updateProfile",
  async (
    { displayName, photoURL }: { displayName?: string; photoURL?: string },
    { rejectWithValue, getState },
  ) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const state = getState() as RootState;
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
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.success = "Registration successful";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.success = "Login successful";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.success = "Google login successful";
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
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
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = "Password reset email sent";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.displayName = action.payload.displayName;
          state.user.photoURL = action.payload.photoURL;
        }
        state.success = "Profile updated successfully";
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserBookmarks.fulfilled, (_state, _action) => {
        // This is handled in the bookSlice
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
