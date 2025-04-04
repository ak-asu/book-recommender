"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";

import ChatInput from "@/components/ui/ChatInput";
import BookList from "@/components/book/BookList";
import PopularBooks from "@/components/recommendations/PopularBooks";
import { useAuth } from "@/hooks/useAuth";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Container from "@/components/ui/Container";
import { SearchOptions, SearchHistoryItem } from "@/types/search";
import { sendMessage } from "@/store/chatSlice";
import { useAppDispatch } from "@/hooks/useAppDispatch";

const HomePage = () => {
  const dispatch = useAppDispatch();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q");
    const genres = searchParams.getAll("genres");
    const mood = searchParams.get("mood");
    const length = searchParams.get("length");
    if (q) {
      const options: SearchOptions = {};
      if (genres.length > 0) options.genres = genres;
      if (mood) options.mood = mood;
      if (length) options.length = length as "short" | "medium" | "long";
      handleSearch(q, options);
    }
  }, [searchParams]);

  const handleSearchInput = async (query: string, optionKeys: string[]) => {
    const options: SearchOptions = {};
    if (optionKeys.includes("genre")) options.genres = [];
    if (optionKeys.includes("mood")) options.mood = "";
    if (optionKeys.includes("length")) options.length = "medium";
    await handleSearch(query, options);
  };

  const handleSearch = async (query: string, options: SearchOptions) => {
    try {
      setIsSearching(true);
      setError(null);
      setHasSearched(true);
      const data = await dispatch(
        sendMessage({ content: query, options }),
      ).unwrap();
      if (!data.sessionId) {
        throw new Error("Failed to create chat");
      }
      router.push(`/chat/${data.sessionId}`);
      const newEntry: SearchHistoryItem = {
        id: data.sessionId,
        query,
        options,
        results:
          data.messages
            .map((msg) => msg.metadata?.books?.[0])
            .filter((e) => e !== undefined) || [],
        timestamp: new Date().getTime(),
      };
      if (currentHistoryIndex < history.length - 1) {
        setHistory((prev) => [
          ...prev.slice(0, currentHistoryIndex + 1),
          newEntry,
        ]);
      } else {
        setHistory((prev) => [...prev, newEntry]);
      }
      setCurrentHistoryIndex((prev) => prev + 1);
    } catch {
      setError("Failed to get recommendations. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Container className="py-8 px-4 md:px-0">
      <div className="mb-12">
        <ChatInput
          isLoading={isSearching}
          placeholder="What kind of book are you looking for?"
          onSubmit={handleSearchInput}
        />
      </div>
      {isSearching && (
        <div className="flex items-center justify-center py-16">
          <Spinner label="Getting recommendations..." size="lg" />
        </div>
      )}
      {error && <ErrorMessage className="my-8" message={error} />}
      {!isSearching && hasSearched && searchResults.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Recommended Books</h2>
          <BookList books={searchResults} />
        </div>
      )}
      {!isSearching && hasSearched && searchResults.length === 0 && !error && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold">
            No books found matching your criteria
          </h3>
          <p className="text-default-500 mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      )}
      {!hasSearched && !isSearching && <PopularBooks />}
    </Container>
  );
};

export default HomePage;
