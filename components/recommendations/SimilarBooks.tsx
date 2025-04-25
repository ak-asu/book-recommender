import { useState, useEffect } from "react";
import { Spinner, Button } from "@heroui/react";

import BookList from "../book/BookList";

import { bookService } from "@/services/booksService";
import { useToast } from "@/hooks/useToast";

interface SimilarBooksProps {
  bookId: string;
  genres: string[];
}

const SimilarBooks: React.FC<SimilarBooksProps> = ({ bookId, genres }) => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadSimilarBooks = async () => {
      try {
        setLoading(true);
        const similarBooks = await bookService.getSimilarBooks(bookId);

        setBooks(similarBooks);
      } catch (err: any) {
        toast({
          title: "Load Similar Books Error",
          description: err.message || "Failed to load similar books.",
          variant: "destructive",
        });
        setError("Failed to load similar books. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadSimilarBooks();
  }, [bookId, genres, toast]);

  const handleRefreshRecommendations = async () => {
    try {
      setLoading(true);
      const newRecommendations = await bookService.getSimilarBooks(bookId);

      setBooks(newRecommendations);
    } catch (err: any) {
      toast({
        title: "Refresh Similar Books Error",
        description: err.message || "Failed to refresh recommendations.",
        variant: "destructive",
      });
      setError("Failed to refresh recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner label="Finding similar books..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-danger mb-4">{error}</p>
        <Button
          color="primary"
          onPress={() => {
            setError(null);
            handleRefreshRecommendations();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-default-600">
          Based on genre, writing style, and themes
        </p>
        <Button
          color="primary"
          size="sm"
          variant="flat"
          onPress={handleRefreshRecommendations}
        >
          Refresh Recommendations
        </Button>
      </div>

      <BookList books={books} isLoading={loading} />
    </div>
  );
};

export default SimilarBooks;
