import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import BookCard from "./BookCard";

import { RootState } from "@/store";
import { searchBooks } from "@/store/slices/booksSlice";
import { mockBooks } from "@/constants/mockData";
import { useRecommendations } from "@/hooks/useRecommendations";
import { FeedbackType } from "@/services/feedbackService";

const BookList = () => {
  const dispatch = useDispatch();
  const { results, loading, error, query } = useSelector(
    (state: RootState) => state.books,
  );
  const { submitFeedback, regenerateRecommendations } = useRecommendations();

  useEffect(() => {
    if (!results.length && !query) {
      // Load popular books on initial load
      dispatch(searchBooks({ query: "" }));
    }
  }, [dispatch, results.length, query]);

  const handleBookFeedback = async (bookId: string, type: FeedbackType) => {
    await submitFeedback(bookId, type);

    // If user requests regeneration, get new recommendations
    if (type === FeedbackType.REGENERATE) {
      await regenerateRecommendations(query || "");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="book-card animate-pulse">
              <div className="bg-booktrack-lightgray aspect-[2/3] rounded-lg" />
              <div className="p-4">
                <div className="h-6 bg-booktrack-lightgray rounded w-3/4 mb-2" />
                <div className="h-4 bg-booktrack-lightgray rounded w-1/2 mb-4" />
                <div className="h-4 bg-booktrack-lightgray rounded w-1/4 mb-2" />
                <div className="h-20 bg-booktrack-lightgray rounded w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const booksToDisplay = results.length ? results : mockBooks;

  return (
    <div className="container mx-auto py-6">
      {query && (
        <h2 className="text-2xl mb-6 text-white">
          Search results for:{" "}
          <span className="text-booktrack-gold">{query}</span>
        </h2>
      )}
      {!query && (
        <h2 className="text-2xl mb-6 text-white">
          What fellow readers are{" "}
          <span className="text-booktrack-gold">enjoying</span>
        </h2>
      )}

      {booksToDisplay.length === 0 ? (
        <p className="text-center text-gray-400 py-10">
          No books found matching your criteria.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {booksToDisplay.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              showFeedback={true}
              onFeedback={handleBookFeedback}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookList;
