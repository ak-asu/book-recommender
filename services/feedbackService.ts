import { userApi } from "./apiService";
import { withErrorHandling } from "./errorService";
import * as storageService from "./storageService";

import { ErrorCategory } from "@/lib/errorHandler";

// Record user feedback (like/dislike)
export const recordFeedback = withErrorHandling(
  async (bookId: string, liked: boolean): Promise<void> => {
    const token = storageService.getUserAuth();
    // For guest users, we can't store preferences, so ignore
    if (!token) {
      return;
    }
    await userApi.submitFeedback(bookId, liked);
  },
  ErrorCategory.USER,
);

// Store temporary feedback for the session
const sessionFeedback = new Map<
  string,
  { liked: boolean; timestamp: number }
>();

// Record temporary feedback for the current session (useful for guests)
export const recordSessionFeedback = (bookId: string, liked: boolean): void => {
  sessionFeedback.set(bookId, { liked, timestamp: Date.now() });
};

// Check if a book has been liked in the current session
export const hasSessionFeedback = (bookId: string): { liked?: boolean } => {
  const feedback = sessionFeedback.get(bookId);
  if (!feedback) return {};
  return { liked: feedback.liked };
};

export const clearSessionFeedback = (): void => {
  sessionFeedback.clear();
};
