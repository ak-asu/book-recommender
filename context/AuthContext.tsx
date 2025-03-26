import { createContext, useState, useEffect, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import { auth, firestore } from "@/lib/firebase";
import { FIREBASE_COLLECTIONS, MESSAGES } from "@/lib/constants";

interface AuthContextProps {
  user: FirebaseUser | null;
  userData: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(
            doc(firestore, FIREBASE_COLLECTIONS.USERS, currentUser.uid),
          );
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            await setDoc(
              doc(firestore, FIREBASE_COLLECTIONS.USERS, currentUser.uid),
              {
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                createdAt: serverTimestamp(),
              },
            );
            setUserData({
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            });
          }
        } catch {}
      } else {
        setUserData(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(result.user, { displayName });
      await setDoc(
        doc(firestore, FIREBASE_COLLECTIONS.USERS, result.user.uid),
        {
          email,
          displayName,
          createdAt: serverTimestamp(),
        },
      );
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        throw new Error(MESSAGES.ERRORS.AUTH.EMAIL_IN_USE);
      } else if (error.code === "auth/weak-password") {
        throw new Error(MESSAGES.ERRORS.AUTH.WEAK_PASSWORD);
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(
        doc(firestore, FIREBASE_COLLECTIONS.USERS, result.user.uid),
      );
      if (!userDoc.exists()) {
        await setDoc(
          doc(firestore, FIREBASE_COLLECTIONS.USERS, result.user.uid),
          {
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            createdAt: serverTimestamp(),
          },
        );
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    try {
      if (!user) throw new Error(MESSAGES.ERRORS.AUTH.INVALID_CREDENTIALS);
      const updates: { displayName: string; photoURL?: string } = {
        displayName,
      };
      if (photoURL) updates.photoURL = photoURL;
      await updateProfile(user, updates);
      await setDoc(
        doc(firestore, FIREBASE_COLLECTIONS.USERS, user.uid),
        {
          displayName,
          ...(photoURL && { photoURL }),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setUserData((prev: any) => ({
        ...prev,
        displayName,
        ...(photoURL && { photoURL }),
      }));
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
