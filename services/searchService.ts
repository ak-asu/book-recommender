import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  startAfter,
  setDoc,
} from "firebase/firestore";

import { getPopularBooks } from "./bookService";

import { firestore } from "@/lib/firebase";
import { Book, PaginatedResult } from "@/types/book";
import { SearchOptions, SearchHistoryItem } from "@/types/search";
import { SEARCH, FIREBASE_COLLECTIONS } from "@/lib/constants";
import { stringUtils, firebasePathUtils, cacheUtils } from "@/lib/utils";

export const searchBooksWithKeyword = async (
  keyword: string,
  options: SearchOptions = {},
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  pageSize: number = SEARCH.MAX_RESULTS,
): Promise<PaginatedResult<Book>> => {
  const booksRef = collection(firestore, FIREBASE_COLLECTIONS.BOOKS);
  const constraints = [];
  if (keyword) {
    const keywordLower = keyword.toLowerCase();
    constraints.push(where("titleLowerCase", ">=", keywordLower));
    constraints.push(where("titleLowerCase", "<=", keywordLower + "\uf8ff"));
  }
  if (options.genre) {
    constraints.push(where("genres", "array-contains", options.genre));
  }
  if (options.length) {
    if (options.length === "short") {
      constraints.push(where("pageCount", "<", 300));
    } else if (options.length === "medium") {
      constraints.push(where("pageCount", ">=", 300));
      constraints.push(where("pageCount", "<=", 500));
    } else if (options.length === "long") {
      constraints.push(where("pageCount", ">", 500));
    }
  }
  constraints.push(orderBy("rating", "desc"));
  constraints.push(limit(pageSize));
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  const q = query(booksRef, ...constraints);
  const querySnapshot = await getDocs(q);
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
  const books = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Book[];
  return {
    data: books,
    lastDoc: lastVisible,
    hasMore: querySnapshot.docs.length === pageSize,
  };
};

export const getUserSearchHistory = async (
  userId: string,
  limit: number = 20,
): Promise<SearchHistoryItem[]> => {
  try {
    const userHistoryRef = collection(
      firestore,
      firebasePathUtils.userHistory(userId),
    );
    const q = query(userHistoryRef, orderBy("timestamp", "desc"), limit(limit));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.().getTime() || Date.now(),
    })) as SearchHistoryItem[];
  } catch {
    return [];
  }
};

export const cacheSearchResults = async (
  query: string,
  options: SearchOptions,
  results: Book[],
): Promise<void> => {
  try {
    // Create a cache key based on the query and options
    const cacheKey = cacheUtils.createCacheKey(query, options);
    const cacheRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.SEARCH_CACHE,
      cacheKey,
    );
    const expirationTime = new Date();
    expirationTime.setMilliseconds(
      expirationTime.getMilliseconds() + SEARCH.CACHE_DURATION_MS,
    );
    await setDoc(cacheRef, {
      query,
      options,
      results,
      timestamp: serverTimestamp(),
      expiration: expirationTime,
    });
  } catch {}
};

export const getCachedSearchResults = async (
  query: string,
  options: SearchOptions,
): Promise<Book[] | null> => {
  try {
    const cacheKey = cacheUtils.createCacheKey(query, options);
    const cacheRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.SEARCH_CACHE,
      cacheKey,
    );
    const cacheDoc = await getDoc(cacheRef);
    if (cacheDoc.exists()) {
      const data = cacheDoc.data();
      const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
      if (cacheUtils.isCacheExpired(timestamp, SEARCH.CACHE_DURATION_MS)) {
        return null;
      }
      return data.results as Book[];
    }
    return null;
  } catch {
    return null;
  }
};

export const getTrendingSearches = async (
  limit: number = 10,
): Promise<string[]> => {
  try {
    const statsRef = collection(firestore, FIREBASE_COLLECTIONS.SEARCH_STATS);
    const q = query(statsRef, orderBy("count", "desc"), limit(limit));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data().query);
  } catch {
    return [];
  }
};

export const getRecommendedBooks = async (
  userId?: string,
  limit: number = SEARCH.POPULAR_BOOKS_LIMIT,
): Promise<Book[]> => {
  try {
    if (userId) {
      const userDoc = await getDoc(
        doc(firestore, FIREBASE_COLLECTIONS.USERS, userId),
      );
      if (userDoc.exists() && userDoc.data().preferences) {
        const preferences = userDoc.data().preferences;
        const favoriteGenres = preferences.favoriteGenres || [];
        // If user has favorite genres, get books from those genres
        if (favoriteGenres.length > 0) {
          const genreQuery = query(
            collection(firestore, FIREBASE_COLLECTIONS.BOOKS),
            where("genres", "array-contains-any", favoriteGenres.slice(0, 10)), // Firestore limit: max 10 values
            orderBy("rating", "desc"),
            limit(limit),
          );
          const genreSnapshot = await getDocs(genreQuery);
          if (!genreSnapshot.empty) {
            return genreSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Book[];
          }
        }
      }
    }
    // Fallback to popular books if no personalized recommendations or not logged in
    const popularResult = await getPopularBooks(limit);
    return popularResult.data;
  } catch {
    // Fallback to popular books if there's an error
    const popularResult = await getPopularBooks(limit);
    return popularResult.data;
  }
};

export const recordSearchQuery = async (query: string): Promise<void> => {
  try {
    if (!query.trim()) return;
    const normalizedQuery = query.toLowerCase().trim();
    const statsRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.SEARCH_STATS,
      stringUtils.slugify(normalizedQuery),
    );
    const statsDoc = await getDoc(statsRef);
    if (statsDoc.exists()) {
      await setDoc(
        statsRef,
        {
          query: normalizedQuery,
          count: statsDoc.data().count + 1,
          lastSearched: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await setDoc(statsRef, {
        query: normalizedQuery,
        count: 1,
        firstSearched: serverTimestamp(),
        lastSearched: serverTimestamp(),
      });
    }
  } catch {}
};

export const getBooksByGenre = async (
  genre: string,
  limit: number = SEARCH.MAX_RESULTS,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
): Promise<PaginatedResult<Book>> => {
  try {
    const booksRef = collection(firestore, FIREBASE_COLLECTIONS.BOOKS);
    let q = query(
      booksRef,
      where("genres", "array-contains", genre),
      orderBy("rating", "desc"),
      limit(limit),
    );
    if (lastDoc) {
      q = query(
        booksRef,
        where("genres", "array-contains", genre),
        orderBy("rating", "desc"),
        startAfter(lastDoc),
        limit(limit),
      );
    }
    const querySnapshot = await getDocs(q);
    const books = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Book[];
    return {
      data: books,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      hasMore: querySnapshot.docs.length === limit,
    };
  } catch (error) {
    throw error;
  }
};

export const getRecentlyAddedBooks = async (
  limit: number = SEARCH.MAX_RESULTS,
): Promise<Book[]> => {
  try {
    const booksRef = collection(firestore, FIREBASE_COLLECTIONS.BOOKS);
    const q = query(booksRef, orderBy("createdAt", "desc"), limit(limit));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Book[];
  } catch {
    return [];
  }
};
