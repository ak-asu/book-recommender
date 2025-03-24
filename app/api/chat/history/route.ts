import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const limitParam = url.searchParams.get("limit") || "10";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Query chat history for the user
    const chatsQuery = query(
      collection(db, "chats"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(parseInt(limitParam, 10)),
    );

    const chatsSnapshot = await getDocs(chatsQuery);

    const chats = [];
    chatsSnapshot.forEach((doc) => {
      chats.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firebase timestamps to ISO strings for JSON serialization
        createdAt: doc.data().createdAt?.toDate().toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate().toISOString() || null,
      });
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error fetching chat history:", error);

    return NextResponse.json(
      { error: "Failed to fetch chat history", details: error.message },
      { status: 500 },
    );
  }
}
