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
  Timestamp,
} from "firebase/firestore";

import { firestore } from "../lib/firebase";
import { Book } from "../store/bookSlice";
import { UserPreferences } from "../store/userSlice";
import { FIREBASE_COLLECTIONS } from "../lib/constants";

// Types
interface ReadingProgress {
  userId: string;
  bookId: string;
  progress: number;
  updatedAt: Timestamp | Date;
}

interface UserHistory {
  userId: string;
  bookId: string;
  progress?: number;
  timestamp: Timestamp | Date;
  action: "view" | "read" | "bookmark" | "favorite" | "feedback";
}

interface GenrePreference {
  count: number;
  likes: number;
  probability?: number; // likes/count
}

interface UserPreferenceProbabilities {
  userId: string;
  genrePreferences: Record<string, GenrePreference>;
  lengthPreferences?: Record<string, GenrePreference>;
  moodPreferences?: Record<string, GenrePreference>;
  updatedAt: Timestamp | Date;
}

// Add to user history
export const addToUserHistory = async (
  userId: string,
  bookId: string,
  action: UserHistory["action"],
  progress?: number,
) => {
  try {
    const historyRef = collection(firestore, "userHistory");
    await addDoc(historyRef, {
      userId,
      bookId,
      action,
      progress,
      timestamp: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding to user history:", error);
    throw error;
  }
};

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
    const bookmarkRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.BOOKMARKS,
      `${userId}_${bookId}`,
    );

    await setDoc(bookmarkRef, {
      userId,
      bookId,
      createdAt: serverTimestamp(),
    });

    // Add to user history
    await addToUserHistory(userId, bookId, "bookmark");

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
    const bookmarkRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.BOOKMARKS,
      `${userId}_${bookId}`,
    );

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
    const bookmarkRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.BOOKMARKS,
      `${userId}_${bookId}`,
    );
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
    const favoriteRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.FAVORITES,
      `${userId}_${bookId}`,
    );

    await setDoc(favoriteRef, {
      userId,
      bookId,
      createdAt: serverTimestamp(),
    });

    // Add to user history
    await addToUserHistory(userId, bookId, "favorite");

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
    const favoriteRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.FAVORITES,
      `${userId}_${bookId}`,
    );

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
    const favoriteRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.FAVORITES,
      `${userId}_${bookId}`,
    );
    const favoriteDoc = await getDoc(favoriteRef);

    return favoriteDoc.exists();
  } catch (error) {
    console.error("Error checking favorite:", error);
    throw error;
  }
};

// Get user's bookmarked books with details
export const getUserBookmarks = async (
  userId: string,
  maxResults = 50,
): Promise<Book[]> => {
  try {
    const q = query(
      collection(firestore, FIREBASE_COLLECTIONS.BOOKMARKS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults),
    );

    const bookmarksSnapshot = await getDocs(q);
    const bookIds = bookmarksSnapshot.docs.map((doc) => doc.data().bookId);

    // Get book details for each bookmark
    const bookDetails = await Promise.all(
      bookIds.map(async (bookId) => {
        const bookDoc = await getDoc(
          doc(firestore, FIREBASE_COLLECTIONS.BOOKS, bookId),
        );

        if (bookDoc.exists()) {
          return { id: bookDoc.id, ...bookDoc.data() } as Book;
        }

        return null;
      }),
    );

    // Filter out any null values (books that don't exist)
    return bookDetails.filter((book): book is Book => book !== null);
  } catch (error) {
    console.error("Error fetching user bookmarks:", error);
    throw error;
  }
};

// Get user's favorite books with details
export const getUserFavorites = async (
  userId: string,
  maxResults = 50,
): Promise<Book[]> => {
  try {
    const q = query(
      collection(firestore, FIREBASE_COLLECTIONS.FAVORITES),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults),
    );

    const favoritesSnapshot = await getDocs(q);
    const bookIds = favoritesSnapshot.docs.map((doc) => doc.data().bookId);

    // Get book details for each favorite
    const bookDetails = await Promise.all(
      bookIds.map(async (bookId) => {
        const bookDoc = await getDoc(
          doc(firestore, FIREBASE_COLLECTIONS.BOOKS, bookId),
        );

        if (bookDoc.exists()) {
          return { id: bookDoc.id, ...bookDoc.data() } as Book;
        }

        return null;
      }),
    );

    // Filter out any null values
    return bookDetails.filter((book): book is Book => book !== null);
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    throw error;
  }
};

