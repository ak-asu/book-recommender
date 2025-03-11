import OpenAI from "openai";

// Initialize OpenAI client with API key from environment variables
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // Only set to true when using in API routes
});

// Helper function to extract book data from OpenAI response
export const parseBookRecommendations = (content: string) => {
  try {
    // Try to parse as JSON first
    const jsonMatch = content.match(/```json([\s\S]*?)```/);

    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // If no JSON block found, try to parse the entire response
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error);

    // Fallback parsing with regex for book entries
    const books = [];
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
};
