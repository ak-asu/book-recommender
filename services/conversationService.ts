import {
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";

import { firestore } from "@/lib/firebase";
import { ConversationItem } from "@/types/search";
import { Message, MessageType } from "@/types/chat";
import { storageUtils, exportUtils } from "@/lib/utils";

export const exportConversation = async (
  items: ConversationItem[] | Message[],
  format: "json" | "txt" | "pdf",
  isChat: boolean = false,
): Promise<{ success: boolean; format: string }> => {
  const formatTextContent = (data: any[]): string => {
    return data
      .map((item) => {
        const timestamp = new Date(item.timestamp).toLocaleString();
        const sender = isChat
          ? item.sender === "user"
            ? "You"
            : "BookRecommender"
          : item.type === "query"
            ? "You"
            : "BookRecommender";
        return `[${timestamp}] ${sender}: ${item.content}`;
      })
      .join("\n\n");
  };
  return await exportUtils.exportData(
    items,
    format,
    isChat ? "chat-session" : "book-recommendations",
    formatTextContent,
  );
};

export const shareConversation = async (
  items: ConversationItem[] | Message[],
  isChat: boolean = false,
): Promise<{ success: boolean; method: string }> => {
  return await exportUtils.shareData(
    items,
    isChat ? "Chat Session" : "Book Recommendations",
    `Check out these ${isChat ? "chat messages" : "book recommendations"}!`,
  );
};

export const saveSearchConversation = (
  conversation: ConversationItem[],
): void => {
  storageUtils.saveConversation(conversation);
};

export const getSearchConversation = (): ConversationItem[] => {
  return storageUtils.getConversation();
};

export const saveChatMessages = (
  sessionId: string,
  messages: Message[],
  userId?: string,
): Promise<void> => {
  if (userId) {
    return saveFirestoreChatMessages(userId, sessionId, messages);
  } else {
    // Save to localStorage for guest users
    storageUtils.saveChatMessages(sessionId, messages);
    return Promise.resolve();
  }
};

// Get chat messages for a session
export const getChatMessages = async (
  sessionId: string,
  userId?: string,
): Promise<Message[]> => {
  if (userId) {
    return getFirestoreChatMessages(userId, sessionId);
  } else {
    // Get from localStorage for guest users
    return storageUtils.getChatMessages(sessionId);
  }
};

// Chat session management
export const getChatSessions = async (
  userId?: string,
): Promise<
  {
    id: string;
    title: string;
    lastActive: number;
    messageCount: number;
  }[]
> => {
  if (userId) {
    const sessionsRef = collection(firestore, "users", userId, "chatSessions");
    const q = query(sessionsRef, orderBy("lastActive", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "Untitled",
        messageCount: data.messageCount || 0,
        lastActive: data.lastActive?.toDate().getTime() || Date.now(),
      };
    });
  } else {
    // Get from localStorage for guest users
    return storageUtils.getChatSessions();
  }
};

async function saveFirestoreChatMessages(
  userId: string,
  sessionId: string,
  messages: Message[],
): Promise<void> {
  const messagesRef = collection(
    firestore,
    "users",
    userId,
    "chatSessions",
    sessionId,
    "messages",
  );
  // Save the session info
  const sessionRef = doc(firestore, "users", userId, "chatSessions", sessionId);
  await setDoc(sessionRef, {
    title:
      messages.length > 0 && messages[0].type === MessageType.QUERY
        ? messages[0].content.substring(0, 30) +
          (messages[0].content.length > 30 ? "..." : "")
        : "New Chat",
    lastActive: serverTimestamp(),
    messageCount: messages.length,
  });
  for (const message of messages) {
    await addDoc(messagesRef, {
      ...message,
      timestamp: serverTimestamp(),
    });
  }
}

async function getFirestoreChatMessages(
  userId: string,
  sessionId: string,
): Promise<Message[]> {
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
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate().getTime(),
  })) as Message[];
}

export const convertSearchToChatMessages = (
  items: ConversationItem[],
): Message[] => {
  return items.map((item) => ({
    id: item.id,
    type: item.type === "query" ? MessageType.QUERY : MessageType.RESPONSE,
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
    type: item.type === MessageType.QUERY ? "query" : "result",
    content: item.content,
    timestamp: item.timestamp,
    options: item.metadata?.queryOptions,
  }));
};
