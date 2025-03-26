import { NextResponse, NextRequest } from "next/server";

interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives?: {
      defaultSrc?: string[];
      scriptSrc?: string[];
      styleSrc?: string[];
      imgSrc?: string[];
      connectSrc?: string[];
      fontSrc?: string[];
      objectSrc?: string[];
      mediaSrc?: string[];
      frameSrc?: string[];
      childSrc?: string[];
      workerSrc?: string[];
      formAction?: string[];
      baseUri?: string[];
      manifestSrc?: string[];
      upgradeInsecureRequests?: boolean;
    };
  };
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  strictTransportSecurity?: string;
}

// Default security headers configuration
const defaultConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://*"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  strictTransportSecurity: "max-age=31536000; includeSubDomains",
  permissionsPolicy: "camera=(), microphone=(), geolocation=()",
};

// Add security headers to the response
export function addSecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = defaultConfig,
): NextResponse {
  // Content Security Policy
  if (config.contentSecurityPolicy?.directives) {
    const directives = config.contentSecurityPolicy.directives;
    const cspHeader = Object.entries(directives)
      .map(([key, values]) => {
        if (key === "upgradeInsecureRequests" && values === true) {
          return "upgrade-insecure-requests";
        }
        // Convert camelCase to kebab-case and join values
        const directive = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        return values
          ? `${directive} ${Array.isArray(values) ? values.join(" ") : values}`
          : "";
      })
      .filter(Boolean)
      .join("; ");
    if (cspHeader) {
      response.headers.set("Content-Security-Policy", cspHeader);
    }
  }
  // Set other security headers
  if (config.xFrameOptions) {
    response.headers.set("X-Frame-Options", config.xFrameOptions);
  }
  if (config.xContentTypeOptions) {
    response.headers.set("X-Content-Type-Options", config.xContentTypeOptions);
  }
  if (config.referrerPolicy) {
    response.headers.set("Referrer-Policy", config.referrerPolicy);
  }
  if (config.permissionsPolicy) {
    response.headers.set("Permissions-Policy", config.permissionsPolicy);
  }
  if (config.strictTransportSecurity) {
    response.headers.set(
      "Strict-Transport-Security",
      config.strictTransportSecurity,
    );
  }
  return response;
}

// CORS middleware
export function corsMiddleware(
  req: NextRequest,
  allowedOrigins: string[] = ["*"],
  allowedMethods: string[] = ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: string[] = ["Content-Type", "Authorization"],
): NextResponse | null {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    // Set CORS headers
    const origin = req.headers.get("origin") || "";
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin || "*");
    }
    response.headers.set(
      "Access-Control-Allow-Methods",
      allowedMethods.join(", "),
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      allowedHeaders.join(", "),
    );
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
    return addSecurityHeaders(response);
  }
  // For normal requests, we'll add CORS headers to the actual response
  return null;
}

// Middleware to add common security headers to API responses
export function withSecurityHeaders(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>,
) {
  return async (req: NextRequest, params?: any): Promise<NextResponse> => {
    // Check if this is a CORS preflight request
    const corsResponse = corsMiddleware(req);
    if (corsResponse) {
      return corsResponse;
    }
    try {
      // Process the request normally
      const response = await handler(req, params);
      // Add CORS headers to the response
      const origin = req.headers.get("origin") || "";
      if (origin) {
        response.headers.set("Access-Control-Allow-Origin", origin);
      } else {
        response.headers.set("Access-Control-Allow-Origin", "*");
      }
      // Add security headers
      return addSecurityHeaders(response);
    } catch {
      // Handle errors that might occur during handler execution
      const errorResponse = NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
      // Add security headers even to error responses
      return addSecurityHeaders(errorResponse);
    }
  };
}
