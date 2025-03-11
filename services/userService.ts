import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
  deleteDoc,
} from "firebase/firestore";

import { firestore } from "../services/firebase";

// Add a book to user's bookmarks
export const addBookmark = async (userId: string, bookId: string) => {
  try {
    const userRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        bookmarks: [bookId],
        createdAt: serverTimestamp(),
      });
    } else {
      // Add bookmark to existing user
      await updateDoc(userRef, {
        bookmarks: arrayUnion(bookId),
      });
    }

    // Also track this in a separate collection for easier querying
    const bookmarkRef = doc(firestore, "userBookmarks", `${userId}_${bookId}`);

    await setDoc(bookmarkRef, {
      userId,
      bookId,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding bookmark:", error);
    throw error;
  }
};

// Remove a book from user's bookmarks
export const removeBookmark = async (userId: string, bookId: string) => {
  try {
    // Remove from user's bookmarks array
    const userRef = doc(firestore, "users", userId);

    await updateDoc(userRef, {
      bookmarks: arrayRemove(bookId),
    });

    // Remove from separate bookmarks collection
    const bookmarkRef = doc(firestore, "userBookmarks", `${userId}_${bookId}`);

    await deleteDoc(bookmarkRef);

    return { success: true };
  } catch (error) {
    console.error("Error removing bookmark:", error);
    throw error;
  }
};

// Check if a book is bookmarked by the user
export const isBookmarked = async (userId: string, bookId: string) => {
  try {
    const bookmarkRef = doc(firestore, "userBookmarks", `${userId}_${bookId}`);
    const bookmarkDoc = await getDoc(bookmarkRef);

    return bookmarkDoc.exists();
  } catch (error) {
    console.error("Error checking bookmark:", error);
    throw error;
  }
};

// Add a book to user's favorites
export const addToFavorites = async (userId: string, bookId: string) => {
  try {
    const userRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        favorites: [bookId],
        createdAt: serverTimestamp(),
      });
    } else {
      // Add to favorites for existing user
      await updateDoc(userRef, {
        favorites: arrayUnion(bookId),
      });
    }

    // Track in separate collection
    const favoriteRef = doc(firestore, "userFavorites", `${userId}_${bookId}`);

    await setDoc(favoriteRef, {
      userId,
      bookId,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding to favorites:", error);
    throw error;
  }
};

