import { api } from "./api";

import { SearchQuery } from "@/types";

export const historyService = {
  getSearchHistory: async () => {
    return api.get("/history");
  },

  addSearchQuery: async (query: SearchQuery) => {
    return api.post("/history", query);
  },

  clearHistory: async () => {
    return api.delete("/history");
  },

  removeHistoryItem: async (id: string) => {
    return api.delete(`/history/${id}`);
  },
};
