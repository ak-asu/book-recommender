import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { Configuration, OpenAIApi } from "openai";

import { firestore } from "../lib/firebase";
import { Book } from "../store/bookSlice";
import { UserPreferences } from "../store/userSlice";
import { API } from "../lib/constants";
import { miscUtils } from "../lib/utils";

// Types
export interface SearchQuery {
  text: string;
  genre?: string;
  length?: "short" | "medium" | "long";
  mood?: string;
  timeFrame?: string;
}

export interface BookRecommendation extends Book {
  timestamp: string;
  purchaseLinks?: Array<{ name: string; url: string }>;
  readLinks?: Array<{ name: string; url: string }>;
}

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export class ChatService {
  /**
   * Get book recommendations based on user query and preferences
   */
  static async getBookRecommendations(
    searchQuery: SearchQuery,
    userPreferences?: UserPreferences,
    userId?: string,
  ): Promise<BookRecommendation[]> {
    try {
      // Build the prompt for OpenAI based on search query and user preferences
      const prompt = this.buildPrompt(searchQuery, userPreferences);

      // Call OpenAI API
      const response = await openai.createChatCompletion({
        model: API.OPENAI.MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a knowledgeable literary assistant that recommends books. Provide recommendations as structured JSON data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: API.OPENAI.TEMPERATURE,
        max_tokens: API.OPENAI.MAX_TOKENS,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      // Parse recommendations from response
      const recommendations = this.parseRecommendations(
        response.data.choices[0]?.message?.content || "",
      );

      // Save search query and results to Firestore
      await this.saveSearchHistory(searchQuery, recommendations, userId);

      return recommendations;
    } catch (error) {
      console.error("Error getting book recommendations:", error);
      throw new Error("Failed to get book recommendations");
    }
  }

  /**
   * Build a prompt for OpenAI based on search query and user preferences
   */
  private static buildPrompt(
    searchQuery: SearchQuery,
    userPreferences?: UserPreferences,
  ): string {
    let prompt = `Recommend books that match the following criteria: ${searchQuery.text}`;

    // Add search filters to prompt
    if (searchQuery.genre) {
      prompt += ` in the ${searchQuery.genre} genre`;
    }
    if (searchQuery.length) {
      prompt += ` that are ${searchQuery.length} in length`;
    }
    if (searchQuery.mood) {
      prompt += ` with a ${searchQuery.mood} mood`;
    }

    // Incorporate user preferences if available
    if (userPreferences) {
      prompt += `. Consider that the user has shown preference for `;

      if (userPreferences.favoriteGenres?.length) {
        prompt += `genres like ${userPreferences.favoriteGenres.join(", ")}, `;
      }

      if (userPreferences.preferredLength) {
        prompt += `${userPreferences.preferredLength} length books, `;
      }

      if (userPreferences.preferredMoods?.length) {
        prompt += `moods like ${userPreferences.preferredMoods.join(", ")}`;
      }
    }

    prompt += `. For each book, provide the following information in valid JSON format: 
    title, author, publicationDate, rating (1-5), reviewCount, description, genres (array), pageCount, 
    imageUrl (a URL if available), and where to purchase or read the book as buyLinks and readLinks objects. 
    Return at least 5 books if possible. Format your response as a JSON array of book objects.`;

    return prompt;
  }

  /**
   * Parse recommendations from OpenAI response
   */
  private static parseRecommendations(content: string): BookRecommendation[] {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.fallbackRecommendations();
      }

      const jsonContent = jsonMatch[0];
      const recommendations: any[] = JSON.parse(jsonContent);

      // Validate and format each recommendation
      return recommendations.map((book) => ({
        id: this.generateBookId(book),
        title: book.title || "Unknown Title",
        author: book.author || "Unknown Author",
        publicationDate: book.publicationDate || "Unknown",
        rating: typeof book.rating === "number" ? book.rating : 0,
        reviewCount:
          typeof book.reviewCount === "number" ? book.reviewCount : 0,
        description: book.description || "No description available",
        genres: Array.isArray(book.genres)
          ? book.genres
          : [book.genre || "Unknown"],
        pageCount: typeof book.pageCount === "number" ? book.pageCount : 0,
        imageUrl:
          book.imageUrl || book.coverImage || "/images/default-book-cover.jpg",
        buyLinks: book.buyLinks || {},
        readLinks: book.readLinks || {},
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error parsing recommendations:", error);
      return this.fallbackRecommendations();
    }
  }

  /**
   * Generate a unique ID for a book based on its title and author
   */
  private static generateBookId(book: Partial<BookRecommendation>): string {
    const titleStr = (book.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const authorStr = (book.author || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return `${titleStr}-${authorStr}-${miscUtils.generateRandomId(6)}`;
  }

  /**
   * Save search query and results to Firestore
   */
  private static async saveSearchHistory(
    searchQuery: SearchQuery,
    recommendations: BookRecommendation[],
    userId?: string,
  ): Promise<void> {
    if (!userId) return; // Don't save for non-authenticated users

    try {
      // Add to user's search history
      const historyRef = collection(
        firestore,
        "users",
        userId,
        "searchHistory",
      );
      await addDoc(historyRef, {
        query: searchQuery.text,
        options: {
          genre: searchQuery.genre,
          length: searchQuery.length,
          mood: searchQuery.mood,
          timeFrame: searchQuery.timeFrame,
        },
        recommendations: recommendations.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          imageUrl: book.imageUrl,
        })),
        timestamp: serverTimestamp(),
      });

      // Also save recommendations to books collection for future reference
      for (const book of recommendations) {
        const bookRef = doc(firestore, "books", book.id);
        const bookDoc = await getDoc(bookRef);

        if (!bookDoc.exists()) {
          // Only save books that don't already exist
          await setDoc(bookRef, {
            ...book,
            createdAt: serverTimestamp(),
            source: "openai",
            searchQueries: [searchQuery.text],
          });
        } else {
          // Update searchQueries array for existing books
          await updateDoc(bookRef, {
            searchQueries: arrayUnion(searchQuery.text),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error("Error saving search history:", error);
      // Non-critical error, continue execution
    }
  }

  /**
   * Provide fallback recommendations if parsing fails
   */
  private static fallbackRecommendations(): BookRecommendation[] {
    return [
      {
        id: "fallback-1",
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        publicationDate: "1960",
        rating: 4.8,
        reviewCount: 10345,
        description:
          "A classic of American literature that deals with serious issues of racial inequality and moral growth during the Great Depression in Alabama.",
        genres: ["Fiction", "Historical Fiction", "Classic"],
        pageCount: 324,
        imageUrl:
          "https://m.media-amazon.com/images/I/71FxgtFKcQL._AC_UF1000,1000_QL80_.jpg",
        buyLinks: {
          amazon:
            "https://www.amazon.com/Kill-Mockingbird-Harper-Lee/dp/0060935464",
          barnesNoble:
            "https://www.barnesandnoble.com/w/to-kill-a-mockingbird-harper-lee/1100151011",
        },
        readLinks: {
          goodreads:
            "https://www.goodreads.com/book/show/2657.To_Kill_a_Mockingbird",
        },
        timestamp: new Date().toISOString(),
      },
      {
        id: "fallback-2",
        title: "1984",
        author: "George Orwell",
        publicationDate: "1949",
        rating: 4.6,
        reviewCount: 8976,
        description:
          "A dystopian novel set in a totalitarian society where government surveillance and propaganda are pervasive.",
        genres: ["Fiction", "Science Fiction", "Dystopian"],
        pageCount: 328,
        imageUrl:
          "https://m.media-amazon.com/images/I/71mUkWzBgyL._AC_UF1000,1000_QL80_.jpg",
        buyLinks: {
          amazon:
            "https://www.amazon.com/1984-Signet-Classics-George-Orwell/dp/0451524934",
          barnesNoble:
            "https://www.barnesandnoble.com/w/1984-george-orwell/1100009100",
        },
        readLinks: {
          goodreads: "https://www.goodreads.com/book/show/5470.1984",
        },
        timestamp: new Date().toISOString(),
      },
    ];
  }
}
