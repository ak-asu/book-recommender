import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getAIBookRecommendations } from "@/services/bookService";

export async function POST(request: NextRequest) {
  try {
    const { chatId, messageId, userId, options = {} } = await request.json();

    if (!chatId || !messageId) {
      return NextResponse.json(
        { error: "Chat ID and message ID are required" },
        { status: 400 },
      );
    }

    // Get the original message to retrieve query
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Find the user's original query message
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messagesSnapshot = await getDoc(doc(messagesRef, messageId));

    if (!messagesSnapshot.exists()) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const messageData = messagesSnapshot.data();
    const originalQuery = messageData.content;
    const originalOptions = messageData.options || {};

    // Get new recommendations with potentially modified options
    const mergedOptions = { ...originalOptions, ...options };
    const recommendations = await getAIBookRecommendations(originalQuery, {
      userId,
      chatId,
      regenerate: true, // Flag to indicate this is a regeneration
      ...mergedOptions,
    });

    // Create assistant response message
    const assistantMessage = `Here are some refreshed book recommendations based on your query: "${originalQuery}"`;

    // Add new assistant message to chat
    const assistantMessageRef = await addDoc(
      collection(db, "chats", chatId, "messages"),
      {
        content: assistantMessage,
        sender: "assistant",
        timestamp: serverTimestamp(),
        recommendations: recommendations,
        regeneratedFrom: messageId,
        options: mergedOptions,
      },
    );

    // Update chat's updatedAt timestamp
    await updateDoc(chatRef, {
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      message: assistantMessage,
      recommendations: recommendations,
      messageId: assistantMessageRef.id,
    });
  } catch (error) {
    console.error("Error regenerating recommendations:", error);

    return NextResponse.json(
      { error: "Failed to regenerate recommendations", details: error.message },
      { status: 500 },
    );
  }
}
