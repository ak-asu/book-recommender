import { Card, CardBody, Button, Tooltip } from "@heroui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useState } from "react";

import { BookmarkIcon, ShareIcon } from "../icons";
import { useAuth } from "../../hooks/useAuth";
import Rating from "../ui/Rating";

interface BookCardProps {
  book: {
    id: string;
    image: string;
    title: string;
    author: string;
    publicationDate?: string;
    rating: number;
    reviewCount?: number;
    description: string;
    genres?: string[];
  };
  onBookmark?: (bookId: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onBookmark }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);

  const handleBookClick = () => {
    router.push(`/books/${book.id}`);
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark(book.id);
    }
    setBookmarked(!bookmarked);
  };

  const handleShare = () => {
    const bookUrl = `${window.location.origin}/books/${book.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: book.title,
          text: `Check out ${book.title} by ${book.author}`,
          url: bookUrl,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      navigator.clipboard.writeText(bookUrl);
      // You could add a toast notification here
      // toast.success("Link copied to clipboard!");
    }
  };

  return (
    <Card
      isPressable
      className="transition-transform hover:scale-[1.02]"
      shadow="sm"
      onPress={handleBookClick}
    >
      <CardBody className="flex flex-row gap-4 p-3">
        <div className="relative min-w-[120px] h-[180px] rounded-md overflow-hidden">
          <Image
            fill
            priority
            alt={book.title}
            className="object-cover"
            sizes="(max-width: 768px) 120px, 120px"
            src={book.image || "/images/placeholder-book.png"}
          />
        </div>

        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex-grow mr-2">
              <h3 className="text-lg font-bold line-clamp-2">{book.title}</h3>
              <p className="text-default-600">{book.author}</p>
            </div>

            <div className="flex space-x-1">
              <Tooltip content={bookmarked ? "Remove bookmark" : "Bookmark"}>
                <Button
                  isIconOnly
                  aria-label="Bookmark book"
                  size="sm"
                  variant="light"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookmark();
                  }}
                >
                  <BookmarkIcon filled={bookmarked} />
                </Button>
              </Tooltip>
              <Tooltip content="Share">
                <Button
                  isIconOnly
                  aria-label="Share book"
                  size="sm"
                  variant="light"
                  onPress={handleShare}
                >
                  <ShareIcon />
                </Button>
              </Tooltip>
            </div>
          </div>

          {book.publicationDate && (
            <p className="text-xs text-default-500 mt-1">
              Published: {new Date(book.publicationDate).getFullYear()}
            </p>
          )}

          <div className="flex items-center mt-1 mb-2">
            <Rating readOnly size="sm" value={book.rating} />
            <span className="text-xs text-default-500 ml-2">
              {book.rating.toFixed(1)}
              {book.reviewCount && ` (${book.reviewCount})`}
            </span>
          </div>

          <p className="text-sm text-default-700 line-clamp-3">
            {book.description}
          </p>

          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-2">
              {book.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2 py-1 bg-default-100 rounded-full"
                >
                  {genre}
                </span>
              ))}
              {book.genres.length > 2 && (
                <span className="text-xs px-2 py-1 bg-default-100 rounded-full">
                  +{book.genres.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default BookCard;
