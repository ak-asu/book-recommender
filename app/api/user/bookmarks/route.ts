import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

// Get all bookmarks for a user
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const type = url.searchParams.get("type"); // Optional: get specific bookmark types

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    let bookmarksQuery;
    if (type) {
      bookmarksQuery = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId),
        where("type", "==", type),
        orderBy("createdAt", "desc"),
      );
    } else {
      bookmarksQuery = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      );
    }

    const bookmarksSnapshot = await getDocs(bookmarksQuery);
    const bookmarks = [];

    bookmarksSnapshot.forEach((doc) => {
      bookmarks.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || null,
      });
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks", details: error.message },
      { status: 500 },
    );
  }
}

// Add a bookmark
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      bookId,
      type = "favorite",
      note = "",
    } = await request.json();

    if (!userId || !bookId) {
      return NextResponse.json(
        { error: "User ID and Book ID are required" },
        { status: 400 },
      );
    }

    // Validate bookmark type
    if (!["favorite", "read-later", "reading-list"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid bookmark type" },
        { status: 400 },
      );
    }

    // Get book details to store with bookmark
    const bookRef = doc(db, "books", bookId);
    const bookDoc = await getDoc(bookRef);

    if (!bookDoc.exists()) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const bookData = bookDoc.data();

    // Create a unique ID for the bookmark using both user and book IDs
    const bookmarkId = `${userId}_${bookId}_${type}`;
    const bookmarkRef = doc(db, "bookmarks", bookmarkId);

    await setDoc(bookmarkRef, {
      userId,
      bookId,
      type,
      note,
      createdAt: serverTimestamp(),
      bookDetails: {
        title: bookData.title,
        author: bookData.author,
        imageUrl: bookData.imageUrl,
        description:
          bookData.description?.substring(0, 100) +
          (bookData.description?.length > 100 ? "..." : ""),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Book added to ${type}`,
      bookmarkId,
    });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    return NextResponse.json(
      { error: "Failed to add bookmark", details: error.message },
      { status: 500 },
    );
  }
}

// Delete a bookmark
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const bookmarkId = url.searchParams.get("bookmarkId");
    const userId = url.searchParams.get("userId");

    if (!bookmarkId || !userId) {
      return NextResponse.json(
        { error: "Bookmark ID and User ID are required" },
        { status: 400 },
      );
    }

    // Check if the bookmark exists and belongs to the user
    const bookmarkRef = doc(db, "bookmarks", bookmarkId);
    const bookmarkDoc = await getDoc(bookmarkRef);

    if (!bookmarkDoc.exists()) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 },
      );
    }

    // Verify ownership
    if (bookmarkDoc.data().userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this bookmark" },
        { status: 403 },
      );
    }

    await deleteDoc(bookmarkRef);

    return NextResponse.json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark", details: error.message },
      { status: 500 },
    );
  }
}
