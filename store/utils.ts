import { createAsyncThunk } from "@reduxjs/toolkit";

import { RootState } from "./store";

import { ACTION_TYPES } from "@/lib/constants";
import { ConversationItem } from "@/types/search";
import { Message } from "@/types/chat";
import * as conversationService from "@/services/conversationService";
import { handleRejection } from "@/services/errorService";
import { ErrorCategory } from "@/lib/errorHandler";

export const createExportThunk = (sliceName: "search" | "chat") =>
  createAsyncThunk(
    sliceName === "search"
      ? ACTION_TYPES.SEARCH.EXPORT
      : ACTION_TYPES.CHAT.EXPORT,
    async (format: "json" | "txt" | "pdf", { getState, rejectWithValue }) => {
      try {
        const state = getState() as RootState;
        const items =
          sliceName === "search"
            ? state.search.conversation
            : state.chat.messages;
        if (items.length === 0) {
          throw new Error(`No ${sliceName} content to export`);
        }
        return await conversationService.exportConversation(
          items,
          format,
          sliceName === "chat",
        );
      } catch (error) {
        return rejectWithValue(handleRejection(error, ErrorCategory.DATA));
      }
    },
  );

export const createShareThunk = (sliceName: "search" | "chat") =>
  createAsyncThunk(
    sliceName === "search"
      ? ACTION_TYPES.SEARCH.SHARE
      : ACTION_TYPES.CHAT.SHARE,
    async (_, { getState, rejectWithValue }) => {
      try {
        const state = getState() as RootState;
        const items =
          sliceName === "search"
            ? state.search.conversation
            : state.chat.messages;
        if (items.length === 0) {
          throw new Error(`No ${sliceName} content to share`);
        }
        return await conversationService.shareConversation(
          items,
          sliceName === "chat",
        );
      } catch (error) {
        return rejectWithValue(handleRejection(error, ErrorCategory.DATA));
      }
    },
  );

export const convertSearchToChatMessages = (
  items: ConversationItem[],
): Message[] => {
  return conversationService.convertSearchToChatMessages(items);
};

export const convertChatToSearchMessages = (
  items: Message[],
): ConversationItem[] => {
  return conversationService.convertChatToSearchMessages(items);
};
