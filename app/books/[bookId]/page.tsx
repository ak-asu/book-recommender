"use client";

import Navbar from "@/components/Navbar";
import BookDetails from "@/components/BookDetails";

interface BookPageProps {
  params: { bookId: string };
}

const BookPage = ({ params }: BookPageProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-booktrack-dark">
      <Navbar />

      <div className="flex-grow">
        <BookDetails bookId={params.bookId} />
      </div>

      <footer className="bg-booktrack-darkgray py-6 border-t border-booktrack-lightgray">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} BookTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BookPage;
