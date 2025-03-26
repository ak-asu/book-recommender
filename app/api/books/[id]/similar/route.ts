import { getFirestore } from "firebase-admin/firestore";

import {
  withRateLimit,
  withOptionalAuth,
  AuthenticatedRequest,
} from "../../../middleware";
import { firebaseAdmin } from "../../../utils/firebase-admin";
import { AIProviderFactory } from "../../../utils/genai";
import { successResponse, errorResponse } from "../../../utils/response";

import { FIREBASE_COLLECTIONS, SEARCH } from "@/lib/constants";

const db = getFirestore(firebaseAdmin);

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } },
) {
  const bookId = params.id;
  if (!bookId) {
    return errorResponse("Book ID is required", 400);
  }
  // Check for cached recommendations first
  const cachedRecsRef = db
    .collection(FIREBASE_COLLECTIONS.BOOK_RECOMMENDATIONS)
    .doc(bookId);
  const cachedRecsDoc = await cachedRecsRef.get();
  // If we have fresh cached recommendations, return them
  if (cachedRecsDoc.exists) {
    const cachedData = cachedRecsDoc.data()!;
    const cacheTime = cachedData.timestamp?.toDate() || new Date(0);
    const cacheAge = Date.now() - cacheTime.getTime();
    // If cache is less than 7 days old, use it
    if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
      return successResponse({
        books: cachedData.recommendations || [],
        source: "cache",
      });
    }
  }
  // Get the original book details
  const bookRef = db.collection(FIREBASE_COLLECTIONS.BOOKS).doc(bookId);
  const bookDoc = await bookRef.get();
  if (!bookDoc.exists) {
    return errorResponse("Book not found", 404);
  }
  const bookData = bookDoc.data()!;
  // Get similar books by genres from database
  const genreQuery = db
    .collection(FIREBASE_COLLECTIONS.BOOKS)
    .where("genres", "array-contains-any", bookData.genres || [])
    .where("id", "!=", bookId)
    .orderBy("id")
    .orderBy("rating", "desc")
    .limit(SEARCH.RECOMMENDATION_COUNT);
  const genreBasedBooksSnap = await genreQuery.get();
  const similarBooks = genreBasedBooksSnap.docs.map((doc) => ({
    id: doc.id,
    title: doc.get("title"),
    author: doc.get("author"),
    ...(doc.data() as Record<string, any>),
  }));
  // If we have enough books from the database, use those
  if (similarBooks.length >= SEARCH.RECOMMENDATION_COUNT / 2) {
    // Save to cache for future requests
    await cachedRecsRef.set({
      recommendations: similarBooks,
      timestamp: new Date(),
      source: "database",
    });
    return successResponse({
      books: similarBooks,
      source: "database",
    });
  }
  // Otherwise, use OpenAI to enhance recommendations
  try {
    const prompt = `Please recommend books similar to "${bookData.title}" by ${bookData.author}. 
      This book is in the ${bookData.genres?.join(", ") || "unknown"} genre(s).
      Brief description: ${bookData.description || "Not available"}
      
      Please suggest 6 similar books that readers might enjoy, providing the following details for each:
      - Title
      - Author
      - Publication date
      - Genre(s)
      - Brief description of the book
      - Average rating (1-5 scale)
      
      Format your response as a JSON array of objects with these fields.`;
    const aiProvider = AIProviderFactory.getProvider();
    const aiResponse = await aiProvider.getRecommendations(prompt);
    const aiBooks = aiResponse.recommendations;
    const combinedBooks = [...similarBooks];
    // Add books from OpenAI that aren't already in the results
    for (const book of aiBooks) {
      if (
        !combinedBooks.some(
          (b) =>
            b.id === book.id ||
            (b.title === book.title && b.author === book.author),
        )
      ) {
        combinedBooks.push(book);
      }
      if (combinedBooks.length >= SEARCH.RECOMMENDATION_COUNT) break;
    }
    await cachedRecsRef.set({
      recommendations: combinedBooks,
      timestamp: new Date(),
      source: "hybrid",
    });
    return successResponse({
      books: combinedBooks,
      source: "hybrid",
    });
  } catch {
    // If AI fails, just return what we have from the database
    await cachedRecsRef.set({
      recommendations: similarBooks,
      timestamp: new Date(),
      source: "database_fallback",
    });
    return successResponse({
      books: similarBooks,
      source: "database_fallback",
    });
  }
}

export const GET = withRateLimit(withOptionalAuth(handler), 20);