// Add item to "saved for later"
export const addToSavedForLater = async (userId: string, bookId: string) => {
  try {
    const userRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        savedForLater: [bookId],
        createdAt: serverTimestamp(),
      });
    } else {
      // Add to saved for later for existing user
      await updateDoc(userRef, {
        savedForLater: arrayUnion(bookId),
      });
    }

    // Track in separate collection
    const savedRef = doc(firestore, "savedForLater", `${userId}_${bookId}`);

    await setDoc(savedRef, {
      userId,
      bookId,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding to saved for later:", error);
    throw error;
  }
};

// Remove from "saved for later"
export const removeFromSavedForLater = async (
  userId: string,
  bookId: string,
) => {
  try {
    // Remove from user's saved for later array
    const userRef = doc(firestore, "users", userId);

    await updateDoc(userRef, {
      savedForLater: arrayRemove(bookId),
    });

    // Remove from separate saved for later collection
    const savedRef = doc(firestore, "savedForLater", `${userId}_${bookId}`);

    await deleteDoc(savedRef);

    return { success: true };
  } catch (error) {
    console.error("Error removing from saved for later:", error);
    throw error;
  }
};

// Get user's saved for later books with details
export const getSavedForLaterBooks = async (
  userId: string,
  maxResults = 50,
): Promise<Book[]> => {
  try {
    const q = query(
      collection(firestore, "savedForLater"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults),
    );

    const savedSnapshot = await getDocs(q);
    const bookIds = savedSnapshot.docs.map((doc) => doc.data().bookId);

    // Get book details for each saved for later
    const bookDetails = await Promise.all(
      bookIds.map(async (bookId) => {
        const bookDoc = await getDoc(
          doc(firestore, FIREBASE_COLLECTIONS.BOOKS, bookId),
        );

        if (bookDoc.exists()) {
          return { id: bookDoc.id, ...bookDoc.data() } as Book;
        }

        return null;
      }),
    );

    // Filter out any null values
    return bookDetails.filter((book): book is Book => book !== null);
  } catch (error) {
    console.error("Error fetching saved for later books:", error);
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
      collection(firestore, "userHistory"),
      where("userId", "==", userId),
      where("action", "==", "read"),
      orderBy("timestamp", "desc"),
      limit(maxResults),
    );

    const historySnapshot = await getDocs(q);
    const history = historySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp:
        doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp),
    }));

    // Get book details for each history item
    const historyWithBooks = await Promise.all(
      history.map(async (item) => {
        const bookDoc = await getDoc(
          doc(firestore, FIREBASE_COLLECTIONS.BOOKS, item.bookId),
        );

        if (bookDoc.exists()) {
          return {
            ...item,
            book: { id: bookDoc.id, ...bookDoc.data() } as Book,
          };
        }

        return item;
      }),
    );

    return historyWithBooks;
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
    await addToUserHistory(userId, bookId, "read", progress);

    return { success: true, progress };
  } catch (error) {
    console.error("Error updating reading progress:", error);
    throw error;
  }
};

// Get user's reading progress for a specific book
export const getReadingProgress = async (
  userId: string,
  bookId: string,
): Promise<number> => {
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
    return 0;
  }
};

