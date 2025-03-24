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
  setDoc,
} from "firebase/firestore";
import { Configuration, OpenAIApi } from "openai";

import { firestore } from "../lib/firebase";
import { Book, SearchOptions } from "../store/bookSlice";
import { UserPreferences } from "../store/userSlice";
import { miscUtils } from "../lib/utils";

// Import the OpenAI helper
import { API, SEARCH } from "../lib/constants";

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
  userName: string;
  userAvatar?: string;
}

interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// Get a book by its ID
export const getBookById = async (id: string): Promise<Book> => {
  try {
    const bookDoc = await getDoc(doc(firestore, "books", id));

    if (!bookDoc.exists()) {
      throw new Error("Book not found");
    }

    return { id: bookDoc.id, ...(bookDoc.data() as Omit<Book, "id">) };
  } catch (error) {
    console.error("Error fetching book:", error);
    throw error;
  }
};

// Search books with pagination
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

    let booksRef = collection(firestore, "books");
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
    let q = query(booksRef, ...constraints, limit(pageSize));

    // If we have a lastDoc (pagination), start after that document
    if (lastDoc) {
      q = query(booksRef, ...constraints, startAfter(lastDoc), limit(pageSize));
    }

    const querySnapshot = await getDocs(q);

    // Get the last document for pagination
    const lastVisible =
      querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    // Extract book data
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
    console.error("Error searching books:", error);
    throw error;
  }
};

// Get similar books based on genres and OpenAI recommendations
export const getSimilarBooks = async (
  bookId: string,
  bookDetails: Book,
  forceRefresh = false,
): Promise<Book[]> => {
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

    // Approach 1: Get similar books by genres (for quick results)
    const genreQuery = query(
      collection(firestore, "books"),
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
        await setDoc(doc(firestore, "bookRecommendations", bookId), {
          recommendations: combinedBooks,
          timestamp: serverTimestamp(),
        });

        return combinedBooks;
      } catch (error) {
        console.error("Error getting AI recommendations:", error);
        // Continue with genre-based results if AI fails
      }
    }

    // Save recommendations to cache
    await setDoc(doc(firestore, "bookRecommendations", bookId), {
      recommendations: similarBooks,
      timestamp: serverTimestamp(),
    });

    return similarBooks;
  } catch (error) {
    console.error("Error getting similar books:", error);
    throw error;
  }
};

// Get AI-powered similar books using OpenAI
async function getAISimilarBooks(book: Book): Promise<Book[]> {
  const prompt = `Please recommend books similar to "${book.title}" by ${book.author}. 
  This book is in the ${book.genres?.join(", ") || "unknown"} genre(s).
  Brief description: ${book.description || "Not available"}
  
  Please suggest 6 similar books that readers might enjoy, providing the following details for each:
  - Title
  - Author
  - Publication date
  - Genre(s)
  - Brief description of the book
  - Average rating (1-5 scale)
  
  Format your response as a JSON array of objects with these fields.`;

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
  } catch (error) {
    console.error("Error parsing AI recommendations:", error);
    return [];
  }
}

