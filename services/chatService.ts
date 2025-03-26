import { recommendationApi, chatApi } from "./apiService";

import { BookRecommendation } from "@/types/book";
import { UserPreferences } from "@/types/user";
import { MESSAGES } from "@/lib/constants";
import { SearchQuery } from "@/types/search";
import { ErrorCategory, logError } from "@/lib/errorHandler";
import { withErrorHandling } from "@/services/errorService";

export const getBookRecommendations = withErrorHandling(
  async (
    searchQuery: SearchQuery,
    userPreferences?: UserPreferences,
  ): Promise<BookRecommendation[]> => {
    try {
      const response = await recommendationApi.searchBooks(searchQuery.text, {
        genre: searchQuery.genre,
        length: searchQuery.length,
        mood: searchQuery.mood,
        timeFrame: searchQuery.timeFrame,
        userPreferences,
      });
      if (!response.books) {
        throw new Error(MESSAGES.ERRORS.RECOMMENDATIONS.FAILED);
      }
      return response.books;
    } catch (error) {
      logError(error, "getBookRecommendations");
      return fallbackRecommendations();
    }
  },
  ErrorCategory.API,
);

export const getChatRecommendations = withErrorHandling(
  async (message: string, sessionId?: string, options?: any): Promise<any> => {
    return await chatApi.sendMessage(message, sessionId, options);
  },
  ErrorCategory.API,
);

export const getChatSessions = withErrorHandling(async () => {
  return await chatApi.getSessionList();
}, ErrorCategory.API);

export const getChatSessionDetails = withErrorHandling(
  async (sessionId: string) => {
    return await chatApi.getSession(sessionId);
  },
  ErrorCategory.API,
);

export const deleteChatSession = withErrorHandling(
  async (sessionId: string) => {
    return await chatApi.deleteSession(sessionId);
  },
  ErrorCategory.API,
);

export const exportChatSession = withErrorHandling(
  async (sessionId?: string, format: "json" | "text" = "json") => {
    return await chatApi.exportChat(sessionId, format);
  },
  ErrorCategory.API,
);

export const shareChatSession = withErrorHandling(async (sessionId: string) => {
  return await chatApi.shareChat(sessionId);
}, ErrorCategory.API);

export const getSharedChatSession = withErrorHandling(
  async (shareId: string) => {
    return await chatApi.getSharedChat(shareId);
  },
  ErrorCategory.API,
);

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
