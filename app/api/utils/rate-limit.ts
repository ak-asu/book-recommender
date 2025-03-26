import { getFirestore } from "firebase-admin/firestore";

import { firebaseAdmin } from "./firebase-admin";

const db = getFirestore(firebaseAdmin);

// Configuration interface for the rate limiter
interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed per window
  windowMs: number; // Window size in milliseconds
  collection?: string; // Firestore collection to use for storing rate limit data
}

// Result of a rate limit check
interface RateLimitResult {
  success: boolean; // Whether the request is allowed
  limit: number; // Total requests allowed
  remaining: number; // Remaining requests allowed
  reset: number; // Time when the rate limit resets (Unix timestamp)
}

//* Create a Firestore-based rate limiter
export function rateLimit(config: RateLimitConfig) {
  const {
    maxRequests = 10,
    windowMs = 60 * 1000, // 1 minute by default
    collection = "rateLimits",
  } = config;
  return {
    async check(identifier: string): Promise<RateLimitResult> {
      // Clean the identifier to ensure it's a valid document ID
      const safeIdentifier = encodeURIComponent(identifier).replace(/\./g, "_");
      const now = Date.now();
      const windowStart = now - windowMs;
      // Create a document reference for this rate limit entry
      const rateLimitRef = db.collection(collection).doc(safeIdentifier);
      try {
        // Get current rate limit data
        const rateLimitDoc = await rateLimitRef.get();
        const rateLimitData = rateLimitDoc.exists ? rateLimitDoc.data() : null;
        // If no data or window has expired, initialize a new window
        if (!rateLimitData || rateLimitData.windowStart < windowStart) {
          const newData = {
            count: 1,
            windowStart: now,
            lastRequest: now,
          };
          await rateLimitRef.set(newData);
          return {
            success: true,
            limit: maxRequests,
            remaining: maxRequests - 1,
            reset: now + windowMs,
          };
        }
        // Calculate remaining requests
        const elapsedTime = now - rateLimitData.windowStart;
        const windowRemaining = Math.max(0, windowMs - elapsedTime);
        const resetTime = now + windowRemaining;
        const currentCount = rateLimitData.count || 0;
        // Check if rate limit is exceeded
        if (currentCount >= maxRequests) {
          return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            reset: resetTime,
          };
        }
        // Increment request count
        await rateLimitRef.set(
          {
            count: currentCount + 1,
            lastRequest: now,
          },
          { merge: true },
        );
        return {
          success: true,
          limit: maxRequests,
          remaining: maxRequests - (currentCount + 1),
          reset: resetTime,
        };
      } catch {
        // If there's an error, allow the request but log the error
        return {
          success: true,
          limit: maxRequests,
          remaining: 1,
          reset: now + windowMs,
        };
      }
    },

    async reset(identifier: string): Promise<void> {
      const safeIdentifier = encodeURIComponent(identifier).replace(/\./g, "_");
      const rateLimitRef = db.collection(collection).doc(safeIdentifier);
      try {
        await rateLimitRef.set({
          count: 0,
          windowStart: Date.now(),
          lastRequest: Date.now(),
        });
      } catch {}
    },
  };
}
