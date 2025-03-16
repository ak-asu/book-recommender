"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";

import SearchBar from "@/components/ui/SearchBar";
import BookList from "@/components/book/BookList";
import PopularBooks from "@/components/recommendations/PopularBooks";
import { getAIBookRecommendations } from "@/services/bookService";
import { useAuth } from "@/hooks/useAuth";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Container from "@/components/ui/Container";

interface SearchOptions {
  genres?: string[];
  mood?: string;
  length?: "short" | "medium" | "long";
}

interface HistoryEntry {
  query: string;
  options: SearchOptions;
  results: any[];
}

const HomePage = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load initial search from URL query params if present
  useEffect(() => {
    const q = searchParams.get('q');
    const genres = searchParams.getAll('genres');
    const mood = searchParams.get('mood');
    const length = searchParams.get('length');

    if (q) {
      const options: SearchOptions = {};

      if (genres.length > 0) options.genres = genres;
      if (mood) options.mood = mood;
      if (length) options.length = length as "short" | "medium" | "long";

      handleSearch(q, options);
    }
  }, [searchParams]);

  const handleSearch = async (query: string, options: SearchOptions) => {
    try {
      setIsSearching(true);
      setError(null);

      // Update URL to reflect search
      const params = new URLSearchParams();

      params.set("q", query);
      if (options.genres?.length) {
        options.genres.forEach((genre) => params.append("genres", genre));
      }
      if (options.mood) params.set("mood", options.mood);
      if (options.length) params.set("length", options.length);

      router.push(`/?${params.toString()}`);

      // Get recommendations from AI
      const results = await getAIBookRecommendations(query, {
        ...options,
        userId: user?.uid,
      });

      setSearchResults(results);
      setHasSearched(true);

      // Add to history
      const newEntry = { query, options, results };

      if (currentHistoryIndex < history.length - 1) {
        // If we're not at the end of the history, trim the future
        setHistory((prev) => [
          ...prev.slice(0, currentHistoryIndex + 1),
          newEntry,
        ]);
      } else {
        setHistory((prev) => [...prev, newEntry]);
      }
      setCurrentHistoryIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Error searching books:", err);
      setError("Failed to get recommendations. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigateHistory = (direction: "back" | "forward") => {
    let newIndex = currentHistoryIndex;

    if (direction === "back" && newIndex > 0) {
      newIndex -= 1;
    } else if (direction === "forward" && newIndex < history.length - 1) {
      newIndex += 1;
    } else {
      return;
    }

    setCurrentHistoryIndex(newIndex);
    const { results } = history[newIndex];

    setSearchResults(results);
  };

  return (
    <Container className="py-8 px-4 md:px-0">
      <div className="mb-12">
        <SearchBar
          canGoBack={currentHistoryIndex > 0}
          canGoForward={currentHistoryIndex < history.length - 1}
          isLoading={isSearching}
          onNavigateHistory={handleNavigateHistory}
          onSearch={handleSearch}
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
