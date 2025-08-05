import { useDispatch, useSelector } from "react-redux";
import { Filter } from "lucide-react";

import { RootState } from "@/store";
import { setFilters, searchBooks } from "@/store/slices/booksSlice";
import { SearchFilters } from "@/types";
import { genres } from "@/constants/mockData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Filters = () => {
  const dispatch = useDispatch();
  const { filters, query } = useSelector((state: RootState) => state.books);

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | number,
  ) => {
    const newFilters = {
      ...filters,
      [key]: key === "genre" && value === "All Genres" ? undefined : value,
    };

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
          <Select
            value={filters.genre || "All Genres"}
            onValueChange={(value) => handleFilterChange("genre", value)}
          >
            <SelectTrigger className="w-[180px] bg-booktrack-darkgray border-booktrack-lightgray text-white">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent className="bg-booktrack-darkgray border-booktrack-lightgray text-white">
              {genres.map((genre) => (
                <SelectItem
                  key={genre}
                  className="focus:bg-booktrack-lightgray focus:text-white"
                  value={genre}
                >
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy || "popularity"}
            onValueChange={(value) => handleFilterChange("sortBy", value)}
          >
            <SelectTrigger className="w-[180px] bg-booktrack-darkgray border-booktrack-lightgray text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-booktrack-darkgray border-booktrack-lightgray text-white">
              <SelectItem
                className="focus:bg-booktrack-lightgray focus:text-white"
                value="popularity"
              >
                Popularity
              </SelectItem>
              <SelectItem
                className="focus:bg-booktrack-lightgray focus:text-white"
                value="rating"
              >
                Rating
              </SelectItem>
              <SelectItem
                className="focus:bg-booktrack-lightgray focus:text-white"
                value="newest"
              >
                Newest
              </SelectItem>
              <SelectItem
                className="focus:bg-booktrack-lightgray focus:text-white"
                value="oldest"
              >
                Oldest
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(filters.rating || "any")}
            onValueChange={(value) =>
              handleFilterChange(
                "rating",
                value === "any" ? undefined : Number(value),
              )
            }
          >
            <SelectTrigger className="w-[180px] bg-booktrack-darkgray border-booktrack-lightgray text-white">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent className="bg-booktrack-darkgray border-booktrack-lightgray text-white">
              <SelectItem
                className="focus:bg-booktrack-lightgray focus:text-white"
                value="any"
              >
                Any Rating
              </SelectItem>
              <SelectItem
                className="focus:bg-booktrack-lightgray focus:text-white"
                value="4"
              >
                4+ Stars
              </SelectItem>
              <SelectItem
                className="focus:bg-booktrack-lightgray focus:text-white"
                value="3"
              >
                3+ Stars
              </SelectItem>
              <SelectItem
                className="focus:bg-booktrack-lightgray focus:text-white"
                value="2"
              >
                2+ Stars
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="border-booktrack-lightgray text-white hover:bg-booktrack-lightgray"
            variant="outline"
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
