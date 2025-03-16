import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardBody,
  Spinner,
  Divider,
  Button,
  Chip,
  Tooltip,
  Badge,
} from "@heroui/react";

import { BookmarkIcon, HeartIcon, ShareIcon } from "../icons";
import { getBookById } from "../../services/bookService";
import { addBookmark, addToFavorites } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import SimilarBooks from "../recommendations/SimilarBooks";
import Rating from "../ui/Rating";
import ErrorMessage from "../ui/ErrorMessage";

import BookExternalLinks from "./BookExternalLinks";
import ReviewSection from "./ReviewSection";

interface BookData {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  synopsis: string;
  genres: string[];
  rating: number;
  reviewCount: number;
  ranking?: number;
  pageCount: number;
  publicationDate: string;
  publisher: string;
  series?: {
    name: string;
    volume: number;
  };
}

interface BookDetailsProps {
  bookId: string;
}

const BookDetails = ({ bookId }: BookDetailsProps) => {
  const router = useRouter();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [favorited, setFavorited] = useState<boolean>(false);
  const { user, isAuthenticated } = useAuth();

  // Fetch book details
  useEffect(() => {
    if (!bookId) return;

    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        const bookData = await getBookById(bookId);

        setBook(bookData);

        // Check if user has bookmarked/favorited this book
        if (isAuthenticated && user) {
          // These would be functions that check user data in Firebase
          // setBookmarked(await isBookmarked(user.uid, bookId));
          // setFavorited(await isFavorited(user.uid, bookId));
        }
      } catch (err) {
        console.error("Error fetching book details:", err);
        setError("Failed to load book details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId, isAuthenticated, user]);

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      await addBookmark(user?.uid as string, bookId);
      setBookmarked(!bookmarked);
    } catch (err) {
      console.error("Error bookmarking book:", err);
      setError("Failed to bookmark book. Please try again.");
    }
  };

  const handleAddToFavorites = async () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      await addToFavorites(user?.uid as string, bookId);
      setFavorited(!favorited);
    } catch (err) {
      console.error("Error adding to favorites:", err);
      setError("Failed to add book to favorites. Please try again.");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: book?.title || "Book recommendation",
          text: `Check out ${book?.title} by ${book?.author}`,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      // Show a toast notification (you'd need to implement this)
      // showToast("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner label="Loading book details..." size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!book) {
    return <ErrorMessage message="Book not found" />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <Card className="mb-8">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Book cover */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-full max-w-xs h-80 md:h-96 shadow-lg rounded-lg overflow-hidden">
                <Image
                  fill
                  priority
                  alt={`${book.title} cover`}
                  src={book.coverImage || "/images/placeholder-book.png"}
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className="flex justify-center space-x-4 w-full">
                <Tooltip
                  content={bookmarked ? "Remove bookmark" : "Add bookmark"}
                >
                  <Button
                    isIconOnly
                    aria-label="Bookmark book"
                    color="primary"
                    variant={bookmarked ? "solid" : "bordered"}
                    onClick={handleBookmark}
                  >
                    <BookmarkIcon filled={bookmarked} />
                  </Button>
                </Tooltip>
                <Tooltip
                  content={
                    favorited ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Button
                    isIconOnly
                    aria-label="Add to favorites"
                    color="danger"
                    variant={favorited ? "solid" : "bordered"}
                    onClick={handleAddToFavorites}
                  >
                    <HeartIcon filled={favorited} />
                  </Button>
                </Tooltip>
                <Tooltip content="Share this book">
                  <Button
                    isIconOnly
                    aria-label="Share book"
                    variant="bordered"
                    onClick={handleShare}
                  >
                    <ShareIcon />
                  </Button>
                </Tooltip>
              </div>

              {/* External links */}
              <BookExternalLinks
                author={book.author}
                bookId={book.id}
                title={book.title}
              />
            </div>

            {/* Right column - Book details */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <h1 className="text-2xl md:text-3xl font-bold">{book.title}</h1>
                {book.series && (
                  <Badge
                    className="ml-0 md:ml-2 mt-2 md:mt-0"
                    color="secondary"
                    variant="flat"
                  >
                    {book.series.name} #{book.series.volume}
                  </Badge>
                )}
              </div>

              <h2 className="text-xl text-gray-600 dark:text-gray-400">
                by {book.author}
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <Rating readOnly value={book.rating} />
                <span className="text-small text-default-500">
                  {book.rating.toFixed(1)} ({book.reviewCount} reviews)
                </span>
                {book.ranking && (
                  <Chip color="warning" variant="flat">
                    #{book.ranking} Bestseller
                  </Chip>
                )}
              </div>

              <div className="flex flex-wrap gap-2 my-4">
                {book.genres.map((genre) => (
                  <Chip key={genre} color="primary" variant="flat">
                    {genre}
                  </Chip>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Publication Date</p>
                  <p>{new Date(book.publicationDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-semibold">Publisher</p>
                  <p>{book.publisher}</p>
                </div>
                <div>
                  <p className="font-semibold">Pages</p>
                  <p>{book.pageCount}</p>
                </div>
              </div>

              <Divider className="my-4" />

              <div>
                <h3 className="text-xl font-semibold mb-2">Synopsis</h3>
                <p className="text-default-600 whitespace-pre-line">
                  {book.synopsis}
                </p>
              </div>

              {/* Add reading progress for logged-in users */}
              {isAuthenticated && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Your Reading Progress
                  </h3>
                  <div className="flex items-center gap-2">
                    <progress
                      className="w-full h-2 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-default-200 [&::-webkit-progress-value]:bg-primary"
                      max={100}
                      value={30}
                    />
                    <span className="text-small">30%</span>
                  </div>
                  <Button
                    className="mt-2"
                    color="primary"
                    size="sm"
                    variant="flat"
                  >
                    Update Progress
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Reviews section */}
      <ReviewSection bookId={book.id} />

      {/* Similar books section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">
          Similar Books You Might Enjoy
        </h2>
        <SimilarBooks bookId={book.id} genres={book.genres} />
      </div>
    </div>
  );
};

export default BookDetails;
