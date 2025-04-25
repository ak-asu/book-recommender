"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Tabs, Tab, Spinner } from "@heroui/react";

import Container from "@/components/ui/Container";
import BookList from "@/components/book/BookList";
import { useAuth } from "@/hooks/useAuth";
import { removeFromCollection } from "@/services/userService";

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

export default function BooksPage() {
  const [activeTab, setActiveTab] = useState("favorites");
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [bookmarks, setBookmarks] = useState<Book[]>([]);
  const [savedForLater, setSavedForLater] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const loadData = async () => {
          // switch (activeTab) {
          //   case "favorites":
          //     const favoritesData = await getUserFavorites(user.uid);
          //     setFavorites(favoritesData);
          //     break;
          //   case "bookmarks":
          //     const bookmarksData = await getUserBookmarks(user.uid);
          //     setBookmarks(bookmarksData);
          //     break;
          //   case "saved":
          //     const savedData = await getSavedForLater(user.uid);
          //     setSavedForLater(savedData);
          //     break;
          // }
        };
        await loadData();
      } catch {
        setError(`Failed to load your ${activeTab}. Please try again.`);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [user, isAuthenticated, activeTab]);

  const handleRemoveItem = async (bookId: string) => {
    if (!user) return;

    let currentList: Book[] = [];
    let setterFunction: React.Dispatch<React.SetStateAction<Book[]>>;
    let collectionType: "favorites" | "bookmarks" | "savedForLater";

    switch (activeTab) {
      case "favorites":
        currentList = favorites;
        setterFunction = setFavorites;
        collectionType = "favorites";
        break;
      case "bookmarks":
        currentList = bookmarks;
        setterFunction = setBookmarks;
        collectionType = "bookmarks";
        break;
      case "saved":
        currentList = savedForLater;
        setterFunction = setSavedForLater;
        collectionType = "savedForLater";
        break;
      default:
        return;
    }

    try {
      await removeFromCollection(user.uid, bookId, collectionType);
      setterFunction(currentList.filter((book) => book.id !== bookId));
    } catch (err) {
      console.error(`Error removing from ${collectionType}:`, err);
      setError(`Failed to remove book from ${activeTab}. Please try again.`);
    }
  };

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-bold mb-6">My Books</h1>
      {!isAuthenticated ? (
        <div className="text-center py-8 text-default-500">
          Please log in to view your book collection.
        </div>
      ) : (
        <Card>
          <CardHeader>
            <Tabs
              aria-label="Book collection tabs"
              selectedKey={activeTab}
              onSelectionChange={setActiveTab as any}
            >
              <Tab key="favorites" title="Favorites" />
              <Tab key="bookmarks" title="Bookmarks" />
              <Tab key="saved" title="Saved for Later" />
            </Tabs>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner label={`Loading your ${activeTab}...`} size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-danger">{error}</div>
            ) : (
              <div>
                {activeTab === "favorites" && (
                  <div>
                    {favorites.length === 0 ? (
                      <div className="text-center py-8 text-default-500">
                        You haven&apos;t added any books to your favorites yet.
                      </div>
                    ) : (
                      <BookList
                        books={favorites}
                        onBookmark={handleRemoveItem}
                      />
                    )}
                  </div>
                )}
                {activeTab === "bookmarks" && (
                  <div>
                    {bookmarks.length === 0 ? (
                      <div className="text-center py-8 text-default-500">
                        You haven&apos;t bookmarked any books yet.
                      </div>
                    ) : (
                      <BookList
                        books={bookmarks}
                        onBookmark={handleRemoveItem}
                      />
                    )}
                  </div>
                )}
                {activeTab === "saved" && (
                  <div>
                    {savedForLater.length === 0 ? (
                      <div className="text-center py-8 text-default-500">
                        You haven&apos;t saved any books for later yet.
                      </div>
                    ) : (
                      <BookList
                        books={savedForLater}
                        onBookmark={handleRemoveItem}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
