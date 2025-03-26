import { getFirestore } from "firebase-admin/firestore";

import {
  withRateLimit,
  withAuth,
  AuthenticatedRequest,
} from "../../middleware";
import { firebaseAdmin } from "../../utils/firebase-admin";
import { successResponse, errorResponse } from "../../utils/response";

import { FIREBASE_COLLECTIONS, COLLECTION_CONFIG } from "@/lib/constants";

const db = getFirestore(firebaseAdmin);

async function handleGet(req: AuthenticatedRequest) {
  if (!req.user) return errorResponse("Authentication required", 401);
  const { searchParams } = new URL(req.url);
  const collectionType = searchParams.get("type") || "bookmarks";
  const pageSize = parseInt(searchParams.get("limit") || "20", 10);
  if (!["bookmarks", "favorites", "savedForLater"].includes(collectionType))
    return errorResponse("Invalid collection type", 400);
  const config =
    COLLECTION_CONFIG[collectionType as keyof typeof COLLECTION_CONFIG];
  if (!config) return errorResponse("Invalid collection type", 400);
  const snapshot = await db
    .collection(config.collectionName)
    .where("userId", "==", req.user.uid)
    .orderBy("createdAt", "desc")
    .limit(pageSize)
    .get();
  const items = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const bookId = doc.data().bookId;
      const bookDoc = await db
        .collection(FIREBASE_COLLECTIONS.BOOKS)
        .doc(bookId)
        .get();
      return {
        id: doc.id,
        bookId,
        createdAt: doc.data().createdAt.toDate(),
        book: bookDoc.exists
          ? { id: bookDoc.id, ...bookDoc.data() }
          : {
              id: bookId,
              title: "Unknown Book",
              author: "Unknown Author",
              imageUrl: "/images/default-book-cover.jpg",
            },
      };
    }),
  );
  return successResponse({ items, collectionType });
}

async function handlePost(req: AuthenticatedRequest) {
  if (!req.user) return errorResponse("Authentication required", 401);
  const { bookId, collectionType } = await req.json();
  if (
    !bookId ||
    !["bookmarks", "favorites", "savedForLater"].includes(collectionType)
  )
    return errorResponse("Invalid input", 400);
  const config =
    COLLECTION_CONFIG[collectionType as keyof typeof COLLECTION_CONFIG];
  if (!config) return errorResponse("Invalid collection type", 400);
  const bookDoc = await db
    .collection(FIREBASE_COLLECTIONS.BOOKS)
    .doc(bookId)
    .get();
  if (!bookDoc.exists) return errorResponse("Book not found", 404);
  const existingItem = await db
    .collection(config.collectionName)
    .doc(`${req.user.uid}_${bookId}`)
    .get();
  if (existingItem.exists)
    return errorResponse(`Book already in ${collectionType}`, 409);
  await db
    .collection(config.collectionName)
    .doc(`${req.user.uid}_${bookId}`)
    .set({ userId: req.user.uid, bookId, createdAt: new Date() });
  const userRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(req.user.uid);
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    const currentCollection = userData ? userData[config.userField] || [] : [];
    if (!currentCollection.includes(bookId)) {
      await userRef.update({
        [config.userField]: [...currentCollection, bookId],
      });
    }
  }
  if (config.historyAction) {
    await db.collection(FIREBASE_COLLECTIONS.USER_HISTORY).add({
      userId: req.user.uid,
      bookId,
      action: config.historyAction,
      timestamp: new Date(),
    });
  }
  return successResponse(
    { message: `Book added to ${collectionType}`, bookId, collectionType },
    201,
  );
}

async function handleDelete(req: AuthenticatedRequest) {
  if (!req.user) return errorResponse("Authentication required", 401);
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  const collectionType = searchParams.get("type") || "bookmarks";
  if (
    !bookId ||
    !["bookmarks", "favorites", "savedForLater"].includes(collectionType)
  )
    return errorResponse("Invalid input", 400);
  const config =
    COLLECTION_CONFIG[collectionType as keyof typeof COLLECTION_CONFIG];
  if (!config) return errorResponse("Invalid collection type", 400);
  const itemRef = db
    .collection(config.collectionName)
    .doc(`${req.user.uid}_${bookId}`);
  const itemDoc = await itemRef.get();
  if (!itemDoc.exists)
    return errorResponse(`Book not found in ${collectionType}`, 404);
  await itemRef.delete();
  const userRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(req.user.uid);
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    const currentCollection = userData ? userData[config.userField] || [] : [];
    await userRef.update({
      [config.userField]: currentCollection.filter(
        (id: string) => id !== bookId,
      ),
    });
  }
  return successResponse({
    message: `Book removed from ${collectionType}`,
    bookId,
    collectionType,
  });
}

export const GET = withRateLimit(withAuth(handleGet), 50);
export const POST = withRateLimit(withAuth(handlePost), 20);
export const DELETE = withRateLimit(withAuth(handleDelete), 20);
