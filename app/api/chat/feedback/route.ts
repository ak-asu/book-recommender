import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { updateUserPreferences } from "@/services/userService";

export async function POST(request: NextRequest) {
  try {
    const { chatId, messageId, bookId, feedback, userId } =
      await request.json();

    if (!chatId || !messageId || !bookId || !feedback) {
      return NextResponse.json(
        { error: "Chat ID, message ID, book ID, and feedback are required" },
        { status: 400 },
      );
    }

    // Validate feedback value
    if (!["like", "dislike"].includes(feedback)) {
      return NextResponse.json(
        { error: "Feedback must be either 'like' or 'dislike'" },
        { status: 400 },
      );
    }

    // Reference to the message
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Update the message with user feedback
    await updateDoc(messageRef, {
      [`feedback.${bookId}`]: feedback,
      [`feedbackTimestamp.${bookId}`]: serverTimestamp(),
    });

    // Store feedback for recommendation engine learning
    await addDoc(collection(db, "bookFeedback"), {
      userId: userId || null, // Handle guest users
      bookId,
      chatId,
      messageId,
      feedback,
      timestamp: serverTimestamp(),
    });

    // Update user preferences if user is logged in
    if (userId) {
      await updateUserPreferences(userId, bookId, feedback);
    }

    return NextResponse.json({
      success: true,
      message: `Feedback '${feedback}' recorded for book ${bookId}`,
    });
  } catch (error) {
    console.error("Error recording feedback:", error);

    return NextResponse.json(
      { error: "Failed to record feedback", details: error.message },
      { status: 500 },
    );
  }
}
