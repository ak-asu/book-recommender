import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { useRouter } from "next/navigation";

import BookList from "../book/BookList";
import { useAuth } from "../../hooks/useAuth";

import { useToast } from "@/hooks/useToast";
import { bookService } from "@/services/booksService";
import { bookmarkService } from "@/services/bookmarkService";

interface Book {
  id: string;
  image: string;
  title: string;
  author: string;
  rating: number;
  description: string;
  publicationDate?: string;
  reviewCount?: number;
  genres?: string[];
}

const PopularBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadPopularBooks = async () => {
      try {
        setLoading(true);
        const popularBooks = await bookService.getPopularBooks();

        setBooks(popularBooks);
      } catch (err: any) {
        toast({
          title: "Load Popular Books Error",
          description: err.message || "Failed to load popular books.",
          variant: "destructive",
        });
        setError("Failed to load popular books. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadPopularBooks();
  }, []);

  const handleBookmark = async (bookId: string) => {
    if (!isAuthenticated) {
      router.push(
        "/login?redirect=" + encodeURIComponent(window.location.pathname),
      );
      return;
    }

    try {
      await bookmarkService.addBookmark(bookId);
      toast({
        title: "Bookmarked",
        description: "Book added to bookmarks.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Bookmark Error",
        description: err.message || "Failed to bookmark book.",
        variant: "destructive",
      });
      setError("Failed to bookmark book. Please try again later.");
    }
  };

  if (error) {
    return (
      <Card className="mt-8">
        <CardBody className="py-8 text-center">
          <p className="text-danger">{error}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader className="px-4 pb-0 pt-4 flex-col items-start">
          <h2 className="text-xl font-bold">Popular Recommendations</h2>
          <p className="text-small text-default-500">
            Trending books that readers are enjoying right now
          </p>
        </CardHeader>
        <CardBody className="overflow-visible">
          <BookList
            books={books}
            isLoading={loading}
            onBookmark={handleBookmark}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default PopularBooks;
