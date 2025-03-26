import { getFirestore } from "firebase-admin/firestore";

import {
  withRateLimit,
  withOptionalAuth,
  AuthenticatedRequest,
} from "../middleware";
import { firebaseAdmin } from "../utils/firebase-admin";
import { successResponse, errorResponse } from "../utils/response";
import { AIProviderFactory } from "../utils/genai";

import { FIREBASE_COLLECTIONS, SEARCH } from "@/lib/constants";

const db = getFirestore(firebaseAdmin);

async function handler(req: AuthenticatedRequest) {
  const userId = req.user?.uid;
  try {
    if (userId) {
      const userDoc = await db
        .collection(FIREBASE_COLLECTIONS.USERS)
        .doc(userId)
        .get();
      if (userDoc.exists && userDoc.data()?.preferences) {
        const preferences = userDoc.data()?.preferences;
        const favoriteGenres = preferences?.favoriteGenres || [];
        if (favoriteGenres.length > 0) {
          const genresToQuery = favoriteGenres.slice(0, 10);
          const genreQuery = db
            .collection(FIREBASE_COLLECTIONS.BOOKS)
            .where("genres", "array-contains-any", genresToQuery)
            .orderBy("rating", "desc")
            .limit(SEARCH.POPULAR_BOOKS_LIMIT);
          const genreSnapshot = await genreQuery.get();
          if (!genreSnapshot.empty) {
            const books = genreSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            return successResponse({ books, source: "personalized" });
          }
        }
      }
      const historyQuery = db
        .collection(FIREBASE_COLLECTIONS.USER_HISTORY)
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(5);
      const historySnapshot = await historyQuery.get();
      const recentBooks = [];
      for (const doc of historySnapshot.docs) {
        const bookId = doc.data().bookId;
        const bookDoc = await db
          .collection(FIREBASE_COLLECTIONS.BOOKS)
          .doc(bookId)
          .get();
        if (bookDoc.exists) {
          recentBooks.push({
            title: bookDoc.data()?.title,
            author: bookDoc.data()?.author,
            genres: bookDoc.data()?.genres,
          });
        }
      }
      const preferences = userDoc.data()?.preferences;
      if (recentBooks.length > 0) {
        const prompt = `Please recommend books based on the user's reading history and preferences.
        Recent books: ${recentBooks.map((book) => `"${book.title}" by ${book.author} (${book.genres?.join(", ")})`).join("; ")}
        ${preferences?.favoriteGenres?.length ? `Favorite genres: ${preferences.favoriteGenres.join(", ")}` : ""}
        ${preferences?.preferredLength ? `Preferred length: ${preferences.preferredLength}` : ""}
        Please provide 6-10 book recommendations in JSON format with title, author, publication date, genres, description, rating, and page count.`;
        try {
          const aiProvider = AIProviderFactory.getProvider();
          const aiResponse = await aiProvider.getRecommendations(prompt);
          return successResponse({
            books: aiResponse.recommendations,
            source: "ai_personalized",
          });
        } catch {}
      }
    }
    const popularQuery = db
      .collection(FIREBASE_COLLECTIONS.BOOKS)
      .orderBy("rating", "desc")
      .orderBy("reviewCount", "desc")
      .limit(SEARCH.POPULAR_BOOKS_LIMIT);
    const popularSnapshot = await popularQuery.get();
    const popularBooks = popularSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return successResponse({ books: popularBooks, source: "popular" });
  } catch (error) {
    return errorResponse(
      `Failed to get recommendations: ${(error as Error).message}`,
      500,
    );
  }
}

export const GET = withRateLimit(withOptionalAuth(handler), 50);
