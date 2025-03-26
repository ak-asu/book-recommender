import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin SDK for server-side operations
const firebaseConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
};

export const firebaseAdmin =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
