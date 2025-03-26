import { getFirestore } from "firebase-admin/firestore";

import {
  withRateLimit,
  withAuth,
  AuthenticatedRequest,
} from "../../middleware";
import { firebaseAdmin } from "../../utils/firebase-admin";
import { successResponse, errorResponse } from "../../utils/response";

import { FIREBASE_COLLECTIONS, DEFAULT_VALUES } from "@/lib/constants";

const db = getFirestore(firebaseAdmin);

async function handleGet(req: AuthenticatedRequest) {
  if (!req.user) return errorResponse("Authentication required", 401);
  const userRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(req.user.uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists)
    return successResponse({ preferences: DEFAULT_VALUES.USER_PREFERENCES });
  return successResponse({
    preferences: userDoc.data()?.preferences || DEFAULT_VALUES.USER_PREFERENCES,
  });
}

async function handlePatch(req: AuthenticatedRequest) {
  if (!req.user) return errorResponse("Authentication required", 401);
  const updates = await req.json();
  if (!updates || typeof updates !== "object")
    return errorResponse("Invalid preferences data", 400);
  const userRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(req.user.uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    await userRef.set({
      email: req.user.email,
      preferences: { ...DEFAULT_VALUES.USER_PREFERENCES, ...updates },
      createdAt: new Date(),
    });
    return successResponse({
      preferences: { ...DEFAULT_VALUES.USER_PREFERENCES, ...updates },
    });
  }
  const currentPreferences =
    userDoc.data()?.preferences || DEFAULT_VALUES.USER_PREFERENCES;
  const updatedPreferences = { ...currentPreferences, ...updates };
  userRef.update({
    preferences: updatedPreferences,
    updatedAt: new Date(),
  });
  return successResponse({ preferences: updatedPreferences });
}

export const GET = withRateLimit(withAuth(handleGet), 50);
export const PATCH = withRateLimit(withAuth(handlePatch), 20);
