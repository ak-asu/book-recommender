import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "./store";

import { Message, MessageType } from "@/types/chat";
import { miscUtils } from "@/lib/utils";
import { ACTION_TYPES } from "@/lib/constants";
import * as conversationService from "@/services/conversationService";

interface ChatState {
  messages: Message[];
  activeSession: string | null;
  sessions: {
    id: string;
    title: string;
    lastActive: number;
    messageCount: number;
  }[];
  loading: boolean;
  error: string | null;
  isTyping: boolean;
}

const initialState: ChatState = {
  messages: [],
  activeSession: null,
  sessions: [],
  loading: false,
  error: null,
  isTyping: false,
};

export const sendMessage = createAsyncThunk(
  ACTION_TYPES.CHAT.SEND_MESSAGE,
  async (
    {
      content,
      sessionId,
      options,
    }: { content: string; sessionId?: string; options?: Record<string, any> },
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      const chatSessionId = sessionId || miscUtils.generateRandomId();
      const userMessage: Message = {
        id: miscUtils.generateRandomId(),
        type: MessageType.QUERY,
        content,
        timestamp: Date.now(),
        sender: "user",
        metadata: {
          queryOptions: options,
        },
      };
      dispatch(addMessage(userMessage));
      dispatch(setTyping(true));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          sessionId: chatSessionId,
          userId,
          options,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      const data = await response.json();
      const systemMessage: Message = {
        id: miscUtils.generateRandomId(),
        type: MessageType.RESPONSE,
        content: data.response,
        timestamp: Date.now(),
        sender: "system",
        metadata: {
          books: data.books,
        },
      };
      const messages = [userMessage, systemMessage];
      await conversationService.saveChatMessages(
        chatSessionId,
        messages,
        userId,
      );
      return {
        sessionId: chatSessionId,
        messages,
      };
    } catch (error) {
      const errorMessage: Message = {
        id: miscUtils.generateRandomId(),
        type: MessageType.ERROR,
        content: (error as Error).message || "Something went wrong",
        timestamp: Date.now(),
        sender: "system",
      };
      dispatch(addMessage(errorMessage));
      return rejectWithValue((error as Error).message);
    } finally {
      dispatch(setTyping(false));
    }
  },
);

export const regenerateResponse = createAsyncThunk(
  ACTION_TYPES.CHAT.REGENERATE_RESPONSE,
  async (
    { sessionId }: { sessionId: string },
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      const messages = state.chat.messages;
      if (messages.length === 0) {
        throw new Error("No messages to regenerate");
      }
      const lastQueryIndex = [...messages]
        .reverse()
        .findIndex((m) => m.type === MessageType.QUERY);
      if (lastQueryIndex === -1) {
        throw new Error("No query to regenerate response for");
      }
      const lastQueryMessage = messages[messages.length - 1 - lastQueryIndex];
      dispatch(setTyping(true));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: lastQueryMessage.content,
          sessionId,
          userId,
          options: lastQueryMessage.metadata?.queryOptions,
          regenerate: true,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to regenerate response");
      }
      const data = await response.json();
      const systemMessage: Message = {
        id: miscUtils.generateRandomId(),
        type: MessageType.RESPONSE,
        content: data.response,
        timestamp: Date.now(),
        sender: "system",
        metadata: {
          books: data.books,
          regenerate: true,
        },
      };
      const updatedMessages = [...messages, systemMessage];
      await conversationService.saveChatMessages(
        sessionId,
        updatedMessages,
        userId,
      );
      return systemMessage;
    } catch (error) {
      const errorMessage: Message = {
        id: miscUtils.generateRandomId(),
        type: MessageType.ERROR,
        content: (error as Error).message || "Something went wrong",
        timestamp: Date.now(),
        sender: "system",
      };
      dispatch(addMessage(errorMessage));
      return rejectWithValue((error as Error).message);
    } finally {
      dispatch(setTyping(false));
    }
  },
);

export const loadChatSessions = createAsyncThunk(
  ACTION_TYPES.CHAT.LOAD_SESSIONS,
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      return await conversationService.getChatSessions(userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loadChatMessages = createAsyncThunk(
  ACTION_TYPES.CHAT.LOAD_MESSAGES,
  async (sessionId: string, { getState, rejectWithValue }) => {
    try {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      const messages = await conversationService.getChatMessages(
        sessionId,
        userId,
      );
      return { sessionId, messages };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const exportChatConversation = createAsyncThunk(
  ACTION_TYPES.CHAT.EXPORT,
  async (format: "json" | "txt" | "pdf", { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const messages = state.chat.messages;
      if (messages.length === 0) {
        throw new Error("No conversation to export");
      }
      return await conversationService.exportConversation(
        messages,
        format,
        true,
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const shareChatConversation = createAsyncThunk(
  ACTION_TYPES.CHAT.SHARE,
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const messages = state.chat.messages;
      if (messages.length === 0) {
        throw new Error("No conversation to share");
      }
      return await conversationService.shareConversation(messages, true);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setActiveSession: (state, action: PayloadAction<string | null>) => {
      state.activeSession = action.payload;
    },
    createNewSession: (state) => {
      state.activeSession = null;
      state.messages = [];
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload.sessionId;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(regenerateResponse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(regenerateResponse.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(regenerateResponse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loadChatSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadChatSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(loadChatSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loadChatMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadChatMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload.sessionId;
        state.messages = action.payload.messages;
      })
      .addCase(loadChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(exportChatConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportChatConversation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportChatConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(shareChatConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shareChatConversation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(shareChatConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addMessage,
  clearMessages,
  setActiveSession,
  createNewSession,
  setTyping,
} = chatSlice.actions;

export const selectMessages = (state: RootState) => state.chat.messages;
export const selectActiveSession = (state: RootState) =>
  state.chat.activeSession;
export const selectSessions = (state: RootState) => state.chat.sessions;
export const selectLoading = (state: RootState) => state.chat.loading;
export const selectError = (state: RootState) => state.chat.error;
export const selectIsTyping = (state: RootState) => state.chat.isTyping;

export default chatSlice.reducer;
