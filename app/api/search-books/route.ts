import { getFirestore, FieldValue } from "firebase-admin/firestore";

import {
  withRateLimit,
  withOptionalAuth,
  AuthenticatedRequest,
} from "../middleware";
import { firebaseAdmin } from "../utils/firebase-admin";
import { successResponse, errorResponse } from "../utils/response";
import { AIProviderFactory } from "../utils/genai";

import { FIREBASE_COLLECTIONS, SEARCH, AI_PROMPTS } from "@/lib/constants";

const db = getFirestore(firebaseAdmin);

async function handler(req: AuthenticatedRequest) {
  const { query, options, regenerate = false } = await req.json();
  if (!query || query.trim().length === 0)
    return errorResponse("Search query is required", 400);
  if (query.trim().length < SEARCH.MIN_SEARCH_LENGTH)
    return errorResponse(
      `Search query must be at least ${SEARCH.MIN_SEARCH_LENGTH} characters`,
      400,
    );
  const cacheKey = !regenerate ? createCacheKey(query, options) : null;
  if (cacheKey) {
    const cachedResults = await getCachedSearchResults(cacheKey);
    if (cachedResults)
      return successResponse({
        books: cachedResults,
        source: "cache",
        query,
        options,
      });
  }
  const prompt = buildPrompt(query, options);
  try {
    const aiProvider = AIProviderFactory.getProvider();
    const response = await aiProvider.getRecommendations(prompt);
    const books = response.recommendations;
    if (cacheKey) await cacheSearchResults(cacheKey, query, options, books);
    if (req.user) await saveSearchHistory(req.user.uid, query, options, books);
    for (const book of books) {
      const bookRef = db.collection(FIREBASE_COLLECTIONS.BOOKS).doc(book.id);
      const bookDoc = await bookRef.get();
      if (!bookDoc.exists) {
        await bookRef.set({
          ...book,
          createdAt: FieldValue.serverTimestamp(),
          source: "openai",
          searchQueries: [query],
        });
      } else {
        await bookRef.update({
          searchQueries: [...(bookDoc.data()?.searchQueries ?? []), query],
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    return successResponse({ books, source: "openai", query, options });
  } catch (error) {
    return errorResponse(
      `Failed to get book recommendations: ${(error as Error).message}`,
      500,
    );
  }
}

function buildPrompt(query: string, options: any): string {
  return AI_PROMPTS.BOOK_RECOMMENDATION(
    query,
    options?.genre,
    options?.length,
    options?.mood,
    options?.userPreferences,
  );
}

function createCacheKey(query: string, options: any): string {
  const normalizedQuery = query.toLowerCase().trim();
  const optionsStr = JSON.stringify(options || {});
  return `${normalizedQuery}-${optionsStr}`;
}

async function getCachedSearchResults(cacheKey: string) {
  try {
    const cacheRef = db
      .collection(FIREBASE_COLLECTIONS.SEARCH_CACHE)
      .doc(cacheKey);
    const cacheDoc = await cacheRef.get();
    if (cacheDoc.exists) {
      const data = cacheDoc.data();
      const timestamp =
        data?.timestamp?.toDate() ??
        new Date(data?.timestamp ?? FieldValue.serverTimestamp());
      if (new Date().getTime() - timestamp.getTime() < SEARCH.CACHE_DURATION_MS)
        return data?.results ?? [];
    }
    return null;
  } catch {
    return null;
  }
}

async function cacheSearchResults(
  cacheKey: string,
  query: string,
  options: any,
  results: any[],
) {
  try {
    const cacheRef = db
      .collection(FIREBASE_COLLECTIONS.SEARCH_CACHE)
      .doc(cacheKey);
    await cacheRef.set({
      query,
      options,
      results,
      timestamp: FieldValue.serverTimestamp(),
      expiration: new Date(Date.now() + SEARCH.CACHE_DURATION_MS),
    });
  } catch {}
}

async function saveSearchHistory(
  userId: string,
  query: string,
  options: any,
  recommendations: any[],
) {
  try {
    const historyRef = db
      .collection(FIREBASE_COLLECTIONS.USERS)
      .doc(userId)
      .collection("searchHistory");
    historyRef.add({
      query,
      options,
      recommendations: recommendations.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        imageUrl: book.imageUrl,
      })),
      timestamp: FieldValue.serverTimestamp(),
    });
    const normalizedQuery = query.toLowerCase().trim();
    const statsRef = db
      .collection(FIREBASE_COLLECTIONS.SEARCH_STATS)
      .doc(normalizedQuery);
    const statsDoc = await statsRef.get();
    if (statsDoc.exists) {
      await statsRef.update({
        count: (statsDoc.data()?.count ?? 0) + 1,
        lastSearched: FieldValue.serverTimestamp(),
        users: [...(statsDoc.data()?.users ?? []), userId],
      });
    } else {
      await statsRef.set({
        query: normalizedQuery,
        count: 1,
        firstSearched: FieldValue.serverTimestamp(),
        lastSearched: FieldValue.serverTimestamp(),
        users: [userId],
      });
    }
  } catch {}
}

export const POST = withRateLimit(withOptionalAuth(handler), 10);
