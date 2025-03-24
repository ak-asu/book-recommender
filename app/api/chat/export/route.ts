import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const chatId = url.searchParams.get("chatId");
    const format = url.searchParams.get("format") || "json";

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 },
      );
    }

    // Get chat data
    const chatDoc = await getDoc(doc(db, "chats", chatId));

    if (!chatDoc.exists()) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const chatData = {
      id: chatDoc.id,
      ...chatDoc.data(),
      createdAt: chatDoc.data().createdAt?.toDate().toISOString() || null,
      updatedAt: chatDoc.data().updatedAt?.toDate().toISOString() || null,
    };

    // Get all messages in the chat
    const messagesQuery = query(
      collection(db, "chats", chatId, "messages"),
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

    const exportData = {
      chat: chatData,
      messages,
    };

    // Format output based on requested format
    if (format === "text") {
      let textContent = `Chat: ${chatData.title}\n`;
      textContent += `Created: ${chatData.createdAt}\n\n`;

      messages.forEach((msg) => {
        textContent += `[${msg.sender}] ${msg.timestamp}:\n${msg.content}\n\n`;

        if (msg.recommendations && msg.recommendations.length > 0) {
          textContent += "Recommendations:\n";
          msg.recommendations.forEach((book, index) => {
            textContent += `${index + 1}. "${book.title}" by ${book.author}\n`;
          });
          textContent += "\n";
        }
      });

      return new NextResponse(textContent, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="chat-${chatId}.txt"`,
        },
      });
    }

    // Default to JSON format
    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error exporting chat:", error);

    return NextResponse.json(
      { error: "Failed to export chat", details: error.message },
      { status: 500 },
    );
  }
}
