import React from "react";
import { Button } from "@heroui/react";
import { useSelector } from "react-redux";
import { Filter } from "lucide-react";

import { RootState } from "@/store";
import { setFilters, searchBooks } from "@/store/slices/booksSlice";
import { SearchFilters } from "@/types";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { BOOK } from "@/lib/constants";

const Filters: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filters, query } = useSelector((state: RootState) => state.books);

  // Define options for selects
  const genres = ["All Genres", ...BOOK.GENRES];
  const sortOptions = [
    { value: "popularity", label: "Popularity" },
    { value: "rating", label: "Rating" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
  ];
  const ratingOptions = [
    { value: "any", label: "Any Rating" },
    { value: "4", label: "4+ Stars" },
    { value: "3", label: "3+ Stars" },
    { value: "2", label: "2+ Stars" },
  ];

  const handleFilterChange = (
    key: keyof SearchFilters,
    value?: string | number,
  ) => {
    const newFilters: SearchFilters = { ...filters };
    if (value === undefined || (key === "genre" && value === "All Genres")) {
      delete newFilters[key];
    } else {
      newFilters[key] = value as any;
    }
    dispatch(setFilters(newFilters));
    dispatch(searchBooks({ query, filters: newFilters }));
  };

  const handleReset = () => {
    dispatch(setFilters({}));
    dispatch(searchBooks({ query, filters: {} }));
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-booktrack-gold" />
          <span className="text-white">Filters:</span>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <select
            className="w-[180px] bg-booktrack-darkgray border border-booktrack-lightgray text-white p-1 rounded"
            value={filters.genre || "All Genres"}
            onChange={(e) => handleFilterChange("genre", e.target.value)}
          >
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            className="w-[180px] bg-booktrack-darkgray border border-booktrack-lightgray text-white p-1 rounded"
            value={filters.sortBy || "popularity"}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="w-[180px] bg-booktrack-darkgray border border-booktrack-lightgray text-white p-1 rounded"
            value={
              filters.rating !== undefined ? String(filters.rating) : "any"
            }
            onChange={(e) => {
              const val = e.target.value;
              handleFilterChange(
                "rating",
                val === "any" ? undefined : Number(val),
              );
            }}
          >
            {ratingOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Button
            className="border-booktrack-lightgray text-white hover:bg-booktrack-lightgray"
            variant="bordered"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