// Get user's preferences
export const getUserPreferences = async (
  userId: string,
): Promise<UserPreferences | null> => {
  try {
    const userRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists() && userDoc.data().preferences) {
      return userDoc.data().preferences as UserPreferences;
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
  preferences: Partial<UserPreferences>,
) => {
  try {
    const userRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const currentPreferences = userDoc.data().preferences || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };

    await updateDoc(userRef, {
      preferences: updatedPreferences,
    });

    return { success: true, preferences: updatedPreferences };
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
    const liked = feedback === "like";

    // Store the feedback
    const feedbackRef = doc(firestore, "userFeedback", `${userId}_${bookId}`);

    await setDoc(
      feedbackRef,
      {
        userId,
        bookId,
        liked,
        timestamp: serverTimestamp(),
      },
      { merge: true },
    );

    // Add to user history
    await addToUserHistory(userId, bookId, "feedback");

    // Update user's preference probabilities based on feedback
    const bookDoc = await getDoc(
      doc(firestore, FIREBASE_COLLECTIONS.BOOKS, bookId),
    );

    if (bookDoc.exists()) {
      const book = bookDoc.data();
      const genres = book.genres || [];
      const length = book.pageCount
        ? book.pageCount < 300
          ? "short"
          : book.pageCount < 500
            ? "medium"
            : "long"
        : undefined;

      // Get current user preferences
      const userPrefsRef = doc(firestore, "userPreferences", userId);
      const userPrefsDoc = await getDoc(userPrefsRef);

      // Initialize or update preference probabilities
      const preferenceData: UserPreferenceProbabilities = {
        userId,
        genrePreferences: userPrefsDoc.exists()
          ? userPrefsDoc.data().genrePreferences || {}
          : {},
        lengthPreferences: userPrefsDoc.exists()
          ? userPrefsDoc.data().lengthPreferences || {}
          : {},
        moodPreferences: userPrefsDoc.exists()
          ? userPrefsDoc.data().moodPreferences || {}
          : {},
        updatedAt: serverTimestamp(),
      };

      // Update genre preferences
      genres.forEach((genre: string) => {
        if (!preferenceData.genrePreferences[genre]) {
          preferenceData.genrePreferences[genre] = { count: 0, likes: 0 };
        }

        preferenceData.genrePreferences[genre].count += 1;
        if (liked) {
          preferenceData.genrePreferences[genre].likes += 1;
        }

        // Calculate probability
        preferenceData.genrePreferences[genre].probability =
          preferenceData.genrePreferences[genre].likes /
          preferenceData.genrePreferences[genre].count;
      });

      // Update length preference if available
      if (length) {
        if (!preferenceData.lengthPreferences[length]) {
          preferenceData.lengthPreferences[length] = { count: 0, likes: 0 };
        }

        preferenceData.lengthPreferences[length].count += 1;
        if (liked) {
          preferenceData.lengthPreferences[length].likes += 1;
        }

        // Calculate probability
        preferenceData.lengthPreferences[length].probability =
          preferenceData.lengthPreferences[length].likes /
          preferenceData.lengthPreferences[length].count;
      }

      // Save updated preferences
      await setDoc(userPrefsRef, preferenceData, { merge: true });

      // Also update the user's preferences in the user document
      // for easier access in the frontend
      const userRef = doc(firestore, "users", userId);
      const userData = await getDoc(userRef);

      if (userData.exists()) {
        const currentPreferences = userData.data().preferences || {};
        const favoriteGenres = currentPreferences.favoriteGenres || [];

        // If the feedback is positive, ensure these genres are in the user's favorites
        if (liked) {
          const updatedGenres = [...new Set([...favoriteGenres, ...genres])];

          // Only update if there are changes
          if (
            JSON.stringify(updatedGenres) !== JSON.stringify(favoriteGenres)
          ) {
            await updateDoc(userRef, {
              "preferences.favoriteGenres": updatedGenres,
              "preferences.preferredLength":
                length || currentPreferences.preferredLength,
            });
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording user feedback:", error);
    throw error;
  }
};

// Get user recommendation statistics
export const getUserRecommendationStats = async (userId: string) => {
  try {
    const userPrefRef = doc(firestore, "userPreferences", userId);
    const userPrefDoc = await getDoc(userPrefRef);

    if (!userPrefDoc.exists()) {
      return {
        totalRecommendations: 0,
        likedRecommendations: 0,
        topGenres: [],
        preferredLength: null,
      };
    }

    const prefData = userPrefDoc.data();
    const genrePreferences = prefData.genrePreferences || {};
    const lengthPreferences = prefData.lengthPreferences || {};

    // Calculate totals
    let totalRecommendations = 0;
    let likedRecommendations = 0;

    Object.values(genrePreferences).forEach((pref: GenrePreference) => {
      totalRecommendations += pref.count;
      likedRecommendations += pref.likes;
    });

    // Get top genres (by probability with minimum threshold of interactions)
    const topGenres = Object.entries(genrePreferences)
      .filter(([_, pref]) => pref.count >= 3) // Minimum threshold for reliable data
      .map(([genre, pref]) => ({
        genre,
        probability: pref.likes / pref.count,
        count: pref.count,
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);

    // Determine preferred length
    let preferredLength: string | null = null;
    let highestLengthProb = 0;

    Object.entries(lengthPreferences).forEach(([length, pref]) => {
      if (pref.count >= 2) {
        const probability = pref.likes / pref.count;
        if (probability > highestLengthProb) {
          highestLengthProb = probability;
          preferredLength = length;
        }
      }
    });

    return {
      totalRecommendations,
      likedRecommendations,
      likeRatio:
        totalRecommendations > 0
          ? likedRecommendations / totalRecommendations
          : 0,
      topGenres,
      preferredLength,
    };
  } catch (error) {
    console.error("Error getting user recommendation stats:", error);
    throw error;
  }
};
