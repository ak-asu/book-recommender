import { api } from "./api";

import { SearchFilters } from "@/types";

export const bookService = {
  searchBooks: async (query: string, filters?: SearchFilters) => {
    // Create an object with all parameters
    const params: Record<string, string> = { query };

    // Add filters to params if they exist
    if (filters) {
      if (filters.genre) params.genre = filters.genre;
      if (filters.rating) params.rating = filters.rating.toString();
      if (filters.sortBy) params.sortBy = filters.sortBy;
    }

    const queryString = new URLSearchParams(params).toString();
    return api.get(`/books/search?${queryString}`);
  },

  getBookById: async (id: string) => {
    return api.get(`/books/${id}`);
  },

  getSimilarBooks: async (id: string) => {
    return api.get(`/books/${id}/similar`);
  },

  getPopularBooks: async () => {
    return api.get("/books/popular");
  },
};
