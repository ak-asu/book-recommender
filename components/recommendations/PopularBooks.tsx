import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@heroui/react";

import BookList from "../book/BookList";
import { getPopularBooks } from "../../services/bookService";
import { addBookmark } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";

const PopularBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadPopularBooks = async () => {
      try {
        setLoading(true);
        const popularBooks = await getPopularBooks(12);

        setBooks(popularBooks);
      } catch (err) {
        console.error("Error loading popular books:", err);
        setError("Failed to load popular books. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadPopularBooks();
  }, []);

  const handleBookmark = async (bookId: string) => {
    if (!isAuthenticated || !user) return;

    try {
      await addBookmark(user.uid, bookId);
    } catch (err) {
      console.error("Error bookmarking book:", err);
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
