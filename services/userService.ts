import {
  doc,
  addDoc,
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

import { firestore } from "@/lib/firebase";
import {
  FIREBASE_COLLECTIONS,
  COLLECTION_CONFIG,
  MESSAGES,
} from "@/lib/constants";
import { bookUtils } from "@/lib/utils";
import { Book } from "@/types/book";
import {
  UserPreferences,
  UserHistory,
  GenrePreference,
  UserPreferenceProbabilities,
  CollectionType,
} from "@/types/user";

export const addToUserHistory = async (
  userId: string,
  bookId: string,
  action: UserHistory["action"],
  progress?: number,
): Promise<{ success: boolean }> => {
  try {
    const historyRef = collection(firestore, FIREBASE_COLLECTIONS.USER_HISTORY);
    await addDoc(historyRef, {
      userId,
      bookId,
      action,
      progress,
      timestamp: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const addToCollection = async (
  userId: string,
  bookId: string,
  collectionType: CollectionType,
): Promise<{ success: boolean }> => {
  try {
    const config = COLLECTION_CONFIG[collectionType];
    const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        [config.userField]: [bookId],
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        [config.userField]: arrayUnion(bookId),
      });
    }
    // Also track this in a separate collection for easier querying
    const itemRef = doc(
      firestore,
      config.collectionName,
      `${userId}_${bookId}`,
    );
    await setDoc(itemRef, {
      userId,
      bookId,
      createdAt: serverTimestamp(),
    });
    // Add to user history if there's a history action defined
    if (config.historyAction) {
      await addToUserHistory(userId, bookId, config.historyAction);
    }
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const removeFromCollection = async (
  userId: string,
  bookId: string,
  collectionType: CollectionType,
): Promise<{ success: boolean }> => {
  try {
    const config = COLLECTION_CONFIG[collectionType];
    const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      [config.userField]: arrayRemove(bookId),
    });
    const itemRef = doc(
      firestore,
      config.collectionName,
      `${userId}_${bookId}`,
    );
    await deleteDoc(itemRef);
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const isInCollection = async (
  userId: string,
  bookId: string,
  collectionType: CollectionType,
): Promise<boolean> => {
  try {
    const config = COLLECTION_CONFIG[collectionType];
    const itemRef = doc(
      firestore,
      config.collectionName,
      `${userId}_${bookId}`,
    );
    const itemDoc = await getDoc(itemRef);
    return itemDoc.exists();
  } catch {
    return false;
  }
};

export const getUserCollection = async (
  userId: string,
  collectionType: CollectionType,
  maxResults = 50,
): Promise<Book[]> => {
  try {
    const config = COLLECTION_CONFIG[collectionType];
    const q = query(
      collection(firestore, config.collectionName),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults),
    );
    const itemsSnapshot = await getDocs(q);
    const bookIds = itemsSnapshot.docs.map((doc) => doc.data().bookId);
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
    return bookDetails.filter((book): book is Book => book !== null);
  } catch (error) {
    throw error;
  }
};

export const getUserReadingHistory = async (
  userId: string,
  maxResults = 20,
) => {
  try {
    const q = query(
      collection(firestore, FIREBASE_COLLECTIONS.USER_HISTORY),
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
    throw error;
  }
};

export const updateReadingProgress = async (
  userId: string,
  bookId: string,
  progress: number,
) => {
  try {
    const progressRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.USER_READING_PROGRESS,
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
    await addToUserHistory(userId, bookId, "read", progress);
    return { success: true, progress };
  } catch (error) {
    throw error;
  }
};

export const getReadingProgress = async (
  userId: string,
  bookId: string,
): Promise<number> => {
  try {
    const progressRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.USER_READING_PROGRESS,
      `${userId}_${bookId}`,
    );
    const progressDoc = await getDoc(progressRef);
    if (progressDoc.exists()) {
      return progressDoc.data().progress;
    }
    return 0; // Default progress is 0%
  } catch {
    return 0;
  }
};

export const getUserPreferences = async (
  userId: string,
): Promise<UserPreferences | null> => {
  try {
    const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists() && userDoc.data().preferences) {
      return userDoc.data().preferences as UserPreferences;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>,
) => {
  try {
    const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error(MESSAGES.ERRORS.AUTH.REQUIRED);
    }
    const currentPreferences = userDoc.data().preferences || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };
    await updateDoc(userRef, {
      preferences: updatedPreferences,
    });
    return { success: true, preferences: updatedPreferences };
  } catch (error) {
    throw error;
  }
};

export const recordUserFeedback = async (
  userId: string,
  bookId: string,
  feedback: "like" | "dislike",
) => {
  try {
    const liked = feedback === "like";
    const feedbackRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.USER_FEEDBACK,
      `${userId}_${bookId}`,
    );
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
    await addToUserHistory(userId, bookId, "feedback");
    const bookDoc = await getDoc(
      doc(firestore, FIREBASE_COLLECTIONS.BOOKS, bookId),
    );
    if (bookDoc.exists()) {
      const book = bookDoc.data();
      const genres = book.genres || [];
      const length = bookUtils.getBookLengthCategory(book.pageCount);
      const userPrefsRef = doc(
        firestore,
        FIREBASE_COLLECTIONS.USER_PREFERENCES,
        userId,
      );
      const userPrefsDoc = await getDoc(userPrefsRef);
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
      genres.forEach((genre: string) => {
        if (!preferenceData.genrePreferences[genre]) {
          preferenceData.genrePreferences[genre] = { count: 0, likes: 0 };
        }
        preferenceData.genrePreferences[genre].count += 1;
        if (liked) {
          preferenceData.genrePreferences[genre].likes += 1;
        }
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
      await setDoc(userPrefsRef, preferenceData, { merge: true });
      // Also update the user's preferences in the user document
      // for easier access in the frontend
      const userRef = doc(firestore, FIREBASE_COLLECTIONS.USERS, userId);
      const userData = await getDoc(userRef);
      if (userData.exists()) {
        const currentPreferences = userData.data().preferences || {};
        const favoriteGenres = currentPreferences.favoriteGenres || [];
        // If the feedback is positive, ensure these genres are in the user's favorites
        if (liked) {
          const updatedGenres = Array.from(
            new Set([...favoriteGenres, ...genres]),
          );
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
    throw error;
  }
};

export const getUserRecommendationStats = async (userId: string) => {
  try {
    const userPrefRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.USER_PREFERENCES,
      userId,
    );
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
    let totalRecommendations = 0;
    let likedRecommendations = 0;
    Object.values(genrePreferences as Record<string, GenrePreference>).forEach(
      (pref) => {
        totalRecommendations += pref.count;
        likedRecommendations += pref.likes;
      },
    );
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
    throw error;
  }
};
