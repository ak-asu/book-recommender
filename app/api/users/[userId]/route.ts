import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

// GET - Retrieve a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;

    // Get user document from Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();

    return NextResponse.json(
      {
        id: userSnap.id,
        ...userData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

// PUT - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    const { uid, email, createdAt, ...updatableFields } = body;

    // Get user document reference
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user document
    await updateDoc(userRef, {
      ...updatableFields,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;

    // Get user document reference
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user document
    await deleteDoc(userRef);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}

// PATCH - Update specific user fields or preferences
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { action, data } = body;

    // Get user document
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();

    switch (action) {
      case "bookmark":
        // Add/remove bookmark
        const bookmarks = userData.bookmarks || [];
        const bookmarkIndex = bookmarks.indexOf(data.bookId);

        if (bookmarkIndex === -1 && data.add) {
          bookmarks.push(data.bookId);
        } else if (bookmarkIndex !== -1 && !data.add) {
          bookmarks.splice(bookmarkIndex, 1);
        }

        await updateDoc(userRef, {
          bookmarks,
          updatedAt: Timestamp.now(),
        });
        break;

      case "favorite":
        // Add/remove favorite
        const favorites = userData.favorites || [];
        const favoriteIndex = favorites.indexOf(data.bookId);

        if (favoriteIndex === -1 && data.add) {
          favorites.push(data.bookId);
        } else if (favoriteIndex !== -1 && !data.add) {
          favorites.splice(favoriteIndex, 1);
        }

        await updateDoc(userRef, {
          favorites,
          updatedAt: Timestamp.now(),
        });
        break;

      case "preference":
        // Update user preferences
        const preferences = userData.preferences || {};
        const updatedPreferences = { ...preferences, ...data.preferences };

        await updateDoc(userRef, {
          preferences: updatedPreferences,
          updatedAt: Timestamp.now(),
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
