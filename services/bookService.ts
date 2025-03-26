import { bookApi } from "./apiService";

import { Book, PaginatedResult, BookQuery } from "@/types/book";
import { SEARCH } from "@/lib/constants";
import { ErrorCategory } from "@/lib/errorHandler";
import { withErrorHandling } from "@/services/errorService";

export const getBookById = withErrorHandling(
  async (id: string): Promise<Book> => {
    return await bookApi.getBookById(id);
  },
  ErrorCategory.BOOK,
);

export const searchBooks = withErrorHandling(
  async (bookQuery: BookQuery = {}): Promise<PaginatedResult<Book>> => {
    return await bookApi.searchBooks(bookQuery);
  },
  ErrorCategory.BOOK,
);

export const getSimilarBooks = withErrorHandling(
  async (bookId: string): Promise<Book[]> => {
    return await bookApi.getSimilarBooks(bookId);
  },
  ErrorCategory.BOOK,
);

export const getBookReviews = withErrorHandling(
  async (bookId: string): Promise<any[]> => {
    return await bookApi.getBookReviews(bookId);
  },
  ErrorCategory.BOOK,
);

export const getPopularBooks = withErrorHandling(
  async (
    limit = SEARCH.POPULAR_BOOKS_LIMIT,
  ): Promise<PaginatedResult<Book>> => {
    const books = await bookApi.getPopularBooks(limit);
    return {
      data: books,
      lastDoc: null,
      hasMore: books.length === limit,
    };
  },
  ErrorCategory.BOOK,
);
