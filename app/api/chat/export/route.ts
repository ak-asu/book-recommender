import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import {
  withRateLimit,
  withAuth,
  AuthenticatedRequest,
} from "../../middleware";
import { firebaseAdmin } from "../../utils/firebase-admin";
import { successResponse, errorResponse } from "../../utils/response";

import { FIREBASE_COLLECTIONS } from "@/lib/constants";

const db = getFirestore(firebaseAdmin);

async function handler(req: AuthenticatedRequest) {
  if (!req.user) return errorResponse("Authentication required", 401);
  const { sessionId, format = "json" } = await req.json();
  try {
    let exportData;
    if (sessionId) {
      const sessionRef = db
        .collection(FIREBASE_COLLECTIONS.USERS)
        .doc(req.user.uid)
        .collection("chatSessions")
        .doc(sessionId);
      const sessionDoc = await sessionRef.get();
      if (!sessionDoc.exists)
        return errorResponse("Chat session not found", 404);
      const messagesRef = sessionRef.collection("messages");
      const q = messagesRef.orderBy("timestamp", "asc");
      const messagesSnapshot = await q.get();
      const messages = messagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          content: data.content,
          sender: data.sender,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
          ...(data.books ? { books: data.books } : {}),
        };
      });
      const sessionData = sessionDoc.data();
      if (!sessionData)
        return errorResponse("Chat session data not found", 404);
      exportData = {
        id: sessionId,
        lastMessage: sessionData.lastMessage,
        lastResponse: sessionData.lastResponse,
        updatedAt:
          sessionData.updatedAt?.toDate?.() || new Date(sessionData.updatedAt),
        createdAt:
          sessionData.createdAt?.toDate?.() || new Date(sessionData.createdAt),
        messages,
      };
    } else {
      const sessionsRef = db
        .collection(FIREBASE_COLLECTIONS.USERS)
        .doc(req.user.uid)
        .collection("chatSessions");
      const sessionsSnapshot = await sessionsRef.get();
      exportData = await Promise.all(
        sessionsSnapshot.docs.map(async (sessionDoc) => {
          const sessionId = sessionDoc.id;
          const sessionData = sessionDoc.data();
          const messagesRef = sessionDoc.ref.collection("messages");
          const q = messagesRef.orderBy("timestamp", "asc");
          const messagesSnapshot = await q.get();
          const messages = messagesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              content: data.content,
              sender: data.sender,
              timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
              ...(data.books ? { books: data.books } : {}),
            };
          });
          return {
            id: sessionId,
            lastMessage: sessionData.lastMessage,
            lastResponse: sessionData.lastResponse,
            updatedAt:
              sessionData.updatedAt?.toDate?.() ||
              new Date(sessionData.updatedAt),
            createdAt:
              sessionData.createdAt?.toDate?.() ||
              new Date(sessionData.createdAt),
            messages,
          };
        }),
      );
    }
    switch (format.toLowerCase()) {
      case "text":
        return formatTextExport(exportData);
      case "json":
      default:
        return successResponse({ format: "json", data: exportData });
    }
  } catch (error) {
    return errorResponse(
      `Failed to export chat data: ${(error as Error).message}`,
      500,
    );
  }
}
function formatTextExport(data: any) {
  try {
    let textExport = "";
    if (!Array.isArray(data)) {
      textExport += `Chat Session: ${data.id}\nCreated: ${data.createdAt}\nLast updated: ${data.updatedAt}\n\n`;
      data.messages.forEach((msg: any) => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        textExport += `[${timestamp}] ${msg.sender === "user" ? "You" : "Assistant"}: ${msg.content}\n\n`;
      });
    } else {
      data.forEach((session: any, index: number) => {
        textExport += `Chat Session ${index + 1}: ${session.id}\nCreated: ${session.createdAt}\nLast updated: ${session.updatedAt}\n\n`;
        session.messages.forEach((msg: any) => {
          const timestamp = new Date(msg.timestamp).toLocaleString();
          textExport += `[${timestamp}] ${msg.sender === "user" ? "You" : "Assistant"}: ${msg.content}\n\n`;
        });
        if (index < data.length - 1)
          textExport +=
            "\n---------------------------------------------------\n\n";
      });
    }
    return NextResponse.json(
      { text: textExport },
      {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": 'attachment; filename="chat-export.txt"',
        },
      },
    );
  } catch {
    return errorResponse("Failed to format text export", 500);
  }
}

export const POST = withRateLimit(withAuth(handler), 20);
