import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";

// Verify authentication token and return user data
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 },
      );
    }

    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if user exists in our database
    const userRef = doc(db, "userProfiles", userId);
    const userDoc = await getDoc(userRef);

    // If this is a new user, create their profile
    if (!userDoc.exists()) {
      const newUser = {
        uid: userId,
        email: decodedToken.email || null,
        displayName:
          decodedToken.name || decodedToken.email?.split("@")[0] || "User",
        photoURL: decodedToken.picture || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      await setDoc(userRef, newUser);

      // Also initialize empty preferences
      await setDoc(doc(db, "userPreferences", userId), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update last login time
      await setDoc(
        userRef,
        {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    return NextResponse.json({
      authenticated: true,
      userId: userId,
      email: decodedToken.email,
      displayName: decodedToken.name || userDoc.data()?.displayName,
      photoURL: decodedToken.picture || userDoc.data()?.photoURL,
    });
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Authentication failed",
        details: error.message,
      },
      { status: 401 },
    );
  }
}
