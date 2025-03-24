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

  protected parseBookRecommendations(content: string): RecommendationResponse {
    try {
      const jsonMatch = content.match(/```json([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }
      return JSON.parse(content);
    } catch {
      // Fallback parsing with regex for book entries
      const books: BookRecommendation[] = [];
      const titleMatches = content.matchAll(/Title: (.*?)(?:\n|$)/g);
      const authorMatches = content.matchAll(/Author: (.*?)(?:\n|$)/g);
      const descriptionMatches = content.matchAll(
        /Description: ([\s\S]*?)(?:\n\n|$)/g,
      );
      const titles = Array.from(titleMatches).map((match) => match[1].trim());
      const authors = Array.from(authorMatches).map((match) => match[1].trim());
      const descriptions = Array.from(descriptionMatches).map((match) =>
        match[1].trim(),
      );
      for (
        let i = 0;
        i < Math.min(titles.length, authors.length, descriptions.length);
        i++
      ) {
        books.push({
          title: titles[i],
          author: authors[i],
          description: descriptions[i],
          image: `/images/placeholder-book.png`,
          rating: 4.0,
          id: `placeholder-${i}`,
        });
      }
      return { books };
    }
  }
}
