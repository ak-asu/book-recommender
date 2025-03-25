import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
} from "firebase/firestore";

import { RootState } from "./store";

import { Message, MessageType } from "@/types/chat";
import { firestore } from "@/lib/firebase";
import { miscUtils } from "@/lib/utils";

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

const saveMessagesToLocalStorage = (sessionId: string, messages: Message[]) => {
  try {
    localStorage.setItem(
      `bookRecommenderChat_${sessionId}`,
      JSON.stringify(messages),
    );
    const sessions = JSON.parse(
      localStorage.getItem("bookRecommenderSessions") || "[]",
    );
    const sessionIndex = sessions.findIndex((s: any) => s.id === sessionId);
    const sessionInfo = {
      id: sessionId,
      title:
        messages.length > 0 && messages[0].type === MessageType.QUERY
          ? messages[0].content.substring(0, 30) +
            (messages[0].content.length > 30 ? "..." : "")
          : "New Chat",
      lastActive: Date.now(),
      messageCount: messages.length,
    };
    if (sessionIndex >= 0) {
      sessions[sessionIndex] = sessionInfo;
    } else {
      sessions.push(sessionInfo);
    }
    localStorage.setItem("bookRecommenderSessions", JSON.stringify(sessions));
  } catch {}
};

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
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
      if (userId) {
        const messagesRef = collection(
          firestore,
          "users",
          userId,
          "chatSessions",
          chatSessionId,
          "messages",
        );
        await Promise.all([
          addDoc(messagesRef, {
            ...userMessage,
            timestamp: new Date(userMessage.timestamp),
          }),
          addDoc(messagesRef, {
            ...systemMessage,
            timestamp: new Date(systemMessage.timestamp),
          }),
        ]);
      } else {
        const existingMessages = JSON.parse(
          localStorage.getItem(`bookRecommenderChat_${chatSessionId}`) || "[]",
        );
        saveMessagesToLocalStorage(chatSessionId, [
          ...existingMessages,
          userMessage,
          systemMessage,
        ]);
      }
      return {
        sessionId: chatSessionId,
        messages: [userMessage, systemMessage],
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
  "chat/regenerateResponse",
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
      if (userId) {
        const messagesRef = collection(
          firestore,
          "users",
          userId,
          "chatSessions",
          sessionId,
          "messages",
        );
        await addDoc(messagesRef, {
          ...systemMessage,
          timestamp: new Date(systemMessage.timestamp),
        });
      } else {
        const existingMessages = JSON.parse(
          localStorage.getItem(`bookRecommenderChat_${sessionId}`) || "[]",
        );
        saveMessagesToLocalStorage(sessionId, [
          ...existingMessages,
          systemMessage,
        ]);
      }
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
  "chat/loadSessions",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      if (userId) {
        const sessionsRef = collection(
          firestore,
          "users",
          userId,
          "chatSessions",
        );
        const q = query(sessionsRef, orderBy("lastActive", "desc"));
        const querySnapshot = await getDocs(q);
        const sessions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          lastActive: doc.data().lastActive.toDate().getTime(),
        }));
        return sessions;
      } else {
        const sessionsString = localStorage.getItem("bookRecommenderSessions");
        if (!sessionsString) return [];
        return JSON.parse(sessionsString);
      }
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loadChatMessages = createAsyncThunk(
  "chat/loadMessages",
  async (sessionId: string, { getState, rejectWithValue }) => {
    try {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }
      const state = getState() as RootState;
      const userId = state.user?.user?.uid;
      if (userId) {
        const messagesRef = collection(
          firestore,
          "users",
          userId,
          "chatSessions",
          sessionId,
          "messages",
        );
        const q = query(messagesRef, orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().getTime(),
        })) as Message[];
        return { sessionId, messages };
      } else {
        const messagesString = localStorage.getItem(
          `bookRecommenderChat_${sessionId}`,
        );
        if (!messagesString) return { sessionId, messages: [] };
        return {
          sessionId,
          messages: JSON.parse(messagesString) as Message[],
        };
      }
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
