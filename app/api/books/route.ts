import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { Configuration, OpenAIApi } from "openai";

import { db } from "@/lib/firebase";

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// GET - Retrieve books with filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";
    const genre = searchParams.get("genre") || "";
    const limitParam = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const userId = searchParams.get("userId") || "";

    let booksQuery = collection(db, "books");

    // Build query based on filters
    if (genre) {
      booksQuery = query(booksQuery, where("genre", "==", genre));
    }

    if (searchQuery) {
      // Basic search - In a production app, consider using Algolia or similar
      booksQuery = query(
        booksQuery,
        where(
          "keywords",
          "array-contains-any",
          searchQuery.toLowerCase().split(" "),
        ),
      );
    }

    booksQuery = query(
      booksQuery,
      orderBy("rating", "desc"),
      limit(limitParam + offset),
    );

    const snapshot = await getDocs(booksQuery);

    let books = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .slice(offset, offset + limitParam);

    // If user is logged in, mark books that are in their bookmarks/favorites
    if (userId) {
      const userRef = collection(db, "users");
      const userQuery = query(userRef, where("uid", "==", userId));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const bookmarks = userData.bookmarks || [];
        const favorites = userData.favorites || [];

        books = books.map((book) => ({
          ...book,
          isBookmarked: bookmarks.includes(book.id),
          isFavorite: favorites.includes(book.id),
        }));
      }
    }

    return NextResponse.json(
      {
        books,
        total: snapshot.size,
        hasMore: snapshot.size > offset + limitParam,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}

// POST - Search for books using OpenAI recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, genre, mood, length, userId } = body;

    if (!query && !genre && !mood && !length) {
      return NextResponse.json(
        { error: "No search criteria provided" },
        { status: 400 },
      );
    }

    // First check if we have similar previous searches
    const searchesRef = collection(db, "searches");
    const similarSearchQuery = query(
      searchesRef,
      where("query", "==", query || ""),
      where("genre", "==", genre || ""),
      where("mood", "==", mood || ""),
      where("length", "==", length || ""),
      limit(1),
    );

    const similarSearches = await getDocs(similarSearchQuery);

    let recommendations;
    let searchId;

    // If we have a similar search, use cached results
    if (!similarSearches.empty) {
      const searchDoc = similarSearches.docs[0];
      recommendations = searchDoc.data().recommendations;
      searchId = searchDoc.id;
    } else {
      // Build prompt for OpenAI
      let prompt = `Recommend books`;

      if (query) prompt += ` about ${query}`;
      if (genre) prompt += ` in the ${genre} genre`;
      if (mood) prompt += ` with a ${mood} mood`;
      if (length) prompt += ` that are ${length} in length`;

      prompt += `. For each book, provide the title, author, publication year, a brief synopsis, genre, and estimated page count. Format as a JSON array of book objects.`;

      // Make request to OpenAI
      const aiResponse = await openai.createCompletion({
        model: "text-davinci-003", // or an appropriate model
        prompt,
        max_tokens: 2000,
        temperature: 0.7,
      });

      const responseText = aiResponse.data.choices[0].text?.trim() || "";

      try {
        // Parse OpenAI response
        recommendations = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        return NextResponse.json(
          { error: "Failed to parse book recommendations" },
          { status: 500 },
        );
      }

      // Store search in database
      const searchDoc = await addDoc(searchesRef, {
        query: query || "",
        genre: genre || "",
        mood: mood || "",
        length: length || "",
        recommendations,
        createdAt: Timestamp.now(),
      });

      searchId = searchDoc.id;

      // Store recommended books in database if they don't exist
      const booksRef = collection(db, "books");

      for (const book of recommendations) {
        const bookQuery = query(
          booksRef,
          where("title", "==", book.title),
          where("author", "==", book.author),
        );

        const existingBooks = await getDocs(bookQuery);

        if (existingBooks.empty) {
          // Add keywords for search
          const keywords = [
            ...book.title.toLowerCase().split(" "),
            ...book.author.toLowerCase().split(" "),
            book.genre.toLowerCase(),
          ];

          await addDoc(booksRef, {
            ...book,
            rating: book.rating || 4.0,
            reviews: book.reviews || 0,
            keywords,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      }
    }

    // If user is logged in, mark books as bookmarked/favorited as needed
    if (userId) {
      const userRef = collection(db, "users");
      const userQuery = query(userRef, where("uid", "==", userId));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const bookmarks = userData.bookmarks || [];
        const favorites = userData.favorites || [];

        // Update user's search history
        const historyRef = collection(
          db,
          "users",
          userSnapshot.docs[0].id,
          "searchHistory",
        );
        await addDoc(historyRef, {
          searchId,
          query: query || "",
          genre: genre || "",
          mood: mood || "",
          length: length || "",
          timestamp: Timestamp.now(),
        });
      }
    }

    return NextResponse.json(
      {
        searchId,
        recommendations,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error searching books:", error);
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 },
    );
  }
}
