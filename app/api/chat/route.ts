import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getAIBookRecommendations } from "@/services/bookService";

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, userId, options = {} } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json(
        { error: "Chat ID and message are required" },
        { status: 400 },
      );
    }

    // Add user message to chat
    const userMessageRef = await addDoc(
      collection(db, "chats", chatId, "messages"),
      {
        content: message,
        sender: "user",
        timestamp: serverTimestamp(),
        options: options, // Store any search options the user selected
      },
    );

    // Get AI response with recommendations
    const recommendations = await getAIBookRecommendations(message, {
      userId,
      chatId,
      ...options, // Pass any additional options like genre, length, mood
    });

    // Create assistant response message
    const assistantMessage = `Here are some book recommendations based on your query: "${message}"`;

    // Add assistant message to chat
    const assistantMessageRef = await addDoc(
      collection(db, "chats", chatId, "messages"),
      {
        content: assistantMessage,
        sender: "assistant",
        timestamp: serverTimestamp(),
        recommendations: recommendations,
        messageId: assistantMessageRef.id, // Store message ID for future reference
      },
    );

    // Update chat's updatedAt timestamp
    await updateDoc(doc(db, "chats", chatId), {
      updatedAt: serverTimestamp(),
      lastMessage:
        message.length > 50 ? `${message.substring(0, 50)}...` : message,
    });

    return NextResponse.json({
      message: assistantMessage,
      recommendations: recommendations,
      messageId: assistantMessageRef.id,
    });
  } catch (error) {
    console.error("Error sending message:", error);

    return NextResponse.json(
      { error: "Failed to send message", details: error.message },
      { status: 500 },
    );
  }
}
