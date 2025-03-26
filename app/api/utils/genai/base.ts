import { BookRecommendation, Book } from "@/types/book";

export interface AIProviderOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface RecommendationResponse {
  recommendations: Book[];
  raw?: any; // The raw response from the API
}

export interface AIChatMessage {
  content: string;
  role: "user" | "assistant" | "system";
}

export interface ChatSession {
  id: string;
  messages: AIChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export abstract class AIProvider {
  protected options: AIProviderOptions;

  constructor(options: AIProviderOptions = {}) {
    this.options = {
      temperature: 0.7,
      maxTokens: 2048,
      ...options,
    };
  }

  abstract getRecommendations(prompt: string): Promise<RecommendationResponse>;

  protected formatPrompt(prompt: string): string {
    return `${prompt}\n\nPlease provide recommendations in valid JSON format with the following properties for each book: title, author, publicationDate, description, genres (array), rating (number), reviewCount (number), pageCount (number), and imageUrl.`;
  }

  protected parseBookRecommendations(content: string): RecommendationResponse {
    try {
      let jsonContent = content;
      // If the content is a string that might contain JSON
      if (
        typeof content === "string" &&
        !content.trim().startsWith("{") &&
        !content.trim().startsWith("[")
      ) {
        const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
      }
      const parsedData =
        typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;
      // Handle different response formats
      let recommendations: BookRecommendation[] = [];
      if (Array.isArray(parsedData)) {
        recommendations = parsedData;
      } else if (parsedData.books && Array.isArray(parsedData.books)) {
        recommendations = parsedData.books;
      } else if (
        parsedData.recommendations &&
        Array.isArray(parsedData.recommendations)
      ) {
        recommendations = parsedData.recommendations;
      } else if (parsedData.data && Array.isArray(parsedData.data)) {
        recommendations = parsedData.data;
      } else {
        recommendations = [parsedData]; // If it's a single book object
      }
      const normalizedRecommendations = recommendations.map((book: any) => {
        const id =
          book.id ||
          `book-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          id,
          title: book.title || "Unknown Title",
          author: book.author || "Unknown Author",
          publicationDate: book.publicationDate || "Unknown",
          description: book.description || "No description available",
          genres: Array.isArray(book.genres)
            ? book.genres
            : book.genre && typeof book.genre !== "undefined"
              ? [book.genre]
              : [],
          rating: typeof book.rating === "number" ? book.rating : 0,
          reviewCount:
            typeof book.reviewCount === "number" ? book.reviewCount : 0,
          pageCount: typeof book.pageCount === "number" ? book.pageCount : 0,
          imageUrl:
            book.imageUrl ||
            (book.image && typeof book.image !== "undefined"
              ? book.image
              : "/images/default-book-cover.jpg"),
          buyLinks: book.buyLinks || {},
          readLinks: book.readLinks || {},
          timestamp: new Date().toISOString(),
        };
      });
      return {
        recommendations: normalizedRecommendations,
        raw: parsedData,
      };
    } catch {
      return { recommendations: [], raw: content };
    }
  }
}
