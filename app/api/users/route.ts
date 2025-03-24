import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { db, auth } from "@/lib/firebase";

// GET - Retrieve all users (with pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const users = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .slice(offset, offset + limit);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName, preferences = {} } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const { uid } = userCredential.user;

    // Create user document in Firestore
    const userRef = collection(db, "users");
    await addDoc(userRef, {
      uid,
      email,
      displayName,
      preferences,
      bookmarks: [],
      favorites: [],
      savedForLater: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json(
      { message: "User created successfully", uid },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.code === "auth/email-already-in-use") {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
