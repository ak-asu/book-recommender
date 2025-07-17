import { useState, FormEvent, useEffect, KeyboardEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";

import { useDebounce } from "@/hooks/useDebounce";
import {
  searchBooks,
  setQuery,
  addToHistory,
  setFilters,
} from "@/store/slices/booksSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RootState } from "@/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { genres } from "@/constants/mockData";
import { SearchFilters } from "@/types";

const SearchBar = () => {
  const [searchInput, setSearchInput] = useState("");
  const [queryType, setQueryType] = useState("any");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  const dispatch = useDispatch();
  const { history, filters } = useSelector((state: RootState) => state.books);

  // Reset history index when history changes
  useEffect(() => {
    setHistoryIndex(-1);
  }, [history.length]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const finalQuery =
      queryType === "any" ? searchInput : `${queryType}: ${searchInput}`;
    dispatch(setQuery(finalQuery));
    dispatch(searchBooks({ query: finalQuery, filters }));
    dispatch(
      addToHistory({
        id: uuidv4(),
        query: finalQuery,
        timestamp: Date.now(),
      }),
    );
    setIsPopoverOpen(false);
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!searchInput.trim()) return;

      const finalQuery =
        queryType === "any" ? searchInput : `${queryType}: ${searchInput}`;
      dispatch(setQuery(finalQuery));
      dispatch(searchBooks({ query: finalQuery, filters }));
      dispatch(
        addToHistory({
          id: uuidv4(),
          query: finalQuery,
          timestamp: Date.now(),
        }),
      );
      setIsPopoverOpen(false);
      setHistoryIndex(-1);
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      // You could implement suggestions here based on the debounced search term
      // For now we'll just open the popover with query types
      setIsPopoverOpen(true);
    } else {
      setIsPopoverOpen(false);
    }
  }, [debouncedSearchTerm]);

  const queryTypes = [
    { value: "any", label: "Any" },
    { value: "title", label: "Title" },
    { value: "author", label: "Author" },
    { value: "genre", label: "Genre" },
    { value: "mood", label: "Mood/Tone" },
    { value: "similar", label: "Similar to..." },
  ];

  const handleQueryTypeChange = (value: string) => {
    setQueryType(value);
  };

  const navigateHistory = (direction: "back" | "forward") => {
    if (history.length === 0) return;

    let newIndex: number;
    if (direction === "back") {
      newIndex =
        historyIndex === -1
          ? 0
          : Math.min(historyIndex + 1, history.length - 1);
    } else {
      newIndex = Math.max(historyIndex - 1, -1);
    }

    setHistoryIndex(newIndex);

    if (newIndex !== -1) {
      const historyItem = history[newIndex];

      // Extract query type from the history item if applicable
      let parsedQuery = historyItem.query;
      let parsedType = "any";

      const queryTypeMatch = parsedQuery.match(
        /^(title|author|genre|mood|similar):\s(.+)$/i,
      );
      if (queryTypeMatch) {
        parsedType = queryTypeMatch[1].toLowerCase();
        parsedQuery = queryTypeMatch[2];
      }

      setSearchInput(parsedQuery);
      setQueryType(parsedType);
    } else {
      setSearchInput("");
      setQueryType("any");
    }
  };

  // Handle genre filter change
  const handleGenreChange = (value: string) => {
    const newFilters: SearchFilters = {
      ...filters,
      genre: value === "All Genres" ? undefined : value,
    };

    dispatch(setFilters(newFilters));
    dispatch(searchBooks({ query: filters.query || "", filters: newFilters }));
  };

  // Handle rating filter change
  const handleRatingChange = (value: number | undefined) => {
    const newFilters: SearchFilters = {
      ...filters,
      rating: value,
    };

    dispatch(setFilters(newFilters));
    dispatch(searchBooks({ query: filters.query || "", filters: newFilters }));
  };

  return (
    <div className="w-full rounded-lg overflow-hidden border border-booktrack-lightgray bg-booktrack-darkgray">
      <form className="relative" onSubmit={handleSubmit}>
        <div className="relative">
          <Textarea
            className="search-input text-white pl-10 pr-4 py-3 min-h-[60px] resize-none bg-transparent border-0 focus:ring-0 focus:border-0"
            placeholder="Search for books, authors, genres..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Search className="absolute left-3 top-4 h-5 w-5 text-gray-400" />

          <div className="flex items-center gap-2 px-3 py-2 border-t border-booktrack-lightgray">
            <div className="flex items-center">
              <Button
                className="text-booktrack-gold hover:bg-booktrack-lightgray/20 hover:text-booktrack-gold rounded-full flex items-center justify-center"
                disabled={history.length === 0}
                size="icon"
                title="Previous search"
                type="button"
                variant="ghost"
                onClick={() => navigateHistory("back")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button
                className="text-booktrack-gold hover:bg-booktrack-lightgray/20 hover:text-booktrack-gold rounded-full flex items-center justify-center"
                disabled={historyIndex <= 0}
                size="icon"
                title="Next search"
                type="button"
                variant="ghost"
                onClick={() => navigateHistory("forward")}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    className="text-gray-400 border-booktrack-lightgray hover:bg-booktrack-lightgray/20 w-full justify-start"
                    variant="outline"
                  >
                    {queryTypes.find((type) => type.value === queryType)
                      ?.label || "Any"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 bg-booktrack-darkgray border-booktrack-lightgray text-white">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Refine your search:</p>
                    <Select
                      value={queryType}
                      onValueChange={handleQueryTypeChange}
                    >
                      <SelectTrigger className="search-input text-white">
                        <SelectValue placeholder="Select a search type" />
                      </SelectTrigger>
                      <SelectContent className="bg-booktrack-darkgray border-booktrack-lightgray text-white">
                        <SelectGroup>
                          {queryTypes.map((type) => (
                            <SelectItem
                              key={type.value}
                              className="focus:bg-booktrack-lightgray focus:text-white"
                              value={type.value}
                            >
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Genre Filter Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="border-booktrack-lightgray text-white hover:bg-booktrack-lightgray/30 flex items-center gap-2"
                  type="button"
                  variant="outline"
                >
                  Genre
                  {filters.genre && (
                    <Badge
                      className="ml-1 bg-booktrack-gold/20"
                      variant="secondary"
                    >
                      {filters.genre}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-booktrack-darkgray border-booktrack-lightgray text-white max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Select Genre</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-booktrack-lightgray" />
                <DropdownMenuItem
                  className={`cursor-pointer hover:bg-booktrack-lightgray/50 ${filters.genre === undefined ? "bg-booktrack-lightgray/30" : ""}`}
                  onClick={() => handleGenreChange("All Genres")}
                >
                  All Genres
                </DropdownMenuItem>
                {genres.map((genre) => (
                  <DropdownMenuItem
                    key={genre}
                    className={`cursor-pointer hover:bg-booktrack-lightgray/50 ${filters.genre === genre ? "bg-booktrack-lightgray/30" : ""}`}
                    onClick={() => handleGenreChange(genre)}
                  >
                    {genre}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Rating Filter Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="border-booktrack-lightgray text-white hover:bg-booktrack-lightgray/30 flex items-center gap-2"
                  type="button"
                  variant="outline"
                >
                  Rating
                  {filters.rating && (
                    <Badge
                      className="ml-1 bg-booktrack-gold/20"
                      variant="secondary"
                    >
                      {filters.rating}+ Stars
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-booktrack-darkgray border-booktrack-lightgray text-white">
                <DropdownMenuLabel>Minimum Rating</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-booktrack-lightgray" />
                <DropdownMenuItem
                  className={`cursor-pointer hover:bg-booktrack-lightgray/50 ${filters.rating === undefined ? "bg-booktrack-lightgray/30" : ""}`}
                  onClick={() => handleRatingChange(undefined)}
                >
                  Any Rating
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`cursor-pointer hover:bg-booktrack-lightgray/50 ${filters.rating === 4 ? "bg-booktrack-lightgray/30" : ""}`}
                  onClick={() => handleRatingChange(4)}
                >
                  4+ Stars
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`cursor-pointer hover:bg-booktrack-lightgray/50 ${filters.rating === 3 ? "bg-booktrack-lightgray/30" : ""}`}
                  onClick={() => handleRatingChange(3)}
                >
                  3+ Stars
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`cursor-pointer hover:bg-booktrack-lightgray/50 ${filters.rating === 2 ? "bg-booktrack-lightgray/30" : ""}`}
                  onClick={() => handleRatingChange(2)}
                >
                  2+ Stars
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80"
              type="submit"
            >
              Search
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
