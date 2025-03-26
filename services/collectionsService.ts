import { collectionsApi } from "./apiService";
import { withErrorHandling } from "./errorService";
import * as storageService from "./storageService";

import { ErrorCategory } from "@/lib/errorHandler";
import { Book } from "@/types/book";

export interface CollectionItem {
  id: string;
  bookId: string;
  book: Book;
  createdAt: Date | number;
}

// Get user collections (bookmarks, favorites, etc.)
export const getUserCollection = withErrorHandling(
  async (collectionType: string): Promise<CollectionItem[]> => {
    const token = storageService.getUserAuth();
    // For guest users, use local storage
    if (!token) {
      if (collectionType === "bookmarks") {
        return storageService.getGuestBookmarks();
      }
      return [];
    }
    return await collectionsApi.getCollection(collectionType);
  },
  ErrorCategory.USER,
);

export const addToCollection = withErrorHandling(
  async (
    bookId: string,
    collectionType: string,
    bookData?: Book,
  ): Promise<void> => {
    const token = storageService.getUserAuth();
    if (!token) {
      if (collectionType === "bookmarks" && bookData) {
        const bookmarks = storageService.getGuestBookmarks();
        const exists = bookmarks.find((item) => item.bookId === bookId);
        if (!exists) {
          const newItem: CollectionItem = {
            id: `guest-${Date.now()}`,
            bookId,
            book: bookData,
            createdAt: Date.now(),
          };
          storageService.saveGuestBookmarks([...bookmarks, newItem]);
        }
      }
      return;
    }
    await collectionsApi.addToCollection(bookId, collectionType);
  },
  ErrorCategory.USER,
);

export const removeFromCollection = withErrorHandling(
  async (bookId: string, collectionType: string): Promise<void> => {
    const token = storageService.getUserAuth();
    if (!token) {
      if (collectionType === "bookmarks") {
        const bookmarks = storageService.getGuestBookmarks();
        const updatedBookmarks = bookmarks.filter(
          (item) => item.bookId !== bookId,
        );
        storageService.saveGuestBookmarks(updatedBookmarks);
      }
      return;
    }
    await collectionsApi.removeFromCollection(bookId, collectionType);
  },
  ErrorCategory.USER,
);

export const isInCollection = withErrorHandling(
  async (bookId: string, collectionType: string): Promise<boolean> => {
    const token = storageService.getUserAuth();
    if (!token) {
      if (collectionType === "bookmarks") {
        const bookmarks = storageService.getGuestBookmarks();
        return bookmarks.some((item) => item.bookId === bookId);
      }
      return false;
    }
    const collection = await collectionsApi.getCollection(collectionType);
    return collection.some((item: CollectionItem) => item.bookId === bookId);
  },
  ErrorCategory.USER,
);
