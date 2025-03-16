import { useState, useRef } from "react";
import {
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
} from "@heroui/react";

import { ChevronDownIcon, BackIcon, SearchIcon } from "@/components/icons";

interface SearchOptions {
  genres?: string[];
  mood?: string;
  length?: "short" | "medium" | "long";
}

interface SearchBarProps {
  onSearch: (query: string, options: SearchOptions) => void;
  onNavigateHistory: (direction: "back" | "forward") => void;
  canGoBack: boolean;
  canGoForward: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

// List of available genres
const AVAILABLE_GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical Fiction",
  "Non-fiction",
  "Biography",
  "Self-help",
  "Horror",
  "Adventure",
  "Young Adult",
  "Children's",
  "Poetry",
  "Classics",
];

// List of moods
const MOODS = [
  "Happy",
  "Sad",
  "Inspiring",
  "Thoughtful",
  "Mysterious",
  "Funny",
  "Dark",
  "Suspenseful",
  "Romantic",
  "Calming",
  "Exciting",
  "Intellectual",
];

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onNavigateHistory,
  canGoBack,
  canGoForward,
  placeholder = "Search for book recommendations...",
  isLoading = false,
}) => {
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<
    "short" | "medium" | "long" | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const options: SearchOptions = {};

    if (selectedGenres.length > 0) options.genres = selectedGenres;
    if (selectedMood) options.mood = selectedMood;
    if (selectedLength) options.length = selectedLength;

    onSearch(query, options);
  };

  const handleGenreSelection = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const handleMoodSelection = (mood: string) => {
    setSelectedMood((prev) => (prev === mood ? null : mood));
  };

  const handleLengthSelection = (length: "short" | "medium" | "long") => {
    setSelectedLength((prev) => (prev === length ? null : length));
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedMood(null);
    setSelectedLength(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form className="relative" onSubmit={handleSubmit}>
        {/* History navigation buttons */}
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          <Button
            isIconOnly
            aria-label="Go back"
            isDisabled={!canGoBack}
            size="sm"
            variant="light"
            onClick={() => onNavigateHistory("back")}
          >
            <BackIcon />
          </Button>
          <Button
            isIconOnly
            aria-label="Go forward"
            className="rotate-180"
            isDisabled={!canGoForward}
            size="sm"
            variant="light"
            onClick={() => onNavigateHistory("forward")}
          >
            <BackIcon />
          </Button>
        </div>

        {/* Main search input */}
        <Input
          ref={inputRef}
          isClearable
          classNames={{
            input: "pl-14 pr-20", // Extra padding for navigation buttons and options
            inputWrapper: "h-12",
          }}
          endContent={
            <div className="flex items-center">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    aria-label="Show search options"
                    size="sm"
                    variant="light"
                  >
                    <ChevronDownIcon />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Search Options"
                  className="w-72"
                  closeOnSelect={false}
                >
                  <DropdownItem key="genres" isReadOnly className="p-3">
                    <p className="font-medium mb-2">Genres</p>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {AVAILABLE_GENRES.map((genre) => (
                        <Chip
                          key={genre}
                          className="cursor-pointer"
                          color={
                            selectedGenres.includes(genre)
                              ? "primary"
                              : "default"
                          }
                          size="sm"
                          variant={
                            selectedGenres.includes(genre)
                              ? "solid"
                              : "bordered"
                          }
                          onClick={() => handleGenreSelection(genre)}
                        >
                          {genre}
                        </Chip>
                      ))}
                    </div>
                  </DropdownItem>

                  <DropdownItem key="mood" isReadOnly className="p-3">
                    <p className="font-medium mb-2">Mood</p>
                    <div className="flex flex-wrap gap-1">
                      {MOODS.map((mood) => (
                        <Chip
                          key={mood}
                          className="cursor-pointer"
                          color={
                            selectedMood === mood ? "secondary" : "default"
                          }
                          size="sm"
                          variant={selectedMood === mood ? "solid" : "bordered"}
                          onClick={() => handleMoodSelection(mood)}
                        >
                          {mood}
                        </Chip>
                      ))}
                    </div>
                  </DropdownItem>

                  <DropdownItem key="length" isReadOnly className="p-3">
                    <p className="font-medium mb-2">Book Length</p>
                    <div className="flex gap-1">
                      <Chip
                        className="cursor-pointer flex-1 justify-center"
                        color={
                          selectedLength === "short" ? "success" : "default"
                        }
                        size="sm"
                        variant={
                          selectedLength === "short" ? "solid" : "bordered"
                        }
                        onClick={() => handleLengthSelection("short")}
                      >
                        Short
                      </Chip>
                      <Chip
                        className="cursor-pointer flex-1 justify-center"
                        color={
                          selectedLength === "medium" ? "warning" : "default"
                        }
                        size="sm"
                        variant={
                          selectedLength === "medium" ? "solid" : "bordered"
                        }
                        onClick={() => handleLengthSelection("medium")}
                      >
                        Medium
                      </Chip>
                      <Chip
                        className="cursor-pointer flex-1 justify-center"
                        color={selectedLength === "long" ? "danger" : "default"}
                        size="sm"
                        variant={
                          selectedLength === "long" ? "solid" : "bordered"
                        }
                        onClick={() => handleLengthSelection("long")}
                      >
                        Long
                      </Chip>
                    </div>
                  </DropdownItem>

                  <DropdownItem key="clear">
                    <Button
                      className="w-full"
                      color="danger"
                      size="sm"
                      variant="flat"
                      onPress={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          }
          placeholder={placeholder}
          radius="lg"
          startContent={<SearchIcon className="text-default-400 ml-8" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
        />

        {/* Active filters display */}
        {(selectedGenres.length > 0 || selectedMood || selectedLength) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedGenres.map((genre) => (
              <Chip
                key={genre}
                color="primary"
                size="sm"
                variant="flat"
                onClose={() => handleGenreSelection(genre)}
              >
                {genre}
              </Chip>
            ))}

            {selectedMood && (
              <Chip
                color="secondary"
                size="sm"
                variant="flat"
                onClose={() => setSelectedMood(null)}
              >
                {selectedMood}
              </Chip>
            )}

            {selectedLength && (
              <Chip
                color={
                  selectedLength === "short"
                    ? "success"
                    : selectedLength === "medium"
                      ? "warning"
                      : "danger"
                }
                size="sm"
                variant="flat"
                onClose={() => setSelectedLength(null)}
              >
                {selectedLength.charAt(0).toUpperCase() +
                  selectedLength.slice(1)}{" "}
                Books
              </Chip>
            )}
          </div>
        )}

        <Button className="hidden" isLoading={isLoading} type="submit" />
      </form>
    </div>
  );
};

export default SearchBar;
