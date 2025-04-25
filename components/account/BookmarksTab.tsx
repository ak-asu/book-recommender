import { useState, useEffect } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";

import BookList from "../book/BookList";

import { bookmarkService } from "@/services/bookmarkService";
import { useToast } from "@/hooks/useToast";

interface BookmarksTabProps {
  userId: string;
}

const BookmarksTab: React.FC<BookmarksTabProps> = ({ userId }) => {
  interface Book {
    id: string;
    image: string;
    title: string;
    author: string;
    publicationDate?: string;
    rating: number;
    reviewCount?: number;
    description: string;
    genres?: string[];
  }

  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setLoading(true);
        const data = await bookmarkService.getBookmarks();
        setBookmarks(data);
      } catch {
        toast({
          title: "Load Bookmarks Error",
          description: "Failed to load your bookmarks.",
          variant: "destructive",
        });
        setError("Failed to load your bookmarks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  const handleRemoveBookmark = async (bookId: string) => {
    try {
      await bookmarkService.removeBookmark(bookId);
      setBookmarks((prev) => prev.filter((book) => book.id !== bookId));
      toast({
        title: "Bookmark Removed",
        description: "Book removed from bookmarks.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Remove Bookmark Error",
        description: "Failed to remove bookmark.",
        variant: "destructive",
      });
      setError("Failed to remove bookmark. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Loading your bookmarks..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardBody className="py-8 text-center">
          <p className="text-danger">{error}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Your Bookmarked Books</h2>
      {bookmarks.length > 0 ? (
        <BookList books={bookmarks} onBookmark={handleRemoveBookmark} />
      ) : (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-default-500">
              You haven&apos;t bookmarked any books yet.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default BookmarksTab;
