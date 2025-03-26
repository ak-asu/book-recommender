import { z } from "zod";
import { NextRequest } from "next/server";

import { errorResponse } from "./response";

// Validates request body against a Zod schema
export async function validateBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>,
): Promise<{ data: T | null; error: Response | null }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      return {
        data: null,
        error: errorResponse(`Validation error: ${formattedErrors}`, 400),
      };
    }
    return {
      data: result.data,
      error: null,
    };
  } catch {
    return {
      data: null,
      error: errorResponse("Invalid JSON in request body", 400),
    };
  }
}

// Validates URL query parameters against a Zod schema
export function validateQuery<T>(
  req: NextRequest,
  schema: z.ZodType<T>,
): { data: T | null; error: Response | null } {
  try {
    const { searchParams } = new URL(req.url);
    // Convert URLSearchParams to plain object
    const queryObj: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      if (queryObj[key]) {
        if (Array.isArray(queryObj[key])) {
          (queryObj[key] as string[]).push(value);
        } else {
          queryObj[key] = [queryObj[key] as string, value];
        }
      } else {
        queryObj[key] = value;
      }
    });
    const result = schema.safeParse(queryObj);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      return {
        data: null,
        error: errorResponse(`Query validation error: ${formattedErrors}`, 400),
      };
    }
    return {
      data: result.data,
      error: null,
    };
  } catch {
    return {
      data: null,
      error: errorResponse("Invalid query parameters", 400),
    };
  }
}

// Format Zod validation errors into a readable string
function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join(".");
      return `${path ? `${path}: ` : ""}${err.message}`;
    })
    .join("; ");
}

// Common reusable schemas
export const schemas = {
  user: {
    login: z.object({
      email: z.string().email("Invalid email format"),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
    }),
    register: z.object({
      email: z.string().email("Invalid email format"),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
      displayName: z
        .string()
        .min(2, "Display name must be at least 2 characters long"),
    }),
    resetPassword: z.object({
      email: z.string().email("Invalid email format"),
    }),
    preferences: z.object({
      favoriteGenres: z.array(z.string()).optional(),
      preferredLength: z.enum(["short", "medium", "long"]).optional(),
      preferredMoods: z.array(z.string()).optional(),
      darkMode: z.boolean().optional(),
      notificationsEnabled: z.boolean().optional(),
    }),
  },
  book: {
    review: z.object({
      bookId: z.string().min(1, "Book ID is required"),
      rating: z.number().min(1).max(5),
      text: z.string().min(3, "Review text must be at least 3 characters long"),
    }),
    collection: z.object({
      bookId: z.string().min(1, "Book ID is required"),
      collectionType: z.enum(["bookmarks", "favorites", "savedForLater"]),
    }),
    search: z.object({
      q: z.string().optional(),
      genre: z.string().optional(),
      minRating: z.coerce.number().optional(),
      maxPages: z.coerce.number().optional(),
      sortBy: z.enum(["rating", "newest", "title"]).optional(),
      cursor: z.string().optional(),
      limit: z.coerce.number().optional(),
    }),
    feedback: z.object({
      bookId: z.string().min(1, "Book ID is required"),
      liked: z.boolean(),
    }),
  },
  chat: {
    message: z.object({
      message: z.string().min(1, "Message is required"),
      sessionId: z.string().optional(),
      regenerate: z.boolean().optional(),
      options: z
        .object({
          genre: z.string().optional(),
          length: z.enum(["short", "medium", "long"]).optional(),
          mood: z.string().optional(),
        })
        .optional(),
    }),
    export: z.object({
      sessionId: z.string().optional(),
      format: z.enum(["json", "text"]).optional(),
    }),
    share: z.object({
      sessionId: z.string().min(1, "Session ID is required"),
    }),
  },
  search: z.object({
    query: z.string().min(3, "Search query must be at least 3 characters long"),
    options: z
      .object({
        genre: z.string().optional(),
        length: z.enum(["short", "medium", "long"]).optional(),
        mood: z.string().optional(),
        userPreferences: z.any().optional(),
      })
      .optional(),
    regenerate: z.boolean().optional(),
  }),
};
