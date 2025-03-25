export interface SearchQuery {
  text: string;
  genre?: string;
  length?: "short" | "medium" | "long";
  mood?: string;
  timeFrame?: string;
}

export interface SearchOptions {
  genre?: string;
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
  results?: {
    id: string;
    title: string;
    author: string;
    imageUrl?: string;
  }[];
}

export interface ConversationItem {
  id: string;
  type: "query" | "result";
  content: string;
  options?: SearchOptions;
  timestamp: number;
}
