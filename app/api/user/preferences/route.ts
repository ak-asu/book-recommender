import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

// Get user preferences
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const userPrefsRef = doc(db, "userPreferences", userId);
    const userPrefsDoc = await getDoc(userPrefsRef);

    if (!userPrefsDoc.exists()) {
      return NextResponse.json({ preferences: {} }, { status: 200 });
    }

    const preferences = userPrefsDoc.data();

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch user preferences", details: error.message },
      { status: 500 },
    );
  }
}

// Update user preferences
export async function POST(request: NextRequest) {
  try {
    const { userId, preferences } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const userPrefsRef = doc(db, "userPreferences", userId);
    const userPrefsDoc = await getDoc(userPrefsRef);

    if (!userPrefsDoc.exists()) {
      // Create new preference document
      await setDoc(userPrefsRef, {
        ...preferences,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update existing preferences
      await updateDoc(userPrefsRef, {
        ...preferences,
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "User preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update user preferences", details: error.message },
      { status: 500 },
    );
  }
}

// Update specific preference value
export async function PATCH(request: NextRequest) {
  try {
    const { userId, key, value } = await request.json();

    if (!userId || !key) {
      return NextResponse.json(
        { error: "User ID and preference key are required" },
        { status: 400 },
      );
    }

    const userPrefsRef = doc(db, "userPreferences", userId);
    const userPrefsDoc = await getDoc(userPrefsRef);

    if (!userPrefsDoc.exists()) {
      // Create new preferences document with single preference
      await setDoc(userPrefsRef, {
        [key]: value,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update specific preference
      await updateDoc(userPrefsRef, {
        [key]: value,
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Preference '${key}' updated successfully`,
    });
  } catch (error) {
    console.error("Error updating specific preference:", error);
    return NextResponse.json(
      { error: "Failed to update specific preference", details: error.message },
      { status: 500 },
    );
  }
}
