import { useState, useEffect } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";

import BookList from "../book/BookList";

import { getUserBookmarks, removeBookmark } from "@/services/userService";

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

  const [bookmarks, setBookmarks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setLoading(true);
        const data = await getUserBookmarks(userId);
        setBookmarks(data);
      } catch {
        setError("Failed to load your bookmarks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [userId]);

  const handleRemoveBookmark = async (bookId: string) => {
    try {
      await removeBookmark(userId, bookId);
      // Update the local state to remove the book
      setBookmarks((prevBookmarks) =>
        prevBookmarks.filter((book: any) => book.id !== bookId),
      );
    } catch {
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
