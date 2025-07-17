import { useDispatch, useSelector } from "react-redux";
import { SortDesc } from "lucide-react";

import { RootState } from "@/store";
import { setFilters, searchBooks } from "@/store/slices/booksSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/types";

const SortDropdown = () => {
  const dispatch = useDispatch();
  const { filters, query } = useSelector((state: RootState) => state.books);

  const handleSortChange = (
    value: "popularity" | "rating" | "newest" | "oldest",
  ) => {
    const newFilters: SearchFilters = {
      ...filters,
      sortBy: value,
    };

    dispatch(setFilters(newFilters));
    dispatch(searchBooks({ query, filters: newFilters }));
  };

  const sortOptions = [
    { value: "popularity" as const, label: "Popularity" },
    { value: "rating" as const, label: "Rating" },
    { value: "newest" as const, label: "Newest" },
    { value: "oldest" as const, label: "Oldest" },
  ];

  const activeFiltersCount = Object.keys(filters).filter(
    (key) =>
      filters[key as keyof SearchFilters] !== undefined &&
      key !== "genre" &&
      key !== "rating",
  ).length;

  return (
    <div className="flex items-center space-x-2">
      {/* Sort By Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="border-booktrack-lightgray text-white hover:bg-booktrack-lightgray/30 flex items-center gap-2"
            variant="outline"
          >
            <SortDesc className="h-4 w-4" />
            Sort by:{" "}
            {sortOptions.find((option) => option.value === filters.sortBy)
              ?.label || "Popularity"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-booktrack-darkgray border-booktrack-lightgray text-white">
          <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-booktrack-lightgray" />
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              className={`cursor-pointer hover:bg-booktrack-lightgray/50 ${filters.sortBy === option.value ? "bg-booktrack-lightgray/30" : ""}`}
              onClick={() => handleSortChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset Filters Button */}
      {activeFiltersCount > 0 && (
        <Button
          className="border-booktrack-lightgray text-white hover:bg-booktrack-lightgray hover:text-booktrack-dark"
          variant="outline"
          onClick={() => {
            const newFilters = { ...filters };
            Object.keys(newFilters).forEach((key) => {
              if (key !== "genre" && key !== "rating") {
                delete newFilters[key as keyof SearchFilters];
              }
            });
            dispatch(setFilters(newFilters));
            dispatch(searchBooks({ query, filters: newFilters }));
          }}
        >
          Clear Sort ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
};

export default SortDropdown;
