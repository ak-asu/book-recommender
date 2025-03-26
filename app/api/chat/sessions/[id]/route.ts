import { getFirestore } from "firebase-admin/firestore";

import {
  withRateLimit,
  withAuth,
  AuthenticatedRequest,
} from "../../../middleware";
import { firebaseAdmin } from "../../../utils/firebase-admin";
import { successResponse, errorResponse } from "../../../utils/response";

import { FIREBASE_COLLECTIONS } from "@/lib/constants";

const db = getFirestore(firebaseAdmin);

async function handleGet(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } },
) {
  if (!req.user) return errorResponse("Authentication required", 401);
  const sessionId = params.id;
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
        id: doc.id,
        content: data.content,
        sender: data.sender,
        books: data.books,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
      };
    });
    const sessionData = sessionDoc.data();
    if (!sessionData) return errorResponse("Chat session data not found", 404);
    return successResponse({
      id: sessionId,
      lastMessage: sessionData.lastMessage,
      lastResponse: sessionData.lastResponse,
      updatedAt:
        sessionData.updatedAt?.toDate?.() || new Date(sessionData.updatedAt),
      createdAt:
        sessionData.createdAt?.toDate?.() || new Date(sessionData.createdAt),
      messages,
    });
  } catch (error) {
    return errorResponse(
      `Failed to retrieve chat session: ${(error as Error).message}`,
      500,
    );
  }
}

async function handleDelete(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } },
) {
  if (!req.user) return errorResponse("Authentication required", 401);
  const sessionId = params.id;
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
    const messagesSnapshot = await messagesRef.get();
    const batch = db.batch();
    messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(sessionRef);
    await batch.commit();
    return successResponse({
      message: "Chat session deleted successfully",
      id: sessionId,
    });
  } catch (error) {
    return errorResponse(
      `Failed to delete chat session: ${(error as Error).message}`,
      500,
    );
  }
}

export const GET = withRateLimit(withAuth(handleGet), 50);
export const DELETE = withRateLimit(withAuth(handleDelete), 20);
