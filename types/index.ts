import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  genre: string[];
  rating: number;
  reviewCount: number;
  description: string;
  pages: number;
  series?: {
    name: string;
    position: number;
  };
  readLinks?: {
    name: string;
    url: string;
  }[];
  publishedDate?: string;
  tags?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  favoriteGenres?: string[];
  favoriteAuthors?: string[];
  readingGoal?: number;
  readingLevel?: string;
}

export interface SearchFilters {
  genre?: string;
  rating?: number;
  sortBy?: "popularity" | "rating" | "newest" | "oldest";
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: Book[];
  loading: boolean;
  error: string | null;
  history: SearchQuery[];
  currentPage: number;
  totalPages: number;
}

export interface SearchQuery {
  id: string;
  query: string;
  timestamp: number;
  filters?: SearchFilters;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface BookmarkState {
  favorites: Book[];
  bookmarked: Book[];
  savedForLater: Book[];
}

export interface SearchOptions {
  genres?: string[];
  mood?: string;
  length?: "short" | "medium" | "long";
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  options: SearchOptions;
  results: any[];
  timestamp: number;
}
