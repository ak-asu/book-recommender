import { useState } from "react";
import {
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Spinner,
} from "@heroui/react";

import { ChevronDownIcon } from "../temp/Icons";

import BookCard from "./BookCard";

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

interface BookListProps {
  books: Book[];
  isLoading?: boolean;
  onBookmark?: (bookId: string) => void;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const BookList: React.FC<BookListProps> = ({
  books,
  isLoading = false,
  onBookmark,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
}) => {
  const [sortBy, setSortBy] = useState<string>("relevance");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Loading books..." size="lg" />
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 border rounded-lg">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">No books found</h3>
          <p className="text-default-500">
            Try adjusting your search or filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dropdown>
          <DropdownTrigger>
            <Button endContent={<ChevronDownIcon />} size="sm" variant="flat">
              Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Sort options"
            selectedKeys={[sortBy]}
            selectionMode="single"
            onAction={(key) => setSortBy(key as string)}
          >
            <DropdownItem key="relevance">Relevance</DropdownItem>
            <DropdownItem key="rating">Rating</DropdownItem>
            <DropdownItem key="newest">Newest</DropdownItem>
            <DropdownItem key="title">Title</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
        {books.map((book) => (
          <BookCard key={book.id} book={book} onBookmark={onBookmark} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination
            showControls
            initialPage={currentPage}
            total={totalPages}
            onChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default BookList;
