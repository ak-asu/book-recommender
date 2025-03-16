import { useRouter } from "next/router";
import { Button } from "@heroui/react";

import BookDetails from "../../../components/book/BookDetails";
import { BackIcon } from "../../../components/icons";
import Container from "@/components/ui/Container";

const BookDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

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

      {id && <BookDetails />}
    </Container>
  );
};

export default BookDetailPage;
