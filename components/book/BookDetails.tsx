import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BookMarked, Share, Star, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { RootState } from "@/store";
import { fetchBookById } from "@/store/slices/booksSlice";
import {
  toggleBookmark,
  toggleFavorite,
  toggleSaveForLater,
} from "@/store/slices/bookmarkSlice";
import { Button } from "@heroui/button";
import { useAuth } from "@/hooks/useAuth";
import { mockBooks } from "@/constants/mockData";
import { Book } from "@/types";

const BookDetails = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const bookmarks = useSelector(
    (state: RootState) => state.bookmark.bookmarked,
  );
  const favorites = useSelector((state: RootState) => state.bookmark.favorites);
  const savedForLater = useSelector(
    (state: RootState) => state.bookmark.savedForLater,
  );

  // Since we're using mock data, we'll just find the book directly from our mock data
  const book = mockBooks.find((book) => book.id === id);

  const isBookmarked = bookmarks.some((b) => b.id === id);
  const isFavorite = favorites.some((b) => b.id === id);
  const isSavedForLater = savedForLater.some((b) => b.id === id);

  // Get similar books based on genre
  const similarBooks = book
    ? mockBooks
        .filter(
          (b) =>
            b.id !== book.id && b.genre.some((g) => book.genre.includes(g)),
        )
        .slice(0, 3)
    : [];

  useEffect(() => {
    if (id) {
      dispatch(fetchBookById(id));
    }
  }, [dispatch, id]);

  if (!book) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p className="text-red-500">Book not found</p>
        <Link
          className="text-booktrack-gold hover:underline mt-4 inline-block"
          to="/"
        >
          Back to Home
        </Link>
      </div>
    );
  }

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

  const handleSaveForLater = () => {
    if (!isAuthenticated) {
      toast.error("Please login to save books");
      return;
    }

    dispatch(toggleSaveForLater(book));
    toast.success(isSavedForLater ? "Removed from saved" : "Saved for later");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const renderBookCard = (book: Book) => (
    <Link key={book.id} className="book-card" to={`/book/${book.id}`}>
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          alt={`${book.title} cover`}
          className="w-full h-full object-cover"
          src={book.coverImage}
        />
      </div>
      <div className="p-2">
        <h4 className="text-sm font-semibold text-white truncate">
          {book.title}
        </h4>
        <p className="text-xs text-gray-400">{book.author}</p>
      </div>
    </Link>
  );

  return (
    <div className="container mx-auto py-8">
      <Link
        className="flex items-center text-booktrack-gold mb-6 hover:underline"
        to="/"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Book Cover */}
        <div className="lg:col-span-1">
          <div className="aspect-[2/3] overflow-hidden rounded-lg">
            <img
              alt={`${book.title} cover`}
              className="w-full h-full object-cover"
              src={book.coverImage}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button
              className={`flex flex-col items-center justify-center p-2 h-auto ${isBookmarked ? "bg-booktrack-gold text-booktrack-dark" : "bg-booktrack-darkgray"}`}
              onClick={handleBookmark}
            >
              <BookMarked className="h-5 w-5 mb-1" />
              <span className="text-xs">Bookmark</span>
            </Button>

            <Button
              className={`flex flex-col items-center justify-center p-2 h-auto ${isFavorite ? "bg-booktrack-gold text-booktrack-dark" : "bg-booktrack-darkgray"}`}
              onClick={handleFavorite}
            >
              <Star className="h-5 w-5 mb-1" />
              <span className="text-xs">Favorite</span>
            </Button>

            <Button
              className={`flex flex-col items-center justify-center p-2 h-auto ${isSavedForLater ? "bg-booktrack-gold text-booktrack-dark" : "bg-booktrack-darkgray"}`}
              onClick={handleSaveForLater}
            >
              <Clock className="h-5 w-5 mb-1" />
              <span className="text-xs">Save</span>
            </Button>
          </div>

          <Button
            className="w-full mt-2 bg-booktrack-darkgray hover:bg-booktrack-lightgray"
            onClick={handleShare}
          >
            <Share className="h-5 w-5 mr-2" />
            Share
          </Button>
        </div>

        {/* Right Column - Book Details */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-white mb-2">{book.title}</h1>
          <p className="text-xl text-gray-300 mb-4">by {book.author}</p>

          <div className="flex items-center mb-4">
            <div className="flex text-booktrack-gold mr-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>{i < Math.floor(book.rating) ? "★" : "☆"}</span>
              ))}
            </div>
            <span className="text-gray-400">
              {book.rating} ({book.reviewCount} reviews)
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {book.genre.map((genre) => (
              <span
                key={genre}
                className="text-sm px-3 py-1 rounded-full bg-booktrack-lightgray text-white"
              >
                {genre}
              </span>
            ))}
          </div>

          {book.series && (
            <div className="mb-4 p-3 bg-booktrack-darkgray rounded-lg">
              <p className="text-gray-300">
                <span className="text-booktrack-gold">Series:</span>{" "}
                {book.series.name} (Book {book.series.position})
              </p>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">
              About this book
            </h2>
            <p className="text-gray-300 leading-relaxed">{book.description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-booktrack-darkgray p-3 rounded-lg">
              <p className="text-sm text-gray-400">Pages</p>
              <p className="text-xl text-white">{book.pages}</p>
            </div>
            <div className="bg-booktrack-darkgray p-3 rounded-lg">
              <p className="text-sm text-gray-400">Published</p>
              <p className="text-xl text-white">
                {book.publishedDate
                  ? new Date(book.publishedDate).getFullYear()
                  : "Unknown"}
              </p>
            </div>
            <div className="bg-booktrack-darkgray p-3 rounded-lg">
              <p className="text-sm text-gray-400">Rating</p>
              <p className="text-xl text-white">{book.rating} / 5</p>
            </div>
            <div className="bg-booktrack-darkgray p-3 rounded-lg">
              <p className="text-sm text-gray-400">Reviews</p>
              <p className="text-xl text-white">{book.reviewCount}</p>
            </div>
          </div>

          {book.tags && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {book.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-booktrack-darkgray text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {book.readLinks && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Where to read
              </h3>
              <div className="flex flex-wrap gap-2">
                {book.readLinks.map((link) => (
                  <a
                    key={link.name}
                    className="px-4 py-2 bg-booktrack-darkgray rounded-lg text-white hover:bg-booktrack-lightgray transition-colors"
                    href={link.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {similarBooks.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Similar books you might enjoy
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {similarBooks.map((book) => renderBookCard(book))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
