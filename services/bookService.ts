import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  serverTimestamp,
  startAfter,
  setDoc,
} from "firebase/firestore";

import { firestore } from "@/lib/firebase";
import { Book, PaginatedResult, BookQuery, ReviewData } from "@/types/book";
import { aiUtils, cacheUtils, miscUtils } from "@/lib/utils";
import { API, SEARCH, MESSAGES, FIREBASE_COLLECTIONS } from "@/lib/constants";

export const getBookById = async (id: string): Promise<Book> => {
  try {
    const bookDoc = await getDoc(
      doc(firestore, FIREBASE_COLLECTIONS.BOOKS, id),
    );
    if (!bookDoc.exists()) {
      throw new Error(MESSAGES.ERRORS.BOOK.NOT_FOUND);
    }
    return { id: bookDoc.id, ...(bookDoc.data() as Omit<Book, "id">) };
  } catch (error) {
    throw error;
  }
};

export const searchBooks = async (
  bookQuery: BookQuery = {},
): Promise<PaginatedResult<Book>> => {
  try {
    const {
      genres,
      minRating,
      maxPages,
      searchTerm,
      sortBy = "rating",
      lastDoc,
      pageSize = SEARCH.PAGINATION_SIZE,
    } = bookQuery;
    let booksRef = collection(firestore, FIREBASE_COLLECTIONS.BOOKS);
    let constraints = [];
    if (genres && genres.length > 0) {
      constraints.push(where("genres", "array-contains-any", genres));
    }
    if (minRating) {
      constraints.push(where("rating", ">=", minRating));
    }
    if (maxPages) {
      constraints.push(where("pageCount", "<=", maxPages));
    }
    if (searchTerm) {
      // For proper text search, you might need a service like Algolia or Elasticsearch
      // This is a simple implementation that works for exact matches
      constraints.push(where("title", ">=", searchTerm));
      constraints.push(where("title", "<=", searchTerm + "\uf8ff"));
    }
    let sortConstraint;
    switch (sortBy) {
      case "newest":
        sortConstraint = orderBy("publicationDate", "desc");
        break;
      case "title":
        sortConstraint = orderBy("title");
        break;
      case "rating":
      default:
        sortConstraint = orderBy("rating", "desc");
    }
    constraints.push(sortConstraint);
    let q = query(booksRef, ...constraints, limit(pageSize));
    if (lastDoc) {
      q = query(booksRef, ...constraints, startAfter(lastDoc), limit(pageSize));
    }
    const querySnapshot = await getDocs(q);
    const lastVisible =
      querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    const books = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Book[];
    return {
      data: books,
      lastDoc: lastVisible,
      hasMore: querySnapshot.docs.length === pageSize,
    };
  } catch (error) {
    throw error;
  }
};

