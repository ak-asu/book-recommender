import { getFirestore } from "firebase-admin/firestore";

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
  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const pageSize = limitParam ? parseInt(limitParam, 10) : 10;
  try {
    const sessionsRef = db
      .collection(FIREBASE_COLLECTIONS.USERS)
      .doc(req.user.uid)
      .collection("chatSessions");
    const q = sessionsRef.orderBy("updatedAt", "desc").limit(pageSize);
    const snapshot = await q.get();
    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        lastMessage: data.lastMessage,
        lastResponse: data.lastResponse,
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      };
    });
    return successResponse({ sessions });
  } catch (error) {
    return errorResponse(
      `Failed to retrieve chat sessions: ${(error as Error).message}`,
      500,
    );
  }
}

export const GET = withRateLimit(withAuth(handler), 50);
