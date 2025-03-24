import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "./store";
import { SearchOptions } from "./bookSlice";

export interface SearchHistoryItem {
  id: string;
  query: string;
  options: SearchOptions;
  timestamp: number;
}

export interface ConversationItem {
  id: string;
  type: "query" | "result";
  content: string;
  options?: SearchOptions;
  timestamp: number;
}

interface SearchState {
  query: string;
  options: SearchOptions;
  history: SearchHistoryItem[];
  conversation: ConversationItem[];
  historyIndex: number;
  loading: boolean;
  error: string | null;
  exportFormat: "json" | "txt" | "pdf";
}

const initialState: SearchState = {
  query: "",
  options: {},
  history: [],
  conversation: [],
  historyIndex: -1,
  loading: false,
  error: null,
  exportFormat: "json",
};

const generateId = () => Math.random().toString(36).substring(2, 11);

const saveConversationToLocalStorage = (conversation: ConversationItem[]) => {
  try {
    localStorage.setItem(
      "bookRecommenderConversation",
      JSON.stringify(conversation),
    );
  } catch {}
};

export const exportConversation = createAsyncThunk(
  "search/export",
  async (format: "json" | "txt" | "pdf", { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const conversation = state.search.conversation;
      if (conversation.length === 0) {
        throw new Error("No conversation to export");
      }
      let content = "";
      let filename = `book-recommendations-${new Date().toISOString().split("T")[0]}`;
      switch (format) {
        case "json":
          content = JSON.stringify(conversation, null, 2);
          filename += ".json";
          break;
        case "txt":
          content = conversation
            .map((item) => {
              return `[${new Date(item.timestamp).toLocaleString()}] ${item.type === "query" ? "You" : "BookRecommender"}: ${item.content}`;
            })
            .join("\n\n");
          filename += ".txt";
          break;
        case "pdf":
          // This would typically be handled by a library like jsPDF
          // For simplicity, we'll just return a flag for the component to handle
          return { format, conversation, filename: filename + ".pdf" };
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      // For non-PDF formats, create and trigger download
      const blob = new Blob([content], {
        type: format === "json" ? "application/json" : "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Clean up
      URL.revokeObjectURL(url);
      return { success: true, format };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const shareConversation = createAsyncThunk(
  "search/share",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const conversation = state.search.conversation;
      if (conversation.length === 0) {
        throw new Error("No conversation to share");
      }
      const title = "Book Recommendations";
      const text = "Check out these book recommendations!";
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
        return { success: true, method: "navigator.share" };
      }
      // Fallback to clipboard
      const shareText = `${title}\n\n${conversation
        .map((item) => {
          return `${item.type === "query" ? "Q" : "A"}: ${item.content}`;
        })
        .join("\n\n")}\n\nGenerated via: ${url}`;
      await navigator.clipboard.writeText(shareText);
      return { success: true, method: "clipboard" };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setOptions: (state, action: PayloadAction<SearchOptions>) => {
      state.options = { ...state.options, ...action.payload };
    },
    addToHistory: (
      state,
      action: PayloadAction<{ query: string; options: SearchOptions }>,
    ) => {
      const { query, options } = action.payload;
      const id = generateId();
      const timestamp = Date.now();
      state.history.push({
        id,
        query,
        options,
        timestamp,
      });
      state.conversation.push({
        id,
        type: "query",
        content: query,
        options,
        timestamp,
      });
      state.historyIndex = state.history.length - 1;
      // Save for guest users
      saveConversationToLocalStorage(state.conversation);
    },
    addResultToConversation: (state, action: PayloadAction<string>) => {
      const content = action.payload;
      const id = generateId();
      const timestamp = Date.now();
      state.conversation.push({
        id,
        type: "result",
        content,
        timestamp,
      });
      // Save for guest users
      saveConversationToLocalStorage(state.conversation);
    },
    clearHistory: (state) => {
      state.history = [];
      state.conversation = [];
      state.historyIndex = -1;
      localStorage.removeItem("bookRecommenderConversation");
    },
    navigateHistory: (state, action: PayloadAction<"forward" | "backward">) => {
      if (state.history.length === 0) return;
      if (action.payload === "backward") {
        state.historyIndex = Math.max(0, state.historyIndex - 1);
      } else {
        state.historyIndex = Math.min(
          state.history.length - 1,
          state.historyIndex + 1,
        );
      }
      // Set current query and options to the selected history item
      const item = state.history[state.historyIndex];
      state.query = item.query;
      state.options = item.options;
    },
    setExportFormat: (state, action: PayloadAction<"json" | "txt" | "pdf">) => {
      state.exportFormat = action.payload;
    },
    restoreConversation: (state) => {
      try {
        const storedConversation = localStorage.getItem(
          "bookRecommenderConversation",
        );
        if (storedConversation) {
          state.conversation = JSON.parse(storedConversation);
          // Rebuild history from conversation
          state.history = state.conversation
            .filter((item) => item.type === "query")
            .map((item) => ({
              id: item.id,
              query: item.content,
              options: item.options || {},
              timestamp: item.timestamp,
            }));

          state.historyIndex = state.history.length - 1;
        }
      } catch {}
    },
    resetSearchState: (state) => {
      state.query = "";
      state.options = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(exportConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportConversation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(shareConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shareConversation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(shareConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setQuery,
  setOptions,
  addToHistory,
  addResultToConversation,
  clearHistory,
  navigateHistory,
  setExportFormat,
  restoreConversation,
  resetSearchState,
} = searchSlice.actions;

export const selectQuery = (state: RootState) => state.search.query;
export const selectOptions = (state: RootState) => state.search.options;
export const selectHistory = (state: RootState) => state.search.history;
export const selectConversation = (state: RootState) =>
  state.search.conversation;
export const selectHistoryIndex = (state: RootState) =>
  state.search.historyIndex;
export const selectExportFormat = (state: RootState) =>
  state.search.exportFormat;
export const selectCurrentHistoryItem = (state: RootState) => {
  const { historyIndex, history } = state.search;
  return historyIndex >= 0 && history.length > 0 ? history[historyIndex] : null;
};

export default searchSlice.reducer;
