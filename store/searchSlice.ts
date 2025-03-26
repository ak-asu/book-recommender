import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "./store";

import { SearchHistoryItem, ConversationItem } from "@/types/search";
import { SearchOptions } from "@/types/search";
import { miscUtils } from "@/lib/utils";
import { ACTION_TYPES, MESSAGE_TYPES } from "@/lib/constants";
import * as conversationService from "@/services/conversationService";

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

export const exportConversation = createAsyncThunk(
  ACTION_TYPES.SEARCH.EXPORT,
  async (format: "json" | "txt" | "pdf", { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const conversation = state.search.conversation;
      if (conversation.length === 0) {
        throw new Error("No conversation to export");
      }
      return await conversationService.exportConversation(
        conversation,
        format,
        false,
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const shareConversation = createAsyncThunk(
  ACTION_TYPES.SEARCH.SHARE,
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const conversation = state.search.conversation;
      if (conversation.length === 0) {
        throw new Error("No conversation to share");
      }
      return await conversationService.shareConversation(conversation, false);
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
      const id = miscUtils.generateRandomId();
      const timestamp = Date.now();
      state.history.push({
        id,
        query,
        options,
        timestamp,
      });
      state.conversation.push({
        id,
        type: MESSAGE_TYPES.QUERY,
        content: query,
        options,
        timestamp,
      });
      state.historyIndex = state.history.length - 1;
      // Save for guest users
      conversationService.saveSearchConversation(state.conversation);
    },
    addResultToConversation: (state, action: PayloadAction<string>) => {
      const content = action.payload;
      const id = miscUtils.generateRandomId();
      const timestamp = Date.now();
      state.conversation.push({
        id,
        type: MESSAGE_TYPES.RESULT,
        content,
        timestamp,
      });
      // Save for guest users
      conversationService.saveSearchConversation(state.conversation);
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
        const storedConversation = conversationService.getSearchConversation();
        if (storedConversation.length > 0) {
          state.conversation = storedConversation;
          // Rebuild history from conversation
          state.history = state.conversation
            .filter((item) => item.type === MESSAGE_TYPES.QUERY)
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
