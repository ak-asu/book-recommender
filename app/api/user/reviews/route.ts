import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

// Get reviews (by book or by user)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const bookId = url.searchParams.get("bookId");
    const limitParam = parseInt(url.searchParams.get("limit") || "10", 10);

    if (!userId && !bookId) {
      return NextResponse.json(
        { error: "Either User ID or Book ID is required" },
        { status: 400 },
      );
    }

    let reviewsQuery;

    if (bookId && userId) {
      // Get specific review by this user for this book
      reviewsQuery = query(
        collection(db, "reviews"),
        where("bookId", "==", bookId),
        where("userId", "==", userId),
      );
    } else if (bookId) {
      // Get all reviews for a book
      reviewsQuery = query(
        collection(db, "reviews"),
        where("bookId", "==", bookId),
        orderBy("createdAt", "desc"),
        limit(limitParam),
      );
    } else {
      // Get all reviews by a user
      reviewsQuery = query(
        collection(db, "reviews"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitParam),
      );
    }

    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = [];

    reviewsSnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate().toISOString() || null,
      });
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error.message },
      { status: 500 },
    );
  }
}

// Create a review
export async function POST(request: NextRequest) {
  try {
    const { userId, bookId, rating, text } = await request.json();

    if (!userId || !bookId || !rating) {
      return NextResponse.json(
        { error: "User ID, Book ID, and rating are required" },
        { status: 400 },
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    }

    // Check if book exists
    const bookRef = doc(db, "books", bookId);
    const bookDoc = await getDoc(bookRef);

    if (!bookDoc.exists()) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Check if user already reviewed this book
    const existingReviewQuery = query(
      collection(db, "reviews"),
      where("userId", "==", userId),
      where("bookId", "==", bookId),
    );

    const existingReviewSnapshot = await getDocs(existingReviewQuery);

    if (!existingReviewSnapshot.empty) {
      return NextResponse.json(
        { error: "You have already reviewed this book. Use PATCH to update." },
        { status: 400 },
      );
    }

    // Get user profile data
    const userProfileRef = doc(db, "userProfiles", userId);
    const userProfileDoc = await getDoc(userProfileRef);
    let userDisplayName = "Anonymous";
    let userPhotoURL = null;

    if (userProfileDoc.exists()) {
      const userData = userProfileDoc.data();
      userDisplayName = userData.displayName || userDisplayName;
      userPhotoURL = userData.photoURL || userPhotoURL;
    }

    // Create the review
    const timestamp = serverTimestamp();
    const reviewRef = await addDoc(collection(db, "reviews"), {
      userId,
      bookId,
      rating,
      text: text || "",
      userDisplayName,
      userPhotoURL,
      createdAt: timestamp,
      updatedAt: timestamp,
      bookTitle: bookDoc.data().title,
      bookAuthor: bookDoc.data().author,
      helpfulCount: 0,
      reportCount: 0,
    });

    // Update book's review stats
    const bookData = bookDoc.data();
    const totalReviews = (bookData.reviewCount || 0) + 1;
    const totalRating = (bookData.totalRating || 0) + rating;
    const avgRating = totalRating / totalReviews;

    await updateDoc(bookRef, {
      reviewCount: totalReviews,
      totalRating: totalRating,
      avgRating: avgRating,
      updatedAt: timestamp,
    });

    return NextResponse.json({
      success: true,
      message: "Review added successfully",
      reviewId: reviewRef.id,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review", details: error.message },
      { status: 500 },
    );
  }
}

// Update a review
export async function PATCH(request: NextRequest) {
  try {
    const { reviewId, userId, rating, text } = await request.json();

    if (!reviewId || !userId) {
      return NextResponse.json(
        { error: "Review ID and User ID are required" },
        { status: 400 },
      );
    }

    // If rating provided, validate it
    if (
      rating !== undefined &&
      (rating < 1 || rating > 5 || !Number.isInteger(rating))
    ) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    }

    // Check if review exists and belongs to user
    const reviewRef = doc(db, "reviews", reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const reviewData = reviewDoc.data();
    if (reviewData.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to update this review" },
        { status: 403 },
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (text !== undefined) {
      updateData.text = text;
    }

    await updateDoc(reviewRef, updateData);

    // If rating was updated, update the book's average rating
    if (rating !== undefined && rating !== reviewData.rating) {
      const bookRef = doc(db, "books", reviewData.bookId);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        const bookData = bookDoc.data();
        const totalRating =
          (bookData.totalRating || 0) - reviewData.rating + rating;
        const avgRating = totalRating / (bookData.reviewCount || 1);

        await updateDoc(bookRef, {
          totalRating: totalRating,
          avgRating: avgRating,
          updatedAt: serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review", details: error.message },
      { status: 500 },
    );
  }
}

// Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const reviewId = url.searchParams.get("reviewId");
    const userId = url.searchParams.get("userId");

    if (!reviewId || !userId) {
      return NextResponse.json(
        { error: "Review ID and User ID are required" },
        { status: 400 },
      );
    }

    // Check if review exists and belongs to user
    const reviewRef = doc(db, "reviews", reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const reviewData = reviewDoc.data();
    if (reviewData.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this review" },
        { status: 403 },
      );
    }

    // Update book ratings before deleting review
    const bookRef = doc(db, "books", reviewData.bookId);
    const bookDoc = await getDoc(bookRef);

    if (bookDoc.exists()) {
      const bookData = bookDoc.data();
      const totalReviews = Math.max((bookData.reviewCount || 0) - 1, 0);
      const totalRating = Math.max(
        (bookData.totalRating || 0) - reviewData.rating,
        0,
      );
      const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      await updateDoc(bookRef, {
        reviewCount: totalReviews,
        totalRating: totalRating,
        avgRating: avgRating,
        updatedAt: serverTimestamp(),
      });
    }

    // Delete the review
    await deleteDoc(reviewRef);

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review", details: error.message },
      { status: 500 },
    );
  }
}
