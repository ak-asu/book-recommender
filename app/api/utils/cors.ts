import { NextResponse, NextRequest } from "next/server";

interface CorsOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
}

const defaultOptions: CorsOptions = {
  allowedOrigins: ["*"],
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-TOKEN"],
  exposedHeaders: [
    "X-Total-Count",
    "X-Rate-Limit-Limit",
    "X-Rate-Limit-Remaining",
  ],
  maxAge: 86400, // 24 hours
  credentials: true,
};

// CORS middleware for API routes
export function handleCors(
  req: NextRequest,
  options: CorsOptions = defaultOptions,
): NextResponse | null {
  const {
    allowedOrigins = defaultOptions.allowedOrigins,
    allowedMethods = defaultOptions.allowedMethods,
    allowedHeaders = defaultOptions.allowedHeaders,
    exposedHeaders = defaultOptions.exposedHeaders,
    maxAge = defaultOptions.maxAge,
    credentials = defaultOptions.credentials,
  } = options;
  // Get origin from request
  const origin = req.headers.get("origin") || "";
  // Check if origin is allowed
  const isOriginAllowed =
    allowedOrigins?.includes("*") || allowedOrigins?.includes(origin);
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    // Set CORS headers
    if (isOriginAllowed) {
      response.headers.set("Access-Control-Allow-Origin", origin || "*");
    }
    if (credentials) {
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    response.headers.set(
      "Access-Control-Allow-Methods",
      (allowedMethods ?? []).join(", "),
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      (allowedHeaders ?? []).join(", "),
    );

    if ((exposedHeaders ?? []).length > 0) {
      response.headers.set(
        "Access-Control-Expose-Headers",
        (exposedHeaders ?? []).join(", "),
      );
    }
    response.headers.set("Access-Control-Max-Age", maxAge?.toString() ?? "0");
    return response;
  }
  return null;
}

// Add CORS headers to a response
export function addCorsHeaders(
  response: NextResponse,
  req: NextRequest,
  options: CorsOptions = defaultOptions,
): NextResponse {
  const {
    allowedOrigins = defaultOptions.allowedOrigins,
    exposedHeaders = defaultOptions.exposedHeaders,
    credentials = defaultOptions.credentials,
  } = options;
  // Get origin from request
  const origin = req.headers.get("origin") || "";
  // Check if origin is allowed
  const isOriginAllowed =
    allowedOrigins?.includes("*") || allowedOrigins?.includes(origin);
  // Set CORS headers
  if (isOriginAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*");
  }
  if (credentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  if ((exposedHeaders ?? []).length > 0) {
    response.headers.set(
      "Access-Control-Expose-Headers",
      (exposedHeaders ?? []).join(", "),
    );
  }
  return response;
}
