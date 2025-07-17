"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, BookMarked, Star, Clock } from "lucide-react";

import { RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/ui/Navbar";
import BookCard from "@/components/book/BookCard";
import { Button } from "@heroui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@heroui/tabs";

const SavedPage = () => {
  const { isAuthenticated } = useAuth();
  const { favorites, bookmarked, savedForLater } = useSelector(
    (state: RootState) => state.bookmark,
  );
  const [activeTab, setActiveTab] = useState("bookmarked");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-booktrack-dark">
        <Navbar />
        <div className="container mx-auto py-16 px-4 text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Please login to view your saved books
          </h2>
          <Link to="/">
            <Button className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-booktrack-dark">
      <Navbar />

      <div className="container mx-auto py-8 px-4">
        <Link
          className="flex items-center text-booktrack-gold mb-6 hover:underline"
          to="/"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-white mb-6">Your Saved Books</h1>

        <Tabs
          className="mb-6"
          defaultValue="bookmarked"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-booktrack-darkgray">
            <TabsTrigger
              className="data-[state=active]:bg-booktrack-gold data-[state=active]:text-booktrack-dark"
              value="bookmarked"
            >
              <BookMarked className="h-4 w-4 mr-2" />
              Bookmarked ({bookmarked.length})
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-booktrack-gold data-[state=active]:text-booktrack-dark"
              value="favorites"
            >
              <Star className="h-4 w-4 mr-2" />
              Favorites ({favorites.length})
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-booktrack-gold data-[state=active]:text-booktrack-dark"
              value="savedForLater"
            >
              <Clock className="h-4 w-4 mr-2" />
              Saved for Later ({savedForLater.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookmarked">
            {bookmarked.length === 0 ? (
              <div className="bg-booktrack-darkgray rounded-lg p-8 text-center">
                <BookMarked className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-white mb-2">
                  No bookmarked books yet
                </h3>
                <p className="text-gray-400 mb-4">
                  Books you bookmark will appear here
                </p>
                <Link to="/">
                  <Button className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80">
                    Discover Books
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarked.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favorites.length === 0 ? (
              <div className="bg-booktrack-darkgray rounded-lg p-8 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-white mb-2">
                  No favorite books yet
                </h3>
                <p className="text-gray-400 mb-4">
                  Books you mark as favorite will appear here
                </p>
                <Link to="/">
                  <Button className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80">
                    Discover Books
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="savedForLater">
            {savedForLater.length === 0 ? (
              <div className="bg-booktrack-darkgray rounded-lg p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-white mb-2">
                  No books saved for later
                </h3>
                <p className="text-gray-400 mb-4">
                  Books you save for later will appear here
                </p>
                <Link to="/">
                  <Button className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80">
                    Discover Books
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedForLater.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SavedPage;
