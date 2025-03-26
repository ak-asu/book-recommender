import { getFirestore, FieldValue } from "firebase-admin/firestore";

import {
  withRateLimit,
  withOptionalAuth,
  AuthenticatedRequest,
} from "../middleware";
import { firebaseAdmin } from "../utils/firebase-admin";
import { AIProviderFactory } from "../utils/genai";
import { successResponse, errorResponse } from "../utils/response";

import { FIREBASE_COLLECTIONS } from "@/lib/constants";

const db = getFirestore(firebaseAdmin);

async function handler(req: AuthenticatedRequest) {
  // Extract chat parameters from request body
  const { message, sessionId, options, regenerate = false } = await req.json();
  const userId = req.user?.uid;
  // Validate input
  if (!message || message.trim().length === 0) {
    return errorResponse("Message is required", 400);
  }
  try {
    let chatSessionId = sessionId;
    // Create a new session ID if not provided
    if (!chatSessionId) {
      chatSessionId = db.collection("chats").doc().id; // Corrected to use firebase-admin
    }
    // Build the conversation context
    let contextMessages: any[] = [];
    // If this is a registered user and we have a session ID, get previous messages
    if (userId && chatSessionId && !regenerate) {
      const messagesQuery = db
        .collection(FIREBASE_COLLECTIONS.USERS)
        .doc(userId)
        .collection("chatSessions")
        .doc(chatSessionId)
        .collection("messages");
      const messagesSnapshot = await messagesQuery.get();
      contextMessages = messagesSnapshot.docs
        .map((doc) => doc.data())
        .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()) // Adjusted timestamp comparison
        .slice(-5); // Use last 5 messages for context
    }
    let prompt = message;
    if (contextMessages.length > 0) {
      prompt = `Previous conversation:\n${contextMessages
        .map(
          (msg) =>
            `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.content}`,
        )
        .join("\n")}\n\nUser: ${message}\n\nAssistant:`;
    }
    if (options) {
      if (options.genre) {
        prompt += `\nPlease consider books in the ${options.genre} genre.`;
      }
      if (options.length) {
        prompt += `\nI prefer ${options.length} books.`;
      }
      if (options.mood) {
        prompt += `\nI'm looking for books with a ${options.mood} mood.`;
      }
    }
    const aiProvider = AIProviderFactory.getProvider();
    const aiResponse = await aiProvider.getRecommendations(prompt);
    const books = aiResponse.recommendations;
    let textResponse =
      "Here are some book recommendations based on your request:\n\n";
    books.forEach((book, index) => {
      textResponse += `${index + 1}. "${book.title}" by ${book.author}\n`;
      textResponse += `   Genre: ${book.genres.join(", ")}\n`;
      textResponse += `   Rating: ${book.rating}/5\n`;
      textResponse += `   Description: ${book.description.substring(0, 150)}...\n\n`;
    });
    textResponse +=
      "Would you like more specific recommendations or details about any of these books?";
    if (userId) {
      // Store in user's chat session
      const sessionRef = db
        .collection(FIREBASE_COLLECTIONS.USERS)
        .doc(userId)
        .collection("chatSessions")
        .doc(chatSessionId);
      // Update or create session
      await sessionRef.set(
        {
          lastMessage: message,
          lastResponse: textResponse,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      // Add user message
      await sessionRef.collection("messages").add({
        content: message,
        sender: "user",
        timestamp: FieldValue.serverTimestamp(),
      });
      // Add AI response
      await sessionRef.collection("messages").add({
        content: textResponse,
        sender: "assistant",
        books: books,
        timestamp: FieldValue.serverTimestamp(),
      });
    } else {
      // Store in anonymous chat session
      const sessionRef = db
        .collection(FIREBASE_COLLECTIONS.ANONYMOUS_CHATS)
        .doc(chatSessionId);
      // Update or create session
      await sessionRef.set(
        {
          lastMessage: message,
          lastResponse: textResponse,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      // Add user message
      await sessionRef.collection("messages").add({
        content: message,
        sender: "user",
        timestamp: FieldValue.serverTimestamp(),
      });
      // Add AI response
      await sessionRef.collection("messages").add({
        content: textResponse,
        sender: "assistant",
        books: books,
        timestamp: FieldValue.serverTimestamp(),
      });
    }
    return successResponse({
      sessionId: chatSessionId,
      message: {
        content: message,
        sender: "user",
      },
      response: {
        content: textResponse,
        sender: "assistant",
        books,
      },
    });
  } catch (error) {
    return errorResponse(
      `Failed to process chat request: ${(error as Error).message}`,
      500,
    );
  }
}

export const POST = withRateLimit(withOptionalAuth(handler), 10);
