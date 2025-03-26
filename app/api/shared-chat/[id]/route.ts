import { getFirestore } from "firebase-admin/firestore";
import { NextRequest } from "next/server";

import { withRateLimit } from "../../middleware";
import { firebaseAdmin } from "../../utils/firebase-admin";
import { successResponse, errorResponse } from "../../utils/response";

import { FIREBASE_COLLECTIONS } from "@/lib/constants";

const db = getFirestore(firebaseAdmin);

async function handler(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const shareId = params.id;
  if (!shareId) return errorResponse("Share ID is required", 400);
  try {
    const shareRef = db
      .collection(FIREBASE_COLLECTIONS.SHARED_CHATS)
      .doc(shareId);
    const shareDoc = await shareRef.get();
    if (!shareDoc.exists) return errorResponse("Shared chat not found", 404);
    const shareData = shareDoc.data();
    if (!shareData) return errorResponse("Shared chat data not found", 404);
    const expiresAt =
      shareData.expiresAt?.toDate?.() || new Date(shareData.expiresAt);
    if (expiresAt < new Date())
      return errorResponse("This shared chat has expired", 410);
    return successResponse({
      id: shareId,
      data: shareData.data,
      createdAt:
        shareData.createdAt?.toDate?.() || new Date(shareData.createdAt),
      expiresAt,
    });
  } catch (error) {
    return errorResponse(
      `Failed to retrieve shared chat: ${(error as Error).message}`,
      500,
    );
  }
}

export const GET = withRateLimit(handler, 100);
