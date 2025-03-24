import OpenAI from "openai";

// Define common interfaces for AI providers
export interface AIProviderOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface BookRecommendation {
  title: string;
  author: string;
  description: string;
  image?: string;
  rating?: number;
  id?: string;
  genres?: string[];
  publicationDate?: string;
  pageCount?: number;
}

export interface RecommendationResponse {
  books: BookRecommendation[];
}

// Abstract base class for AI providers
export abstract class AIProvider {
  protected options: AIProviderOptions;

  constructor(options: AIProviderOptions) {
    this.options = {
      temperature: 0.7,
      maxTokens: 1500,
      ...options,
    };
  }

  abstract getRecommendations(prompt: string): Promise<RecommendationResponse>;

  // Helper method to format a recommendation prompt
  protected formatPrompt(basePrompt: string): string {
    return `${basePrompt}
    
    Please respond with recommendations in this JSON format:
    {
      "books": [
        {
          "title": "Book Title",
          "author": "Author Name",
          "description": "A brief description of the book",
          "genres": ["Genre1", "Genre2"],
          "rating": 4.5
        }
      ]
    }`;
  }

  // Common parsing logic that can be used by all providers
  protected parseBookRecommendations(content: string): RecommendationResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/```json([\s\S]*?)```/);

      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // If no JSON block found, try to parse the entire response
      return JSON.parse(content);
    } catch (error) {
      console.error("Failed to parse AI response:", error);

      // Fallback parsing with regex for book entries
      const books: BookRecommendation[] = [];
      const titleMatches = content.matchAll(/Title: (.*?)(?:\n|$)/g);
      const authorMatches = content.matchAll(/Author: (.*?)(?:\n|$)/g);
      const descriptionMatches = content.matchAll(
        /Description: ([\s\S]*?)(?:\n\n|$)/g,
      );

      // Convert iterator to array
      const titles = Array.from(titleMatches).map((match) => match[1].trim());
      const authors = Array.from(authorMatches).map((match) => match[1].trim());
      const descriptions = Array.from(descriptionMatches).map((match) =>
        match[1].trim(),
      );

      // Combine data into book objects
      for (
        let i = 0;
        i < Math.min(titles.length, authors.length, descriptions.length);
        i++
      ) {
        books.push({
          title: titles[i],
          author: authors[i],
          description: descriptions[i],
          // Generate placeholder values for required fields
          image: `/images/placeholder-book.png`,
          rating: 4.0,
          id: `placeholder-${i}`,
        });
      }

      return { books };
    }
  }
}

// OpenAI specific implementation
export class OpenAIProvider extends AIProvider {
  private client: OpenAI;

  constructor(options: AIProviderOptions) {
    super(options);
    this.client = new OpenAI({
      apiKey: options.apiKey || process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: false,
    });
  }

  async getRecommendations(prompt: string): Promise<RecommendationResponse> {
    try {
      const formattedPrompt = this.formatPrompt(prompt);

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a book recommendation assistant. Provide book recommendations based on the user's query and preferences.",
          },
          { role: "user", content: formattedPrompt },
        ],
        model: this.options.model || "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature,
      });

      const responseContent = completion.choices[0].message.content;

      if (!responseContent) {
        throw new Error("Empty response from OpenAI");
      }

      return this.parseBookRecommendations(responseContent);
    } catch (error) {
      console.error("OpenAI provider error:", error);
      throw new Error(
        `OpenAI recommendation failed: ${(error as Error).message}`,
      );
    }
  }
}

// Factory class to create the appropriate AI provider
export class AIProviderFactory {
  static getProvider(
    type: "openai" | "gemini" = "openai",
    options: AIProviderOptions = {},
  ): AIProvider {
    switch (type) {
      case "openai":
        return new OpenAIProvider(options);
      default:
        return new OpenAIProvider(options);
    }
  }
}
