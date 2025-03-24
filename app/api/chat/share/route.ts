import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { nanoid } from "nanoid";

import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { chatId, userId } = await request.json();

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

    // Verify that the user owns this chat or it's already public
    const chatData = chatDoc.data();
    if (chatData.userId && chatData.userId !== userId && !chatData.isPublic) {
      return NextResponse.json(
        { error: "Unauthorized to share this chat" },
        { status: 403 },
      );
    }

    // Generate a share token if not already present
    const shareToken = chatData.shareToken || nanoid(10);

    // Update the chat with public sharing info
    await updateDoc(chatRef, {
      isPublic: true,
      shareToken,
      sharedAt: chatData.sharedAt || new Date(),
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/shared/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl,
    });
  } catch (error) {
    console.error("Error sharing chat:", error);

    return NextResponse.json(
      { error: "Failed to share chat", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shareToken = url.searchParams.get("token");

    if (!shareToken) {
      return NextResponse.json(
        { error: "Share token is required" },
        { status: 400 },
      );
    }

    // Find the chat with this share token
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("shareToken", "==", shareToken),
      where("isPublic", "==", true),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Shared chat not found or not public" },
        { status: 404 },
      );
    }

    // Get the first matching chat
    const chatDoc = snapshot.docs[0];
    const chatData = {
      id: chatDoc.id,
      ...chatDoc.data(),
      createdAt: chatDoc.data().createdAt?.toDate().toISOString() || null,
      updatedAt: chatDoc.data().updatedAt?.toDate().toISOString() || null,
      sharedAt: chatDoc.data().sharedAt?.toDate().toISOString() || null,
    };

    // Get all messages in the chat
    const messagesQuery = query(
      collection(db, "chats", chatDoc.id, "messages"),
      orderBy("timestamp", "asc"),
    );

    const messagesSnapshot = await getDocs(messagesQuery);

    const messages = [];
    messagesSnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString() || null,
      });
    });

    return NextResponse.json({
      chat: chatData,
      messages,
    });
  } catch (error) {
    console.error("Error fetching shared chat:", error);

    return NextResponse.json(
      { error: "Failed to fetch shared chat", details: error.message },
      { status: 500 },
    );
  }
}
