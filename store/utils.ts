import { createAsyncThunk } from "@reduxjs/toolkit";

import { RootState } from "./store";

import { ACTION_TYPES } from "@/lib/constants";
import { exportUtils } from "@/lib/utils";
import { ConversationItem } from "@/types/search";
import { Message, MessageType } from "@/types/chat";

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
        const formatTextContent = (data: any[]): string => {
          return data
            .map((item) => {
              const timestamp = new Date(item.timestamp).toLocaleString();
              const sender =
                sliceName === "search"
                  ? item.type === "query"
                    ? "You"
                    : "BookRecommender"
                  : item.sender === "user"
                    ? "You"
                    : "BookRecommender";
              return `[${timestamp}] ${sender}: ${item.content}`;
            })
            .join("\n\n");
        };
        return await exportUtils.exportData(
          items,
          format,
          sliceName === "search" ? "book-recommendations" : "chat-session",
          formatTextContent,
        );
      } catch (error) {
        return rejectWithValue((error as Error).message);
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
        return await exportUtils.shareData(
          items,
          sliceName === "search" ? "Book Recommendations" : "Chat Session",
          `Check out these ${sliceName === "search" ? "book recommendations" : "chat messages"}!`,
        );
      } catch (error) {
        return rejectWithValue((error as Error).message);
      }
    },
  );

export const convertSearchToChatMessages = (
  items: ConversationItem[],
): Message[] => {
  return items.map((item) => ({
    id: item.id,
    type:
      item.type === "query"
        ? ("text" as MessageType)
        : ("bookRecommendation" as MessageType),
    content: item.content,
    timestamp: item.timestamp,
    sender: item.type === "query" ? "user" : "system",
    metadata: item.options ? { queryOptions: item.options } : undefined,
  }));
};

export const convertChatToSearchMessages = (
  items: Message[],
): ConversationItem[] => {
  return items.map((item) => ({
    id: item.id,
    type: item.type === "query" ? "query" : "result",
    content: item.content,
    timestamp: item.timestamp,
    options: item.metadata?.queryOptions,
  }));
};
