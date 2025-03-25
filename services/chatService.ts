import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  arrayUnion,
} from "firebase/firestore";

import { firestore } from "@/lib/firebase";
import { BookRecommendation } from "@/types/book";
import { UserPreferences } from "@/types/user";
import {
  API,
  AI_PROMPTS,
  FIREBASE_COLLECTIONS,
  MESSAGES,
} from "@/lib/constants";
import { aiUtils } from "@/lib/utils";
import { SearchQuery } from "@/types/search";

export const getBookRecommendations = async (
  searchQuery: SearchQuery,
  userPreferences?: UserPreferences,
  userId?: string,
): Promise<BookRecommendation[]> => {
  try {
    const prompt = aiUtils.buildPrompt(searchQuery, userPreferences);
    const response = await openai.createChatCompletion({
      model: API.OPENAI.MODEL,
      messages: [
        {
          role: "system",
          content: AI_PROMPTS.SYSTEM_ROLE,
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
    const recommendations = aiUtils.parseRecommendations(
      response.data.choices[0]?.message?.content || "",
    );
    await saveSearchHistory(searchQuery, recommendations, userId);
    return recommendations;
  } catch {
    throw new Error(MESSAGES.ERRORS.RECOMMENDATIONS.FAILED);
  }
};

export const saveSearchHistory = async (
  searchQuery: SearchQuery,
  recommendations: BookRecommendation[],
  userId?: string,
): Promise<void> => {
  if (!userId) return; // Don't save for non-authenticated users
  try {
    const historyRef = collection(
      firestore,
      FIREBASE_COLLECTIONS.USERS,
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
    for (const book of recommendations) {
      const bookRef = doc(firestore, FIREBASE_COLLECTIONS.BOOKS, book.id);
      const bookDoc = await getDoc(bookRef);
      if (!bookDoc.exists()) {
        await setDoc(bookRef, {
          ...book,
          createdAt: serverTimestamp(),
          source: "openai",
          searchQueries: [searchQuery.text],
        });
      } else {
        await updateDoc(bookRef, {
          searchQueries: arrayUnion(searchQuery.text),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch {}
};

export const fallbackRecommendations = (): BookRecommendation[] => {
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
};
