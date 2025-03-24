import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

// Get user profile
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

    const userProfileRef = doc(db, "userProfiles", userId);
    const userProfileDoc = await getDoc(userProfileRef);

    if (!userProfileDoc.exists()) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const profile = userProfileDoc.data();

    return NextResponse.json({
      profile: {
        ...profile,
        createdAt: profile.createdAt?.toDate().toISOString() || null,
        updatedAt: profile.updatedAt?.toDate().toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile", details: error.message },
      { status: 500 },
    );
  }
}

// Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const { userId, profile } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Basic validation
    if (!profile.displayName) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 },
      );
    }

    const userProfileRef = doc(db, "userProfiles", userId);
    const userProfileDoc = await getDoc(userProfileRef);

    if (!userProfileDoc.exists()) {
      // Create new profile
      await setDoc(userProfileRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update existing profile
      await updateDoc(userProfileRef, {
        ...profile,
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "User profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile", details: error.message },
      { status: 500 },
    );
  }
}
