import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

// Get reading history for a user
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const limitParam = parseInt(url.searchParams.get("limit") || "20", 10);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const historyQuery = query(
      collection(db, "readingHistory"),
      where("userId", "==", userId),
      orderBy("lastVisited", "desc"),
      limit(limitParam),
    );

    const historySnapshot = await getDocs(historyQuery);
    const history = [];

    historySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data(),
        firstVisited: doc.data().firstVisited?.toDate().toISOString() || null,
        lastVisited: doc.data().lastVisited?.toDate().toISOString() || null,
      });
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching reading history:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading history", details: error.message },
      { status: 500 },
    );
  }
}

// Add or update reading history entry
export async function POST(request: NextRequest) {
  try {
    const { userId, bookId, readingStatus, progress } = await request.json();

    if (!userId || !bookId) {
      return NextResponse.json(
        { error: "User ID and Book ID are required" },
        { status: 400 },
      );
    }

    // Valid reading statuses
    const validStatuses = [
      "interested",
      "started",
      "reading",
      "completed",
      "abandoned",
    ];
    if (readingStatus && !validStatuses.includes(readingStatus)) {
      return NextResponse.json(
        { error: `Reading status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate progress percentage
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: "Progress must be between 0 and 100" },
        { status: 400 },
      );
    }

    // Check if book exists
    const bookRef = doc(db, "books", bookId);
    const bookDoc = await getDoc(bookRef);

    if (!bookDoc.exists()) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const bookData = bookDoc.data();

    // Create a compound ID for the reading history entry
    const historyId = `${userId}_${bookId}`;
    const historyRef = doc(db, "readingHistory", historyId);
    const historyDoc = await getDoc(historyRef);

    const now = serverTimestamp();

    if (!historyDoc.exists()) {
      // Create new history entry
      await setDoc(historyRef, {
        userId,
        bookId,
        readingStatus: readingStatus || "interested",
        progress: progress || 0,
        firstVisited: now,
        lastVisited: now,
        visitCount: 1,
        bookDetails: {
          title: bookData.title,
          author: bookData.author,
          imageUrl: bookData.imageUrl,
          description:
            bookData.description?.substring(0, 100) +
            (bookData.description?.length > 100 ? "..." : ""),
          pageCount: bookData.pageCount,
        },
      });
    } else {
      // Update existing history entry
      const updateData: Record<string, any> = {
        lastVisited: now,
        visitCount: (historyDoc.data().visitCount || 0) + 1,
      };

      if (readingStatus) {
        updateData.readingStatus = readingStatus;
      }

      if (progress !== undefined) {
        updateData.progress = progress;
      }

      await updateDoc(historyRef, updateData);
    }

    // If book was completed, update user's reading stats
    if (readingStatus === "completed") {
      const userStatsRef = doc(db, "userStats", userId);
      const userStatsDoc = await getDoc(userStatsRef);

      if (!userStatsDoc.exists()) {
        await setDoc(userStatsRef, {
          booksCompleted: 1,
          pagesRead: bookData.pageCount || 0,
          lastUpdated: now,
        });
      } else {
        await updateDoc(userStatsRef, {
          booksCompleted: (userStatsDoc.data().booksCompleted || 0) + 1,
          pagesRead:
            (userStatsDoc.data().pagesRead || 0) + (bookData.pageCount || 0),
          lastUpdated: now,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Reading history updated successfully",
    });
  } catch (error) {
    console.error("Error updating reading history:", error);
    return NextResponse.json(
      { error: "Failed to update reading history", details: error.message },
      { status: 500 },
    );
  }
}
