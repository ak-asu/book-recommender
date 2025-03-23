import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getAIBookRecommendations } from "@/services/bookService";

export async function POST(request: NextRequest) {
  try {
    const { message, options, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Get AI recommendations
    const recommendations = await getAIBookRecommendations(message, {
      ...options,
      userId,
    });

    // Create a new chat document
    const chatRef = await addDoc(collection(db, "chats"), {
      title: message.length > 30 ? `${message.substring(0, 30)}...` : message,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Add the first message to the chat
    const userMessageRef = await addDoc(
      collection(db, "chats", chatRef.id, "messages"),
      {
        content: message,
        sender: "user",
        timestamp: serverTimestamp(),
      },
    );

    // Add the assistant response
    const assistantMessage = `Here are some book recommendations based on your query: "${message}"`;

    const assistantMessageRef = await addDoc(
      collection(db, "chats", chatRef.id, "messages"),
      {
        content: assistantMessage,
        sender: "assistant",
        timestamp: serverTimestamp(),
        recommendations: recommendations,
      },
    );

    return NextResponse.json({
      chatId: chatRef.id,
      message: assistantMessage,
      recommendations: recommendations,
    });
  } catch (error) {
    console.error("Error creating chat:", error);

    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 },
    );
  }
}
