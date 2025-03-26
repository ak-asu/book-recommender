import { getFirestore } from "firebase-admin/firestore";
import { nanoid } from "nanoid";

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
  const { sessionId } = await req.json();
  if (!sessionId) return errorResponse("Session ID is required", 400);
  try {
    const sessionRef = db
      .collection(FIREBASE_COLLECTIONS.USERS)
      .doc(req.user.uid)
      .collection("chatSessions")
      .doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) return errorResponse("Chat session not found", 404);
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
    const shareId = nanoid(10);
    const shareRef = db
      .collection(FIREBASE_COLLECTIONS.SHARED_CHATS)
      .doc(shareId);
    await shareRef.set({
      originalSessionId: sessionId,
      userId: req.user.uid,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      data: { ...sessionDoc.data(), messages },
    });
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://localhost.com"}/shared-chat/${shareId}`;
    return successResponse({
      shareId,
      shareUrl,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    return errorResponse(
      `Failed to create shareable link: ${(error as Error).message}`,
      500,
    );
  }
}

export const POST = withRateLimit(withAuth(handler), 20);
