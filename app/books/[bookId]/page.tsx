"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@heroui/react";

import BookDetails from "@/components/book/BookDetails";
import { BackIcon } from "@/components/icons";
import Container from "@/components/ui/Container";

const BookDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId;

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Container className="py-6 px-4">
      <div className="mb-6">
        <Button
          startContent={<BackIcon />}
          variant="light"
          onPress={handleGoBack}
        >
          Back
        </Button>
      </div>
      {bookId && <BookDetails bookId={bookId as string} />}
    </Container>
  );
};

export default BookDetailPage;
