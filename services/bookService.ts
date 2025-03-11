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
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

import { firestore } from "../services/firebase";
import { openai } from "./openai";

// Types
interface BookQuery {
  genres?: string[];
  minRating?: number;
  maxPages?: number;
  searchTerm?: string;
  mood?: string;
  sortBy?: "rating" | "newest" | "title";
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  pageSize?: number;
}

interface ReviewData {
  bookId: string;
  userId: string;
  rating: number;
  text: string;
}

// Get a book by its ID
export const getBookById = async (id: string) => {
  try {
    const bookDoc = await getDoc(doc(firestore, "books", id));

    if (!bookDoc.exists()) {
      throw new Error("Book not found");
    }

    return { id: bookDoc.id, ...bookDoc.data() };
  } catch (error) {
    console.error("Error fetching book:", error);
    throw error;
  }
};

// Search books with pagination
export const searchBooks = async (bookQuery: BookQuery = {}) => {
  try {
    const {
      genres,
      minRating,
      maxPages,
      searchTerm,
      sortBy = "rating",
      lastDoc,
      pageSize = 10,
    } = bookQuery;

    let booksRef = collection(firestore, "books");
    let q = query(booksRef);
    let constraints = [];

    // Add filters
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

    // Add sorting
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
    // Build query with constraints
    q = query(booksRef, ...constraints, limit(pageSize));

    // If we have a lastDoc (pagination), start after that document
    if (lastDoc) {
      q = query(booksRef, ...constraints, limit(pageSize), startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);

    // Get the last document for pagination
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    // Extract book data
    const books = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      books,
      lastDoc: lastVisible,
      hasMore: querySnapshot.docs.length === pageSize,
    };
  } catch (error) {
    console.error("Error searching books:", error);
    throw error;
  }
};

// Get similar books based on genres, or use OpenAI for recommendations
export const getSimilarBooks = async (
  bookId: string,
  genres: string[],
  forceRefresh = false,
) => {
  try {
    // Check if we have cached recommendations and don't need to refresh
    if (!forceRefresh) {
      const cachedRecsDoc = await getDoc(
        doc(firestore, "bookRecommendations", bookId),
      );

      if (cachedRecsDoc.exists()) {
        const cachedData = cachedRecsDoc.data();
        // Check if cache is less than 24 hours old
        const cacheTime = cachedData.timestamp?.toDate() || new Date(0);
        const now = new Date();
        const cacheAge = now.getTime() - cacheTime.getTime();
        const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge < cacheDuration) {
          return cachedData.recommendations || [];
        }
      }
    }

    // Get similar books by genres (fallback method if OpenAI isn't used)
    const q = query(
      collection(firestore, "books"),
      where("genres", "array-contains-any", genres),
      where("id", "!=", bookId),
      orderBy("rating", "desc"),
      limit(10),
    );

    const querySnapshot = await getDocs(q);
    const similarBooks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Optionally use OpenAI for more refined recommendations
    // This would require the book details to be sent to OpenAI
    // and the response processed to find matching books

    // Save recommendations to cache
    await updateDoc(doc(firestore, "bookRecommendations", bookId), {
      recommendations: similarBooks,
      timestamp: serverTimestamp(),
    });

    return similarBooks;
  } catch (error) {
    console.error("Error getting similar books:", error);
    throw error;
  }
};

// Get reviews for a book
export const getBookReviews = async (bookId: string) => {
  try {
    const q = query(
      collection(firestore, "reviews"),
      where("bookId", "==", bookId),
      orderBy("createdAt", "desc"),
    );

    const reviewsSnapshot = await getDocs(q);

    return reviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }
};

// Add a review for a book
export const addBookReview = async (reviewData: ReviewData) => {
  try {
    // Add the review
    const docRef = await addDoc(collection(firestore, "reviews"), {
      ...reviewData,
      createdAt: serverTimestamp(),
    });

    // Update the book's average rating and review count
    const bookRef = doc(firestore, "books", reviewData.bookId);
    const bookDoc = await getDoc(bookRef);

    if (bookDoc.exists()) {
      const bookData = bookDoc.data();
      const currentRating = bookData.rating || 0;
      const currentReviewCount = bookData.reviewCount || 0;

      // Calculate new average rating
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
    console.error("Error adding review:", error);
    throw error;
  }
};

// Get AI-powered book recommendations based on user query
export const getAIBookRecommendations = async (
  query: string,
  options: {
    genres?: string[];
    mood?: string;
    length?: "short" | "medium" | "long";
    userId?: string;
  } = {},
) => {
  try {
    // Get user preferences if userId is provided
    let userPreferences = null;

    if (options.userId) {
      const userDoc = await getDoc(
        doc(firestore, "userPreferences", options.userId),
      );

      if (userDoc.exists()) {
        userPreferences = userDoc.data();
      }
    }

    // Construct the prompt for OpenAI
    let prompt = `Recommend books based on the following query: "${query}"`;

    if (options.genres?.length) {
      prompt += `\nPreferred genres: ${options.genres.join(", ")}`;
    }

    if (options.mood) {
      prompt += `\nDesired mood: ${options.mood}`;
    }

    if (options.length) {
      prompt += `\nPreferred length: ${options.length} books`;
    }

    if (userPreferences) {
      prompt += "\nUser preferences:";
      if (userPreferences.favoriteGenres?.length) {
        prompt += `\n- Favorite genres: ${userPreferences.favoriteGenres.join(", ")}`;
      }
      if (userPreferences.favoriteAuthors?.length) {
        prompt += `\n- Favorite authors: ${userPreferences.favoriteAuthors.join(", ")}`;
      }
    }

    prompt +=
      "\nPlease provide each recommendation in JSON format with these fields: title, author, description, genres, and estimated rating (1-5).";

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a book recommendation assistant. Provide book recommendations based on the user's query and preferences.",
        },
        { role: "user", content: prompt },
      ],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
    });

    // Process the response
    const responseContent = completion.choices[0].message.content;

    if (!responseContent) {
      throw new Error("Empty response from AI");
    }

    // Parse the JSON response
    const recommendations = JSON.parse(responseContent);

    // Save the query and recommendations to the user's history if userId is provided
    if (options.userId) {
      await addDoc(collection(firestore, "userHistory"), {
        userId: options.userId,
        query,
        options,
        recommendations,
        timestamp: serverTimestamp(),
      });
    }

    return recommendations.books || [];
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    throw error;
  }
};

// Get popular/trending books
export const getPopularBooks = async (limitCount = 10) => {
  try {
    const q = query(
      collection(firestore, "books"),
      orderBy("rating", "desc"),
      orderBy("reviewCount", "desc"),
      limit(limitCount),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching popular books:", error);
    throw error;
  }
};
