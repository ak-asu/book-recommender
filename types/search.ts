import { Book } from "./book";

import { MESSAGE_TYPES } from "@/lib/constants";

export interface SearchQuery {
  text: string;
  genre?: string;
  length?: "short" | "medium" | "long";
  mood?: string;
  timeFrame?: string;
}

export interface SearchOptions {
  genres?: string[];
  length?: "short" | "medium" | "long";
  mood?: string;
  timeFrame?: string;
  maxResults?: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  options: SearchOptions;
  timestamp: number;
  userId?: string;
  results?: Book[];
}

export interface ConversationItem {
  id: string;
  type: (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];
  content: string;
  options?: SearchOptions;
  timestamp: number;
}
