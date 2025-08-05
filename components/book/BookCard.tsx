import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BookMarked, Star } from "lucide-react";
import { toast } from "sonner";

import BookFeedback from "./BookFeedback";

import { Book } from "@/types";
import { RootState } from "@/store";
import { toggleBookmark, toggleFavorite } from "@/store/slices/bookmarkSlice";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { FeedbackType } from "@/services/feedbackService";

interface BookCardProps {
  book: Book;
  onFeedback?: (bookId: string, type: FeedbackType) => Promise<void>;
  showFeedback?: boolean;
}

const BookCard = ({ book, onFeedback, showFeedback = true }: BookCardProps) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const bookmarks = useSelector(
    (state: RootState) => state.bookmark.bookmarked,
  );
  const favorites = useSelector((state: RootState) => state.bookmark.favorites);

  const isBookmarked = bookmarks.some((b) => b.id === book.id);
  const isFavorite = favorites.some((b) => b.id === book.id);

  const handleBookmark = () => {
    if (!isAuthenticated) {
      toast.error("Please login to bookmark books");
      return;
    }

    dispatch(toggleBookmark(book));
    toast.success(
      isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
    );
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Please login to favorite books");
      return;
    }

    dispatch(toggleFavorite(book));
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleFeedback = async (bookId: string, type: FeedbackType) => {
    if (onFeedback) {
      await onFeedback(bookId, type);
    }
  };

  return (
    <div className="book-card flex flex-col h-full">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          alt={`${book.title} cover`}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          src={book.coverImage}
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <Button
            className={`rounded-full bg-booktrack-darkgray/80 hover:bg-booktrack-darkgray ${isBookmarked ? "text-booktrack-gold" : "text-white"}`}
            size="icon"
            variant="ghost"
            onClick={handleBookmark}
          >
            <BookMarked className="h-5 w-5" />
          </Button>
          <Button
            className={`rounded-full bg-booktrack-darkgray/80 hover:bg-booktrack-darkgray ${isFavorite ? "text-booktrack-gold" : "text-white"}`}
            size="icon"
            variant="ghost"
            onClick={handleFavorite}
          >
            <Star className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold mb-1 text-white">
          <Link
            className="hover:text-booktrack-gold transition-colors"
            to={`/book/${book.id}`}
          >
            {book.title}
          </Link>
        </h3>
        <p className="text-gray-400 text-sm mb-2">{book.author}</p>
        <div className="flex items-center mb-2">
          <div className="flex text-booktrack-gold mr-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>{i < Math.floor(book.rating) ? "★" : "☆"}</span>
            ))}
          </div>
          <span className="text-gray-400 text-sm">
            {book.rating} ({book.reviewCount})
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {book.genre.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-xs px-2 py-1 rounded-full bg-booktrack-lightgray text-white"
            >
              {genre}
            </span>
          ))}
          {book.genre.length > 2 && (
            <span className="text-xs px-2 py-1 rounded-full bg-booktrack-lightgray text-white">
              +{book.genre.length - 2}
            </span>
          )}
        </div>
        <p className="text-gray-300 text-sm line-clamp-3 mb-4">
          {book.description}
        </p>

        {showFeedback && onFeedback && (
          <BookFeedback bookId={book.id} onFeedback={handleFeedback} />
        )}

        <div className="mt-auto">
          <Link to={`/book/${book.id}`}>
            <Button
              className="w-full border-booktrack-gold text-booktrack-gold hover:bg-booktrack-gold hover:text-booktrack-dark"
              variant="outline"
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
