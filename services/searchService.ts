import {
  addDoc,
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
import { Configuration, OpenAIApi } from "openai";

import { firestore } from "../lib/firebase";
import { Book, SearchOptions } from "../store/bookSlice";
import { SEARCH, FIREBASE_COLLECTIONS } from "../lib/constants";
import { API } from "../lib/constants";
import { miscUtils, stringUtils } from "../lib/utils";

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Types
export interface SearchHistoryItem {
  id: string;
  query: string;
  options: SearchOptions;
  timestamp: number;
  userId?: string;
  results?: {
    id: string;
    title: string;
    author: string;
    imageUrl?: string;
  }[];
}

export interface SearchResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Search for books using query and options
 */
export const searchBooks = async (
  query: string,
  options: SearchOptions = {},
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  pageSize: number = SEARCH.MAX_RESULTS,
): Promise<SearchResult<Book>> => {
  try {
    // If the query is empty, return popular books instead
    if (!query.trim()) {
      return getPopularBooks(pageSize);
    }

    // For simple keyword searches, we can use Firestore query
    // For more complex natural language searches, we'll use OpenAI
    if (
      query.length <= SEARCH.MIN_SEARCH_LENGTH &&
      !options.genre &&
      !options.mood &&
      !options.length
    ) {
      return searchBooksWithKeyword(query, options, lastDoc, pageSize);
    } else {
      return searchBooksWithAI(query, options, pageSize);
    }
  } catch (error) {
    console.error("Error searching books:", error);
    throw new Error(`Failed to search books: ${(error as Error).message}`);
  }
};

/**
 * Search for books using keyword in Firestore
 */
const searchBooksWithKeyword = async (
  keyword: string,
  options: SearchOptions = {},
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  pageSize: number = SEARCH.MAX_RESULTS,
): Promise<SearchResult<Book>> => {
  const booksRef = collection(firestore, FIREBASE_COLLECTIONS.BOOKS);
  const constraints = [];

  // Add keyword search (title and author)
  if (keyword) {
    // Simple contains search (Note: Firestore doesn't support full-text search)
    // For production, consider using Algolia or ElasticSearch
    const keywordLower = keyword.toLowerCase();
    constraints.push(where("titleLowerCase", ">=", keywordLower));
    constraints.push(where("titleLowerCase", "<=", keywordLower + "\uf8ff"));
  }

  // Add filters based on options
  if (options.genre) {
    constraints.push(where("genres", "array-contains", options.genre));
  }

  // Length filter (based on page count)
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

  // Add sorting (by rating by default)
  constraints.push(orderBy("rating", "desc"));
  constraints.push(limit(pageSize));

  // Add pagination if lastDoc is provided
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(booksRef, ...constraints);
  const querySnapshot = await getDocs(q);

  // Get the last document for pagination
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

  // Convert to Book objects
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

/**
 * Search for books using AI (OpenAI)
 */
const searchBooksWithAI = async (
  query: string,
  options: SearchOptions = {},
  limit: number = SEARCH.MAX_RESULTS,
): Promise<SearchResult<Book>> => {
  // First, check if we have cached results for this query
  const cachedResults = await getCachedSearchResults(query, options);
  if (cachedResults && cachedResults.length >= limit) {
    return {
      data: cachedResults.slice(0, limit),
      lastDoc: null,
      hasMore: false,
    };
  }

  // Build the prompt for OpenAI
  let prompt = `I'm looking for book recommendations that match this query: "${query}".`;

  if (options.genre) {
    prompt += ` They should be in the ${options.genre} genre.`;
  }

  if (options.length) {
    prompt += ` I prefer ${options.length} books (${
      options.length === "short"
        ? "less than 300 pages"
        : options.length === "medium"
          ? "300-500 pages"
          : "more than 500 pages"
    }).`;
  }

  if (options.mood) {
    prompt += ` I'm in the mood for something ${options.mood}.`;
  }

  prompt += `\n\nProvide exactly ${Math.min(limit, 10)} book recommendations as a JSON array with these fields for each book:
  - title (string)
  - author (string)
  - description (string, brief summary)
  - genres (array of strings)
  - rating (number, 1-5 scale)
  - publicationDate (string, year)
  - pageCount (number)
  - imageUrl (string, URL to book cover if available)`;

  // Call OpenAI API
  const response = await openai.createChatCompletion({
    model: API.OPENAI.MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a knowledgeable literary assistant that provides book recommendations in JSON format.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: API.OPENAI.MAX_TOKENS,
  });

  const content = response.data.choices[0]?.message?.content || "";

  // Parse the response to extract the JSON data
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  try {
    const books = JSON.parse(jsonMatch[0]);

    // Format the results
    const formattedBooks: Book[] = books.map((book: any) => ({
      id: `ai-${miscUtils.generateRandomId(10)}`,
      title: book.title,
      author: book.author,
      description: book.description || "No description available",
      genres: Array.isArray(book.genres)
        ? book.genres
        : [book.genre || "Unknown"],
      rating: typeof book.rating === "number" ? book.rating : 0,
      reviewCount: typeof book.reviewCount === "number" ? book.reviewCount : 0,
      publicationDate: book.publicationDate || "Unknown",
      pageCount: typeof book.pageCount === "number" ? book.pageCount : 0,
      imageUrl:
        book.imageUrl || book.coverImage || "/images/default-book-cover.jpg",
    }));

    // Save results to cache
    await cacheSearchResults(query, options, formattedBooks);

    return {
      data: formattedBooks,
      lastDoc: null,
      hasMore: false,
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error("Failed to parse AI recommendations");
  }
};

/**
 * Get popular books
 */
export const getPopularBooks = async (
  limit: number = SEARCH.POPULAR_BOOKS_LIMIT,
): Promise<SearchResult<Book>> => {
  const booksRef = collection(firestore, FIREBASE_COLLECTIONS.BOOKS);
  const q = query(
    booksRef,
    orderBy("rating", "desc"),
    orderBy("reviewCount", "desc"),
    limit(limit),
  );

  const querySnapshot = await getDocs(q);

  const books = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Book[];

  return {
    data: books,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
    hasMore: querySnapshot.docs.length === limit,
    total: querySnapshot.docs.length,
  };
};

/**
 * Save search history
 */
export const saveSearchHistory = async (
  query: string,
  options: SearchOptions = {},
  results: Book[] = [],
  userId?: string,
): Promise<string> => {
  try {
    // Create the search history item
    const historyItem: Omit<SearchHistoryItem, "id"> = {
      query,
      options,
      timestamp: Date.now(),
      userId,
      results: results.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        imageUrl: book.imageUrl,
      })),
    };

    // Save to Firestore if user is logged in
    if (userId) {
      const userHistoryRef = collection(
        firestore,
        "users",
        userId,
        "searchHistory",
      );
      const docRef = await addDoc(userHistoryRef, {
        ...historyItem,
        timestamp: serverTimestamp(),
      });

      return docRef.id;
    } else {
      // For guest users, return a placeholder ID
      return `guest-${Date.now()}`;
    }
  } catch (error) {
    console.error("Error saving search history:", error);
    return `error-${Date.now()}`;
  }
};