// Remove a book from user's favorites
export const removeFromFavorites = async (userId: string, bookId: string) => {
  try {
    // Remove from user's favorites array
    const userRef = doc(firestore, "users", userId);

    await updateDoc(userRef, {
      favorites: arrayRemove(bookId),
    });

    // Remove from separate favorites collection
    const favoriteRef = doc(firestore, "userFavorites", `${userId}_${bookId}`);

    await deleteDoc(favoriteRef);

    return { success: true };
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
};

// Check if a book is in user's favorites
export const isFavorited = async (userId: string, bookId: string) => {
  try {
    const favoriteRef = doc(firestore, "userFavorites", `${userId}_${bookId}`);
    const favoriteDoc = await getDoc(favoriteRef);

    return favoriteDoc.exists();
  } catch (error) {
    console.error("Error checking favorite:", error);
    throw error;
  }
};

// Get user's bookmarked books with details
export const getUserBookmarks = async (userId: string, maxResults = 50) => {
  try {
    const q = query(
      collection(firestore, "userBookmarks"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults),
    );

    const bookmarksSnapshot = await getDocs(q);
    const bookIds = bookmarksSnapshot.docs.map((doc) => doc.data().bookId);

    // Get book details for each bookmark
    const bookDetails = await Promise.all(
      bookIds.map(async (bookId) => {
        const bookDoc = await getDoc(doc(firestore, "books", bookId));

        if (bookDoc.exists()) {
          return { id: bookDoc.id, ...bookDoc.data() };
        }

        return null;
      }),
    );

    // Filter out any null values (books that don't exist)
    return bookDetails.filter((book) => book !== null);
  } catch (error) {
    console.error("Error fetching user bookmarks:", error);
    throw error;
  }
};

// Get user's favorite books with details
export const getUserFavorites = async (userId: string, maxResults = 50) => {
  try {
    const q = query(
      collection(firestore, "userFavorites"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults),
    );

    const favoritesSnapshot = await getDocs(q);
    const bookIds = favoritesSnapshot.docs.map((doc) => doc.data().bookId);

    // Get book details for each favorite
    const bookDetails = await Promise.all(
      bookIds.map(async (bookId) => {
        const bookDoc = await getDoc(doc(firestore, "books", bookId));

        if (bookDoc.exists()) {
          return { id: bookDoc.id, ...bookDoc.data() };
        }

        return null;
      }),
    );

    // Filter out any null values
    return bookDetails.filter((book) => book !== null);
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    throw error;
  }
};

// Get user's reading history
export const getUserReadingHistory = async (
  userId: string,
  maxResults = 20,
) => {
  try {
    const q = query(
      collection(firestore, "userReadingHistory"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(maxResults),
    );

    const historySnapshot = await getDocs(q);

    return historySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching reading history:", error);
    throw error;
  }
};

// Update user's reading progress
export const updateReadingProgress = async (
  userId: string,
  bookId: string,
  progress: number,
) => {
  try {
    const progressRef = doc(
      firestore,
      "userReadingProgress",
      `${userId}_${bookId}`,
    );

    await setDoc(
      progressRef,
      {
        userId,
        bookId,
        progress,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // Also add to reading history
    const historyRef = doc(collection(firestore, "userReadingHistory"));

    await setDoc(historyRef, {
      userId,
      bookId,
      progress,
      timestamp: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating reading progress:", error);
    throw error;
  }
};

// Get user's reading progress for a specific book
export const getReadingProgress = async (userId: string, bookId: string) => {
  try {
    const progressRef = doc(
      firestore,
      "userReadingProgress",
      `${userId}_${bookId}`,
    );
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      return progressDoc.data().progress;
    }

    return 0; // Default progress is 0%
  } catch (error) {
    console.error("Error fetching reading progress:", error);
    throw error;
  }
};

// Get user's preferences
export const getUserPreferences = async (userId: string) => {
  try {
    const userPrefsRef = doc(firestore, "userPreferences", userId);
    const userPrefsDoc = await getDoc(userPrefsRef);

    if (userPrefsDoc.exists()) {
      return userPrefsDoc.data();
    }

    return null;
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    throw error;
  }
};

// Update user's preferences
export const updateUserPreferences = async (
  userId: string,
  preferences: {
    favoriteGenres?: string[];
    favoriteAuthors?: string[];
    readingGoals?: {
      booksPerMonth?: number;
      pagesPerDay?: number;
    };
    contentPreferences?: {
      adultContent?: boolean;
      preferredLength?: "short" | "medium" | "long";
    };
  },
) => {
  try {
    const userPrefsRef = doc(firestore, "userPreferences", userId);

    await setDoc(userPrefsRef, preferences, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};

// Record user feedback on a recommendation
export const recordUserFeedback = async (
  userId: string,
  bookId: string,
  feedback: "like" | "dislike",
) => {
  try {
    // Store the feedback
    const feedbackRef = doc(firestore, "userFeedback", `${userId}_${bookId}`);

    await setDoc(
      feedbackRef,
      {
        userId,
        bookId,
        feedback,
        timestamp: serverTimestamp(),
      },
      { merge: true },
    );

    // Update user's preference probabilities based on feedback
    // This is where you could implement more sophisticated recommendation logic
    const bookDoc = await getDoc(doc(firestore, "books", bookId));

    if (bookDoc.exists()) {
      const book = bookDoc.data();
      const genres = book.genres || [];

      // Get current user preferences
      const userPrefsRef = doc(firestore, "userPreferences", userId);
      const userPrefsDoc = await getDoc(userPrefsRef);

      // Initialize or update genre preferences
      const genrePreferences = userPrefsDoc.exists()
        ? userPrefsDoc.data().genrePreferences || {}
        : {};

      // Update preference probabilities for each genre
      // Define the interface for genre preferences
      interface GenrePreference {
        count: number;
        likes: number;
      }

      genres.forEach((genre: string) => {
        if (!genrePreferences[genre]) {
          genrePreferences[genre] = { count: 0, likes: 0 };
        }

        genrePreferences[genre].count += 1;
        if (feedback === "like") {
          genrePreferences[genre].likes += 1;
        }
      });

      // Save updated preferences
      await updateDoc(userPrefsRef, {
        genrePreferences,
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording user feedback:", error);
    throw error;
  }
};