export const getSimilarBooks = async (
  bookId: string,
  bookDetails: Book,
  forceRefresh = false,
): Promise<Book[]> => {
  try {
    if (!forceRefresh) {
      const cachedRecsDoc = await getDoc(
        doc(firestore, FIREBASE_COLLECTIONS.BOOK_RECOMMENDATIONS, bookId),
      );
      if (cachedRecsDoc.exists()) {
        const cachedData = cachedRecsDoc.data();
        // Check if cache is less than 24 hours old
        const cacheTime = cachedData.timestamp?.toDate() || new Date(0);
        if (!cacheUtils.isCacheExpired(cacheTime)) {
          return cachedData.recommendations || [];
        }
      }
    }
    // Approach 1: Get similar books by genres (for quick results)
    const genreQuery = query(
      collection(firestore, FIREBASE_COLLECTIONS.BOOKS),
      where("genres", "array-contains-any", bookDetails.genres || []),
      where("id", "!=", bookId),
      orderBy("rating", "desc"),
      limit(SEARCH.RECOMMENDATION_COUNT),
    );
    const genreBasedBooks = await getDocs(genreQuery);
    const similarBooks = genreBasedBooks.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Book[];
    // Approach 2: Use OpenAI for enhanced recommendations if genre-based results are insufficient
    if (similarBooks.length < SEARCH.RECOMMENDATION_COUNT / 2) {
      try {
        const openAIRecommendations = await getAISimilarBooks(bookDetails);
        const combinedBooks = [...similarBooks];
        // Add books from OpenAI that aren't already in the results
        for (const book of openAIRecommendations) {
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
        // Save recommendations to cache
        await setDoc(
          doc(firestore, FIREBASE_COLLECTIONS.BOOK_RECOMMENDATIONS, bookId),
          {
            recommendations: combinedBooks,
            timestamp: serverTimestamp(),
          },
        );
        return combinedBooks;
      } catch {}
    }
    await setDoc(
      doc(firestore, FIREBASE_COLLECTIONS.BOOK_RECOMMENDATIONS, bookId),
      {
        recommendations: similarBooks,
        timestamp: serverTimestamp(),
      },
    );
    return similarBooks;
  } catch (error) {
    throw error;
  }
};

async function getAISimilarBooks(book: Book): Promise<Book[]> {
  const prompt = aiUtils.getSimilarBooksPrompt(book);
  const response = await openai.createChatCompletion({
    model: API.OPENAI.MODEL,
    messages: [
      { role: "system", content: "You are a helpful literary assistant." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });
  const content = response.data.choices[0]?.message?.content || "";
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const books = JSON.parse(jsonMatch[0]);
    return books.map((recommendation: any) => ({
      id: `ai-${book.title.toLowerCase().replace(/\s+/g, "-")}-${recommendation.title.toLowerCase().replace(/\s+/g, "-")}-${miscUtils.generateRandomId(6)}`,
      title: recommendation.title,
      author: recommendation.author,
      publicationDate: recommendation.publicationDate || "Unknown",
      genres:
        recommendation.genres ||
        recommendation.genre?.split(",").map((g: string) => g.trim()) ||
        [],
      description: recommendation.description || "No description available",
      rating: recommendation.rating || 0,
      reviewCount: recommendation.reviewCount || 0,
      imageUrl: recommendation.imageUrl || "/images/default-book-cover.jpg",
      pageCount: recommendation.pageCount || 0,
    }));
  } catch {
    return [];
  }
}

export const getBookReviews = async (bookId: string) => {
  try {
    const q = query(
      collection(firestore, FIREBASE_COLLECTIONS.REVIEWS),
      where("bookId", "==", bookId),
      orderBy("createdAt", "desc"),
    );
    const reviewsSnapshot = await getDocs(q);
    return reviewsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        rating: data.rating,
        text: data.text,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      };
    });
  } catch (error) {
    throw error;
  }
};

export const addBookReview = async (reviewData: ReviewData) => {
  try {
    const docRef = await addDoc(
      collection(firestore, FIREBASE_COLLECTIONS.REVIEWS),
      {
        ...reviewData,
        createdAt: serverTimestamp(),
      },
    );
    const bookRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.BOOKS,
      reviewData.bookId,
    );
    const bookDoc = await getDoc(bookRef);
    if (bookDoc.exists()) {
      const bookData = bookDoc.data();
      const currentRating = bookData.rating || 0;
      const currentReviewCount = bookData.reviewCount || 0;
      const newRating =
        (currentRating * currentReviewCount + reviewData.rating) /
        (currentReviewCount + 1);
      await updateDoc(bookRef, {
        rating: newRating,
        reviewCount: currentReviewCount + 1,
      });
    }
    return { id: docRef.id };
  } catch (error) {
    throw error;
  }
};

export const getPopularBooks = async (
  limit = SEARCH.POPULAR_BOOKS_LIMIT,
): Promise<PaginatedResult<Book>> => {
  try {
    const q = query(
      collection(firestore, FIREBASE_COLLECTIONS.BOOKS),
      orderBy("rating", "desc"),
      orderBy("reviewCount", "desc"),
      limit(limit),
    );
    const querySnapshot = await getDocs(q);
    const books = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        author: data.author,
        publicationDate: data.publicationDate,
        description: data.description,
        genres: data.genres,
        rating: data.rating,
        reviewCount: data.reviewCount,
        pageCount: data.pageCount,
        imageUrl: data.imageUrl || data.image,
        buyLinks: data.buyLinks || {},
        readLinks: data.readLinks || {},
      } as Book;
    });
    return {
      data: books,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      hasMore: querySnapshot.docs.length === limit,
    };
  } catch (error) {
    throw error;
  }
};