/**
 * Get user search history
 */
export const getUserSearchHistory = async (
  userId: string,
  limit: number = 20,
): Promise<SearchHistoryItem[]> => {
  try {
    const userHistoryRef = collection(
      firestore,
      "users",
      userId,
      "searchHistory",
    );
    const q = query(userHistoryRef, orderBy("timestamp", "desc"), limit(limit));

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.().getTime() || Date.now(),
    })) as SearchHistoryItem[];
  } catch (error) {
    console.error("Error getting search history:", error);
    return [];
  }
};

/**
 * Cache search results for future use
 */
const cacheSearchResults = async (
  query: string,
  options: SearchOptions,
  results: Book[],
): Promise<void> => {
  try {
    // Create a cache key based on the query and options
    const cacheKey = createCacheKey(query, options);
    const cacheRef = doc(firestore, "searchCache", cacheKey);

    // Save to cache with expiration time (1 week)
    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() + 7);

    await setDoc(cacheRef, {
      query,
      options,
      results,
      timestamp: serverTimestamp(),
      expiration: expirationTime,
    });
  } catch (error) {
    console.error("Error caching search results:", error);
    // Non-critical error, we can still return the results
  }
};

/**
 * Get cached search results
 */
const getCachedSearchResults = async (
  query: string,
  options: SearchOptions,
): Promise<Book[] | null> => {
  try {
    const cacheKey = createCacheKey(query, options);
    const cacheRef = doc(firestore, "searchCache", cacheKey);
    const cacheDoc = await getDoc(cacheRef);

    if (cacheDoc.exists()) {
      const data = cacheDoc.data();

      // Check if cache is expired
      const expiration =
        data.expiration?.toDate?.() || new Date(data.expiration);
      if (expiration < new Date()) {
        return null;
      }

      return data.results as Book[];
    }

    return null;
  } catch (error) {
    console.error("Error getting cached search results:", error);
    return null;
  }
};

