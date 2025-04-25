import { useState, useEffect } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";

import BookList from "../book/BookList";

import { bookmarkService } from "@/services/bookmarkService";
import { useToast } from "@/hooks/useToast";

interface FavoritesTabProps {
  userId: string;
}

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

const FavoritesTab: React.FC<FavoritesTabProps> = ({ userId }) => {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        const data = await bookmarkService.getFavorites();

        setFavorites(data);
      } catch (err: any) {
        toast({
          title: "Load Favorites Error",
          description: err.message || "Failed to load your favorites.",
          variant: "destructive",
        });
        setError("Failed to load your favorites. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (bookId: string) => {
    try {
      await bookmarkService.removeFavorite(bookId);
      // Update the local state to remove the book
      setFavorites((prevFavorites) =>
        prevFavorites.filter((book: any) => book.id !== bookId),
      );
      toast({
        title: "Favorite Removed",
        description: "Book removed from favorites.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Remove Favorite Error",
        description: err.message || "Failed to remove from favorites.",
        variant: "destructive",
      });
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
              You haven&#39;t added any books to your favorites yet.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default FavoritesTab;