// Get reviews for a book
export const getBookReviews = async (bookId: string) => {
  try {
    const q = query(
      collection(firestore, "reviews"),
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
  options: SearchOptions & {
    userId?: string;
  } = {},
): Promise<Book[]> => {
  try {
    // Get user preferences if userId is provided
    let userPreferences: UserPreferences | null = null;

    if (options.userId) {
      const userDoc = await getDoc(doc(firestore, "users", options.userId));

      if (userDoc.exists() && userDoc.data().preferences) {
        userPreferences = userDoc.data().preferences as UserPreferences;
      }
    }

    // Construct the prompt for AI
    let prompt = `Recommend books based on the following query: "${query}"`;

    if (options.genre) {
      prompt += `\nPreferred genre: ${options.genre}`;
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
      if (userPreferences.preferredLength) {
        prompt += `\n- Preferred book length: ${userPreferences.preferredLength}`;
      }
      if (userPreferences.preferredMoods?.length) {
        prompt += `\n- Preferred moods: ${userPreferences.preferredMoods.join(", ")}`;
      }
    }

    prompt += `\n\nPlease return the recommendations as a JSON array with the following fields for each book:
    - id (a unique identifier)
    - title
    - author
    - publicationDate
    - description
    - genres (an array of genres)
    - rating (on a scale of 1-5)
    - reviewCount
    - pageCount
    - imageUrl (a URL to the book cover, if available)
    - buyLinks (an object with sites as keys and URLs as values)
    - readLinks (an object with sites as keys and URLs as values)`;

    // Get recommendations from OpenAI
    const response = await openai.createChatCompletion({
      model: API.OPENAI.MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a knowledgeable book recommendation system that provides detailed book information in JSON format.",
        },
        { role: "user", content: prompt },
      ],
      temperature: API.OPENAI.TEMPERATURE,
      max_tokens: API.OPENAI.MAX_TOKENS,
    });

    const content = response.data.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return [];
    }

    const booksData = JSON.parse(jsonMatch[0]);
    const recommendations = booksData.map((book: any) => ({
      id: book.id || `book-${miscUtils.generateRandomId(10)}`,
      title: book.title,
      author: book.author,
      publicationDate: book.publicationDate || "Unknown",
      description: book.description || "No description available",
      genres: Array.isArray(book.genres)
        ? book.genres
        : [book.genre || "Unknown"],
      rating: typeof book.rating === "number" ? book.rating : 0,
      reviewCount: typeof book.reviewCount === "number" ? book.reviewCount : 0,
      pageCount: typeof book.pageCount === "number" ? book.pageCount : 0,
      imageUrl:
        book.imageUrl || book.coverImage || "/images/default-book-cover.jpg",
      buyLinks: book.buyLinks || {},
      readLinks: book.readLinks || {},
    }));

    // Save the query and recommendations to the user's history if userId is provided
    if (options.userId) {
      await addDoc(collection(firestore, "userHistory"), {
        userId: options.userId,
        query,
        options,
        recommendations,
        timestamp: serverTimestamp(),
      });

      // Also save recommendations to book collection for future use
      for (const book of recommendations) {
        // Check if this book already exists in our database
        const existingBooks = await getDocs(
          query(
            collection(firestore, "books"),
            where("title", "==", book.title),
            where("author", "==", book.author),
          ),
        );

        if (existingBooks.empty) {
          // Add as a new book
          await addDoc(collection(firestore, "books"), {
            ...book,
            source: "ai",
            createdAt: serverTimestamp(),
          });
        }
      }
    }

    return recommendations;
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    throw error;
  }
};

// Get popular/trending books
export const getPopularBooks = async (
  limit = SEARCH.POPULAR_BOOKS_LIMIT,
): Promise<Book[]> => {
  try {
    const q = query(
      collection(firestore, "books"),
      orderBy("rating", "desc"),
      orderBy("reviewCount", "desc"),
      limit(limit),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
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
  } catch (error) {
    console.error("Error fetching popular books:", error);
    throw error;
  }
};

// Record user feedback (like/dislike) for a book recommendation
export const recordBookFeedback = async (
  userId: string,
  bookId: string,
  liked: boolean,
) => {
  try {
    const feedbackRef = doc(firestore, "userFeedback", `${userId}_${bookId}`);

    await setDoc(feedbackRef, {
      userId,
      bookId,
      liked,
      timestamp: serverTimestamp(),
    });

    // Get the book genres to update user preferences
    const bookDoc = await getDoc(doc(firestore, "books", bookId));

    if (bookDoc.exists()) {
      const userRef = doc(firestore, "users", userId);
      const userData = await getDoc(userRef);

      if (userData.exists()) {
        const book = bookDoc.data();
        const genres = book.genres || [];
        const currentPreferences = userData.data().preferences || {};

        // Update favorite genres based on feedback
        const favoriteGenres = currentPreferences.favoriteGenres || [];

        if (liked) {
          // Add genres to favorites if liked and not already there
          const updatedGenres = [...new Set([...favoriteGenres, ...genres])];
          await updateDoc(userRef, {
            "preferences.favoriteGenres": updatedGenres,
          });
        }

        // Record preference probability (stored separately to build recommendation model)
        const prefRef = doc(firestore, "userPreferences", userId);
        const prefDoc = await getDoc(prefRef);

        const genrePreferences = prefDoc.exists()
          ? prefDoc.data().genrePreferences || {}
          : {};

        // Update counts for each genre
        genres.forEach((genre) => {
          if (!genrePreferences[genre]) {
            genrePreferences[genre] = { count: 0, likes: 0 };
          }

          genrePreferences[genre].count += 1;
          if (liked) {
            genrePreferences[genre].likes += 1;
          }
        });

        await setDoc(
          prefRef,
          {
            userId,
            genrePreferences,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording book feedback:", error);
    throw error;
  }
};
