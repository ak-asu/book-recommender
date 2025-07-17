import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import { Book, SearchFilters } from "@/types";
import { bookService } from "@/services/booksService";
import { feedbackService, FeedbackType } from "@/services/feedbackService";
import { RootState } from "@/store";

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );

  // Fetch popular books on initial load
  useEffect(() => {
    async function fetchPopularBooks() {
      try {
        setLoading(true);
        setError(null);
        const response = await bookService.getPopularBooks();
        setRecommendations(response.data || []);
      } catch (err) {
        setError("Failed to fetch popular books");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPopularBooks();
  }, []);

  // Search books with query and filters
  const searchBooks = async (query: string, filters?: SearchFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookService.searchBooks(query, filters);
      setRecommendations(response.data || []);
    } catch (err) {
      setError("Failed to search books");
      toast.error("Failed to search books. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit feedback for a book
  const submitFeedback = async (bookId: string, type: FeedbackType) => {
    try {
      const userId = isAuthenticated && user ? user.id : undefined;
      await feedbackService.submitFeedback(bookId, type, userId);

      // Show appropriate toast based on feedback type
      switch (type) {
        case FeedbackType.LIKE:
          toast.success("Thanks for your feedback!");
          break;
        case FeedbackType.DISLIKE:
          toast.info("We'll improve our recommendations for you.");
          break;
        case FeedbackType.REGENERATE:
          toast.info("Generating new recommendations...");
          // If user clicked regenerate, we would typically fetch new recommendations here
          break;
      }
    } catch (err) {
      toast.error("Failed to submit feedback");
      console.error(err);
    }
  };

  // Regenerate recommendations
  const regenerateRecommendations = async (
    query: string,
    filters?: SearchFilters,
  ) => {
    try {
      setLoading(true);
      setError(null);
      // In a real application, we would send data about past recommendations to avoid showing the same books
      const response = await bookService.searchBooks(query, filters);
      setRecommendations(response.data || []);
      toast.success("Recommendations refreshed!");
    } catch (err) {
      setError("Failed to regenerate recommendations");
      toast.error("Failed to refresh recommendations. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    recommendations,
    loading,
    error,
    searchBooks,
    submitFeedback,
    regenerateRecommendations,
  };
};
