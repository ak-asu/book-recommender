import { v4 as uuidv4 } from "uuid";

// Store CSRF token in memory for SPA usage
let csrfToken: string | null = null;

// Generate a new CSRF token
export function generateCsrfToken(): string {
  csrfToken = uuidv4();
  // In a real-world app, you might store this in a secure cookie
  if (typeof window !== "undefined") {
    document.cookie = `XSRF-TOKEN=${csrfToken}; path=/; SameSite=Strict; secure`;
  }
  return csrfToken;
}

// Get the current CSRF token or generate a new one
export function getCsrfToken(): string {
  if (!csrfToken) {
    generateCsrfToken();
  }
  return csrfToken as string;
}

// Add CSRF token to a request
export function addCsrfToken(options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      ...options.headers,
      "X-CSRF-TOKEN": getCsrfToken(),
    },
  };
}

// Verify CSRF token on the server side
export function verifyCsrfToken(requestToken: string | null): boolean {
  if (!requestToken || !csrfToken) {
    return false;
  }
  return requestToken === csrfToken;
}
