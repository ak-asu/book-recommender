import { api } from "./api";

export const bookmarkService = {
  getBookmarks: async () => {
    return api.get("/bookmarks");
  },

  addBookmark: async (bookId: string) => {
    return api.post("/bookmarks", { bookId });
  },

  removeBookmark: async (bookId: string) => {
    return api.delete(`/bookmarks/${bookId}`);
  },

  getFavorites: async () => {
    return api.get("/favorites");
  },

  addFavorite: async (bookId: string) => {
    return api.post("/favorites", { bookId });
  },

  removeFavorite: async (bookId: string) => {
    return api.delete(`/favorites/${bookId}`);
  },

  getSavedForLater: async () => {
    return api.get("/saved");
  },

  addSavedForLater: async (bookId: string) => {
    return api.post("/saved", { bookId });
  },

  removeSavedForLater: async (bookId: string) => {
    return api.delete(`/saved/${bookId}`);
  },
};
