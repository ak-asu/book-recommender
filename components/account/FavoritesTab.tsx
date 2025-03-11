import { useState, useEffect } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";

import BookList from "../book/BookList";
import {
  getUserFavorites,
  removeFromFavorites,
} from "../../services/userService";

interface FavoritesTabProps {
  userId: string;
}

const FavoritesTab: React.FC<FavoritesTabProps> = ({ userId }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        const data = await getUserFavorites(userId);

        setFavorites(data);
      } catch (err) {
        console.error("Error loading favorites:", err);
        setError("Failed to load your favorites. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [userId]);

  const handleRemoveFavorite = async (bookId: string) => {
    try {
      await removeFromFavorites(userId, bookId);
      // Update the local state to remove the book
      setFavorites((prevFavorites) =>
        prevFavorites.filter((book: any) => book.id !== bookId),
      );
    } catch (err) {
      console.error("Error removing favorite:", err);
      setError("Failed to remove from favorites. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Loading your favorites..." size="lg" />
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
      <h2 className="text-xl font-bold mb-4">Your Favorite Books</h2>

      {favorites.length > 0 ? (
        <BookList books={favorites} onBookmark={handleRemoveFavorite} />
      ) : (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-default-500">
              You haven't added any books to your favorites yet.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default FavoritesTab;
