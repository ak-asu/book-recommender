import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const chatId = url.searchParams.get("chatId");
    const userId = url.searchParams.get("userId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 },
      );
    }

    // Get chat data to verify ownership
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Verify that the user owns this chat
    const chatData = chatDoc.data();
    if (chatData.userId && chatData.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this chat" },
        { status: 403 },
      );
    }

    // First, delete all messages in the chat
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messagesSnapshot = await getDocs(messagesRef);

    const batch = writeBatch(db);

    messagesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the chat document
    batch.delete(chatRef);

    // Commit the batch deletion
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Chat and all associated messages deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat:", error);

    return NextResponse.json(
      { error: "Failed to delete chat", details: error.message },
      { status: 500 },
    );
  }
}
