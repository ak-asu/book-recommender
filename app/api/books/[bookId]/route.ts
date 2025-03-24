import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  limit,
  orderBy,
} from "firebase/firestore";
import { Configuration, OpenAIApi } from "openai";

import { db } from "@/lib/firebase";

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// GET - Retrieve a specific book with related books
export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } },
) {
  try {
    const { bookId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";

    // Get book document
    const bookRef = doc(db, "books", bookId);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const bookData = bookSnap.data();

    // Find similar books based on genre
    const similarBooksQuery = query(
      collection(db, "books"),
      where("genre", "==", bookData.genre),
      where("__name__", "!=", bookId),
      orderBy("rating", "desc"),
      limit(5),
    );

    const similarBooksSnapshot = await getDocs(similarBooksQuery);
    const similarBooks = similarBooksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    let bookWithMetadata = {
      id: bookSnap.id,
      ...bookData,
      similarBooks,
    };

    // If user is logged in, mark if book is bookmarked/favorited
    if (userId) {
      const userRef = collection(db, "users");
      const userQuery = query(userRef, where("uid", "==", userId));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const bookmarks = userData.bookmarks || [];
        const favorites = userData.favorites || [];

        bookWithMetadata.isBookmarked = bookmarks.includes(bookId);
        bookWithMetadata.isFavorite = favorites.includes(bookId);

        // Record this book view in user history
        const historyRef = collection(
          db,
          "users",
          userSnapshot.docs[0].id,
          "viewHistory",
        );
        await updateDoc(doc(historyRef, bookId), {
          viewCount: bookData.viewCount ? bookData.viewCount + 1 : 1,
          lastViewed: Timestamp.now(),
        });
      }
    }

    return NextResponse.json(bookWithMetadata, { status: 200 });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 },
    );
  }
}

// PUT - Update book information
export async function PUT(
  request: NextRequest,
  { params }: { params: { bookId: string } },
) {
  try {
    const { bookId } = params;
    const body = await request.json();

    // Get book document
    const bookRef = doc(db, "books", bookId);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Update the book
    await updateDoc(bookRef, {
      ...body,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json(
      { message: "Book updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 },
    );
  }
}

// POST - Get personalized recommendations related to this book
export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string } },
) {
  try {
    const { bookId } = params;
    const body = await request.json();
    const { userId, feedback } = body;

    // Get book document
    const bookRef = doc(db, "books", bookId);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const bookData = bookSnap.data();

    // Store user feedback if provided
    if (userId && feedback) {
      const userRef = collection(db, "users");
      const userQuery = query(userRef, where("uid", "==", userId));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();

        // Update user preferences based on feedback
        const preferences = userData.preferences || {};
        const genrePreference = preferences[bookData.genre] || 0;

        // Adjust preference based on feedback
        let preferenceChange = 0;
        if (feedback === "like") preferenceChange = 0.1;
        else if (feedback === "dislike") preferenceChange = -0.1;

        preferences[bookData.genre] = Math.min(
          Math.max(genrePreference + preferenceChange, 0),
          1,
        );

        // Store feedback
        const feedbackRef = collection(
          db,
          "users",
          userSnapshot.docs[0].id,
          "feedback",
        );
        await updateDoc(doc(feedbackRef, bookId), {
          feedback,
          timestamp: Timestamp.now(),
        });

        // Update user preferences
        await updateDoc(doc(db, "users", userSnapshot.docs[0].id), {
          preferences,
          updatedAt: Timestamp.now(),
        });
      }
    }

    // Generate more personalized recommendations
    let prompt = `Recommend books similar to "${bookData.title}" by ${bookData.author}, which is a ${bookData.genre} book.`;

    if (userId) {
      // If we have user preferences, include them
      const userRef = collection(db, "users");
      const userQuery = query(userRef, where("uid", "==", userId));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const preferences = userData.preferences || {};

        // Add user preferences to prompt
        const preferredGenres = Object.entries(preferences)
          .filter(([_, value]) => value > 0.5)
          .map(([genre, _]) => genre);

        if (preferredGenres.length > 0) {
          prompt += ` The reader particularly enjoys ${preferredGenres.join(", ")}.`;
        }
      }
    }

    prompt += ` For each book, provide the title, author, publication year, a brief synopsis, genre, and estimated page count. Format as a JSON array of 5 book objects.`;

    // Make request to OpenAI
    const aiResponse = await openai.createCompletion({
      model: "text-davinci-003", // or an appropriate model
      prompt,
      max_tokens: 2000,
      temperature: 0.7,
    });

    const responseText = aiResponse.data.choices[0].text?.trim() || "";

    let recommendations;
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

    return NextResponse.json(
      {
        recommendations,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}
