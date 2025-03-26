import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

import { rateLimit } from "./utils/rate-limit";
import { firebaseAdmin } from "./utils/firebase-admin";

import { ErrorCategory, formatError } from "@/lib/errorHandler";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    isAnonymous?: boolean;
    authTime?: Date;
    emailVerified?: boolean;
  };
  staleAuth?: boolean;
}

// Error handling middleware
export function withErrorHandling(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>,
) {
  return async (req: NextRequest, params?: any): Promise<NextResponse> => {
    try {
      return await handler(req, params);
    } catch (error) {
      const formattedError = formatError(error, ErrorCategory.API);
      return NextResponse.json(
        { error: formattedError.message },
        { status: getErrorStatusCode(formattedError.code) },
      );
    }
  };
}

// Authentication middleware with enhanced security
export function withAuth(
  handler: (req: AuthenticatedRequest, params?: any) => Promise<NextResponse>,
) {
  return withErrorHandling(
    async (req: NextRequest, params?: any): Promise<NextResponse> => {
      try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return NextResponse.json(
            { error: "Unauthorized: Missing or invalid authentication token" },
            { status: 401 },
          );
        }
        const token = authHeader.split("Bearer ")[1];
        // Verify CSRF token for state-changing methods
        if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
          const csrfToken = req.headers.get("X-CSRF-Token");
          if (!csrfToken) {
            return NextResponse.json(
              { error: "CSRF token missing" },
              { status: 403 },
            );
          }
        }
        // Verify the Firebase token
        // Enhance security by checking token revocation
        // This helps if a token was compromised and admin revoked it
        const checkRevoked = true;
        const decodedTokenVerified = await getAuth(firebaseAdmin).verifyIdToken(
          token,
          checkRevoked,
        );
        // Additional IP-based checks could be added here
        // Implement IP verification for enhanced security
        const userIp =
          req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          req.headers.get("x-real-ip") ||
          "unknown";
        // Check if the token has IP information stored
        const tokenIp = decodedTokenVerified.ip;
        // If this is a sensitive operation and IPs don't match
        const isSensitiveOperation = ["DELETE", "PUT"].includes(req.method);
        if (tokenIp && tokenIp !== userIp && isSensitiveOperation) {
          // TODO
          // eslint-disable-next-line no-console
          console.warn(
            `IP mismatch for user ${decodedTokenVerified.uid}: Token IP=${tokenIp}, Request IP=${userIp}`,
          );
          // For sensitive operations, we might reject the request
          // For normal operations, we'll log it but allow with a flag
          if (isSensitiveOperation) {
            return NextResponse.json(
              {
                error:
                  "Security alert: Your connection details have changed. Please log in again.",
              },
              { status: 401 },
            );
          }
        }
        const user = {
          uid: decodedTokenVerified.uid,
          email: decodedTokenVerified.email || "",
          isAnonymous:
            decodedTokenVerified.firebase?.sign_in_provider === "anonymous",
          // Add more user data as needed
          authTime: new Date(decodedTokenVerified.auth_time * 1000),
          emailVerified: decodedTokenVerified.email_verified || false,
        };
        // Extend request with user data
        const authReq = req as AuthenticatedRequest;
        authReq.user = user;
        // Check for potentially suspicious conditions
        // For example, if token was issued more than X hours ago, require re-auth
        const tokenIssueTime = new Date(decodedTokenVerified.auth_time * 1000);
        const hoursSinceIssue =
          (Date.now() - tokenIssueTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceIssue > 24) {
          // For sensitive operations, you might want to request re-authentication
          // For now, we'll just add a flag to the request
          authReq.staleAuth = true;
        }
        return handler(authReq, params);
      } catch (error: any) {
        if (error.code === "auth/id-token-revoked") {
          // The token has been revoked, ask user to re-authenticate
          return NextResponse.json(
            {
              error: "Your session has been revoked. Please log in again.",
              code: "AUTH_REVOKED",
            },
            { status: 401 },
          );
        }
        return NextResponse.json(
          { error: "Unauthorized: Invalid authentication token" },
          { status: 401 },
        );
      }
    },
  );
}

// Rate limiting middleware
export function withRateLimit(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>,
  maxRequests = 10, // Requests per window
  windowMs = 60 * 1000, // Window size in milliseconds (1 minute)
) {
  const limiter = rateLimit({
    maxRequests,
    windowMs,
  });
  return withErrorHandling(
    async (req: NextRequest, params?: any): Promise<NextResponse> => {
      const ip = req.headers.get("x-forwarded-for") || "unknown";
      const { success, limit, remaining, reset } = await limiter.check(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Too Many Requests" },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          },
        );
      }
      const response = await handler(req, params);
      // Add rate limit headers to the response
      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());
      return response;
    },
  );
}

// Optional auth middleware - doesn't require authentication but provides user data if available
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest, params?: any) => Promise<NextResponse>,
) {
  return withErrorHandling(
    async (req: NextRequest, params?: any): Promise<NextResponse> => {
      try {
        const authHeader = req.headers.get("Authorization");
        const authReq = req as AuthenticatedRequest;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.split("Bearer ")[1];
          try {
            const decodedToken =
              await getAuth(firebaseAdmin).verifyIdToken(token);
            authReq.user = {
              uid: decodedToken.uid,
              email: decodedToken.email || "",
              isAnonymous:
                decodedToken.firebase?.sign_in_provider === "anonymous",
            };
          } catch {
            // Token is invalid but we don't require auth, so continue without user data
          }
        }
        return handler(authReq, params);
      } catch {
        return handler(req as AuthenticatedRequest, params);
      }
    },
  );
}

// Security headers middleware
export function withSecurityHeaders(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>,
) {
  return async (req: NextRequest, params?: any): Promise<NextResponse> => {
    const response = await handler(req, params);
    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    return response;
  };
}

// Helper function to determine HTTP status code from error code
function getErrorStatusCode(errorCode: string): number {
  if (errorCode.includes("auth/")) return 401;
  if (errorCode.includes("permission-denied")) return 403;
  if (errorCode.includes("not-found")) return 404;
  if (errorCode.includes("already-exists")) return 409;
  if (errorCode.includes("rate-limit")) return 429;
  return 500;
}

/**
 * PUBLIC ENDPOINT FACTORY FUNCTIONS
 * These provide convenient composition of middleware for different endpoint types
 */

// Public endpoint - No authentication required, but includes rate limiting and security headers
export function publicEndpoint(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>,
  maxRequests = 60,
) {
  return withSecurityHeaders(
    withRateLimit(withErrorHandling(handler), maxRequests),
  );
}

// Authenticated endpoint - Requires valid user authentication
export function authenticatedEndpoint(
  handler: (req: AuthenticatedRequest, params?: any) => Promise<NextResponse>,
  maxRequests = 30,
) {
  return withSecurityHeaders(withRateLimit(withAuth(handler), maxRequests));
}

// Optional authentication endpoint - Works with or without authentication
export function optionalAuthEndpoint(
  handler: (req: AuthenticatedRequest, params?: any) => Promise<NextResponse>,
  maxRequests = 40,
) {
  return withSecurityHeaders(
    withRateLimit(withOptionalAuth(handler), maxRequests),
  );
}

// AI endpoint - Higher rate limiting protection for expensive AI operations
export function aiEndpoint(
  handler: (req: AuthenticatedRequest, params?: any) => Promise<NextResponse>,
  maxRequests = 10,
) {
  return withSecurityHeaders(
    withRateLimit(withOptionalAuth(handler), maxRequests),
  );
}
