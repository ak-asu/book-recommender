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

async function handlePost(req: AuthenticatedRequest) {
  if (!req.user) return errorResponse("Authentication required", 401);
  const { bookId, liked } = await req.json();
  if (!bookId || typeof liked !== "boolean")
    return errorResponse("Invalid input", 400);
  const bookDoc = await db
    .collection(FIREBASE_COLLECTIONS.BOOKS)
    .doc(bookId)
    .get();
  if (!bookDoc.exists) return errorResponse("Book not found", 404);
  const bookData = bookDoc.data()!;
  const genres = bookData.genres || [];
  const length = getBookLengthCategory(bookData.pageCount);
  await db
    .collection(FIREBASE_COLLECTIONS.USER_FEEDBACK)
    .doc(`${req.user.uid}_${bookId}`)
    .set(
      { userId: req.user.uid, bookId, liked, timestamp: new Date() },
      { merge: true },
    );
  await db.collection(FIREBASE_COLLECTIONS.USER_HISTORY).add({
    userId: req.user.uid,
    bookId,
    action: "feedback",
    timestamp: new Date(),
  });
  await updateUserPreferences(req.user.uid, genres, length, liked);
  return successResponse({
    message: "Feedback recorded successfully",
    bookId,
    liked,
  });
}

function getBookLengthCategory(
  pageCount?: number,
): "short" | "medium" | "long" | null {
  if (!pageCount) return null;
  if (pageCount < 300) return "short";
  if (pageCount < 500) return "medium";
  return "long";
}

// Define types for preferences
type PreferenceCount = {
  count: number;
  likes: number;
  probability?: number;
};

type PreferenceData = {
  userId: string;
  genrePreferences: Record<string, PreferenceCount>;
  lengthPreferences: Record<"short" | "medium" | "long", PreferenceCount>;
  moodPreferences: Record<string, PreferenceCount>;
  updatedAt: Date;
};

async function updateUserPreferences(
  userId: string,
  genres: string[],
  length: "short" | "medium" | "long" | null,
  liked: boolean,
) {
  try {
    const userPrefsRef = db
      .collection(FIREBASE_COLLECTIONS.USER_PREFERENCES)
      .doc(userId);
    const userPrefsDoc = await userPrefsRef.get();
    let preferenceData: PreferenceData = {
      userId,
      genrePreferences: {},
      lengthPreferences: {} as Record<
        "short" | "medium" | "long",
        PreferenceCount
      >,
      moodPreferences: {},
      updatedAt: new Date(),
    };
    if (userPrefsDoc.exists)
      preferenceData = {
        ...preferenceData,
        ...userPrefsDoc.data(),
        updatedAt: new Date(),
      };
    for (const genre of genres) {
      if (!preferenceData.genrePreferences[genre])
        preferenceData.genrePreferences[genre] = { count: 0, likes: 0 };
      preferenceData.genrePreferences[genre].count += 1;
      if (liked) preferenceData.genrePreferences[genre].likes += 1;
      preferenceData.genrePreferences[genre].probability =
        preferenceData.genrePreferences[genre].likes /
        preferenceData.genrePreferences[genre].count;
    }
    if (length) {
      if (!preferenceData.lengthPreferences[length])
        preferenceData.lengthPreferences[length] = { count: 0, likes: 0 };
      preferenceData.lengthPreferences[length].count += 1;
      if (liked) preferenceData.lengthPreferences[length].likes += 1;
      preferenceData.lengthPreferences[length].probability =
        preferenceData.lengthPreferences[length].likes /
        preferenceData.lengthPreferences[length].count;
    }
    await userPrefsRef.set(preferenceData, { merge: true });
    if (liked) {
      const userRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(userId);
      const userData = await userRef.get();
      if (userData.exists) {
        const currentPreferences = userData.data()?.preferences ?? {};
        const favoriteGenres = currentPreferences.favoriteGenres || [];
        const updatedGenres = Array.from(
          new Set([...favoriteGenres, ...genres]),
        );
        if (JSON.stringify(updatedGenres) !== JSON.stringify(favoriteGenres)) {
          await userRef.update({
            "preferences.favoriteGenres": updatedGenres,
            "preferences.preferredLength":
              length || currentPreferences.preferredLength,
            updatedAt: new Date(),
          });
        }
      }
    }
  } catch {}
}

export const POST = withRateLimit(withAuth(handlePost), 20);
