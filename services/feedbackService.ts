import { api } from "./api";

export enum FeedbackType {
  LIKE = "like",
  DISLIKE = "dislike",
  REGENERATE = "regenerate",
}

export const feedbackService = {
  // Submit user feedback on a book
  submitFeedback: async (
    bookId: string,
    type: FeedbackType,
    userId?: string,
  ) => {
    return api.post("/feedback", {
      bookId,
      type,
      userId,
      timestamp: Date.now(),
    });
  },

  // Get user preferences based on their feedback history
  getUserPreferences: async (userId: string) => {
    return api.get(`/users/${userId}/preferences`);
  },

  // Update user preferences manually
  updateUserPreferences: async (
    userId: string,
    preferences: Record<string, any>,
  ) => {
    return api.put(`/users/${userId}/preferences`, preferences);
  },
};
