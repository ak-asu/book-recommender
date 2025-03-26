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

import { auth, firestore } from "@/lib/firebase";
import { User, UserPreferences } from "@/types/user";
import { DEFAULT_VALUES, FIREBASE_COLLECTIONS } from "@/lib/constants";
import { firebaseUtils } from "@/lib/utils";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegistrationData extends LoginCredentials {
  displayName: string;
}

export const registerUser = async (data: RegistrationData): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password,
    );
    await updateProfile(userCredential.user, {
      displayName: data.displayName,
    });
    const userRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.USERS,
      userCredential.user.uid,
    );
    await setDoc(userRef, {
      email: data.email,
      displayName: data.displayName,
      createdAt: new Date().toISOString(),
      preferences: DEFAULT_VALUES.USER_PREFERENCES,
    });
    return firebaseUtils.formatUser(userCredential.user);
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (
  credentials: LoginCredentials,
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password,
    );
    const userRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.USERS,
      userCredential.user.uid,
    );
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
    throw error;
  }
};

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const userRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.USERS,
      userCredential.user.uid,
    );
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
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (
  displayName?: string,
  photoURL?: string,
): Promise<{ displayName?: string; photoURL?: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    await updateProfile(currentUser, {
      displayName: displayName || currentUser.displayName || undefined,
      photoURL: photoURL || currentUser.photoURL || undefined,
    });
    const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, currentUser.uid);
    const updateData: Record<string, any> = {};
    if (displayName) updateData.displayName = displayName;
    if (photoURL) updateData.photoURL = photoURL;
    await updateDoc(userRef, updateData);
    return {
      displayName: displayName || currentUser.displayName || undefined,
      photoURL: photoURL || currentUser.photoURL || undefined,
    };
  } catch (error) {
    throw error;
  }
};

export const getUserPreferences = async (
  userId: string,
): Promise<UserPreferences> => {
  try {
    const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data().preferences || DEFAULT_VALUES.USER_PREFERENCES;
    }
    return DEFAULT_VALUES.USER_PREFERENCES;
  } catch (error) {
    throw error;
  }
};

export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<UserPreferences> => {
  try {
    const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, userId);
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
    throw error;
  }
};
