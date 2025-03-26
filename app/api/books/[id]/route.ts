import { getFirestore } from "firebase-admin/firestore";

import {
  withRateLimit,
  withOptionalAuth,
  AuthenticatedRequest,
} from "../../middleware";
import { firebaseAdmin } from "../../utils/firebase-admin";
import { successResponse, errorResponse } from "../../utils/response";

import { FIREBASE_COLLECTIONS } from "@/lib/constants";

// Get Firestore instance from Firebase Admin
const db = getFirestore(firebaseAdmin);

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } },
) {
  const bookId = params.id;
  if (!bookId) {
    return errorResponse("Book ID is required", 400);
  }
  const bookRef = db.collection(FIREBASE_COLLECTIONS.BOOKS).doc(bookId);
  const bookDoc = await bookRef.get();
  if (!bookDoc.exists) {
    return errorResponse("Book not found", 404);
  }
  const bookData = {
    id: bookDoc.id,
    viewCount: 0,
    ...(bookDoc.data() as Record<string, any>),
  };
  // If user is authenticated, record this view in their history
  if (req.user) {
    try {
      await db.collection(FIREBASE_COLLECTIONS.USER_HISTORY).add({
        userId: req.user.uid,
        bookId: bookId,
        action: "view",
        timestamp: new Date(),
      });
      // Increment the view count for this book
      await bookRef.update({
        viewCount: (bookData.viewCount || 0) + 1,
      });
    } catch {
      // Log the error but don't fail the request
    }
  }
  return successResponse(bookData);
}

export const GET = withRateLimit(withOptionalAuth(handler), 100);
