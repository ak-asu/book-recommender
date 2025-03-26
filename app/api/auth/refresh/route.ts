import { getAuth } from "firebase-admin/auth";

import {
  withRateLimit,
  withAuth,
  AuthenticatedRequest,
} from "../../middleware";
import { firebaseAdmin } from "../../utils/firebase-admin";
import { successResponse, errorResponse } from "../../utils/response";

async function handler(req: AuthenticatedRequest) {
  if (!req.user) {
    return errorResponse("Authentication required", 401);
  }
  try {
    // Create a custom token
    const customToken = await getAuth(firebaseAdmin).createCustomToken(
      req.user.uid,
    );
    return successResponse({
      customToken,
      message: "Token refresh successful",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return errorResponse(`Failed to refresh token: ${errorMessage}`, 500);
  }
}

// Rate limit this endpoint to prevent abuse
export const POST = withRateLimit(withAuth(handler), 10);