/**
 * Create a cache key from query and options
 */
const createCacheKey = (query: string, options: SearchOptions): string => {
  const normalizedQuery = query.toLowerCase().trim();
  const optionsStr = JSON.stringify(options);

  // Create a deterministic key that's safe for Firestore document IDs
  return (
    miscUtils.generateRandomId(8) +
    "-" +
    Buffer.from(`${normalizedQuery}-${optionsStr}`)
      .toString("base64")
      .replace(/\//g, "_")
      .replace(/\+/g, "-")
      .replace(/=/g, "")
      .substring(0, 40)
  );
};

/**
 * Get trending searches
 */
export const getTrendingSearches = async (
  limit: number = 10,
): Promise<string[]> => {
  try {
    const statsRef = collection(firestore, "searchStats");
    const q = query(statsRef, orderBy("count", "desc"), limit(limit));

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data().query);
  } catch (error) {
    console.error("Error getting trending searches:", error);
    return [];
  }
};

/**
 * Get book recommendations for the landing page
 */
export const getRecommendedBooks = async (
  userId?: string,
  limit: number = SEARCH.POPULAR_BOOKS_LIMIT,
): Promise<Book[]> => {
  try {
    // If user is logged in, get personalized recommendations
    if (userId) {
      const userDoc = await getDoc(doc(firestore, "users", userId));

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
  } catch (error) {
    console.error("Error getting recommended books:", error);
    // Fallback to popular books if there's an error
    const popularResult = await getPopularBooks(limit);
    return popularResult.data;
  }
};

/**
 * Record search query for analytics
 */
export const recordSearchQuery = async (query: string): Promise<void> => {
  try {
    if (!query.trim()) return;

    const normalizedQuery = query.toLowerCase().trim();
    const statsRef = doc(
      firestore,
      "searchStats",
      stringUtils.slugify(normalizedQuery),
    );
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      // Increment count if query already exists
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
      // Create new record if this is a new query
      await setDoc(statsRef, {
        query: normalizedQuery,
        count: 1,
        firstSearched: serverTimestamp(),
        lastSearched: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error recording search query:", error);
    // Non-critical error, continue execution
  }
};

/**
 * Find related search terms based on a partial query
 */
export const getRelatedSearchTerms = async (
  partialQuery: string,
  limit: number = 5,
): Promise<string[]> => {
  if (!partialQuery || partialQuery.length < 2) return [];

  try {
    const normalizedQuery = partialQuery.toLowerCase().trim();
    const statsRef = collection(firestore, "searchStats");
    const q = query(
      statsRef,
      where("query", ">=", normalizedQuery),
      where("query", "<=", normalizedQuery + "\uf8ff"),
      orderBy("query"),
      orderBy("count", "desc"),
      limit(limit),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data().query);
  } catch (error) {
    console.error("Error getting related search terms:", error);
    return [];
  }
};

/**
 * Get books by genre
 */
export const getBooksByGenre = async (
  genre: string,
  limit: number = SEARCH.MAX_RESULTS,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
): Promise<SearchResult<Book>> => {
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
    console.error(`Error getting books by genre ${genre}:`, error);
    throw error;
  }
};

/**
 * Get recently added books
 */
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
  } catch (error) {
    console.error("Error getting recently added books:", error);
    return [];
  }
};

/**
 * Get similar search queries
 */
export const getSimilarSearchQueries = async (
  query: string,
  limit: number = 5,
): Promise<string[]> => {
  if (!query.trim()) return [];

  try {
    // First check for exact or partial matches
    const relatedSearches = await getRelatedSearchTerms(query, limit);

    // If we have enough related searches, return them
    if (relatedSearches.length >= limit) {
      return relatedSearches;
    }

    // Otherwise, we'll use OpenAI to suggest related queries
    const prompt = `I searched for "${query}" on a book recommendation website. 
    What are ${limit - relatedSearches.length} other related search queries I might be interested in?
    Please respond with only a JSON array of strings representing the search queries.`;

    const response = await openai.createChatCompletion({
      model: API.OPENAI.MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant providing related book search terms in JSON format.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.data.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      try {
        const suggestions = JSON.parse(jsonMatch[0]) as string[];

        // Combine with existing related searches, removing duplicates
        const combinedResults = Array.from(
          new Set([...relatedSearches, ...suggestions]),
        ).slice(0, limit);
        return combinedResults;
      } catch {
        return relatedSearches;
      }
    }

    return relatedSearches;
  } catch (error) {
    console.error("Error getting similar search queries:", error);
    return [];
  }
};
