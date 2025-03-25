export interface Book {
  id: string;
  title: string;
  author: string;
  publicationDate: string;
  description: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  genres: string[];
  pageCount: number;
  series?: string;
  volume?: number;
  buyLinks?: { [provider: string]: string };
  readLinks?: { [provider: string]: string };
  ranking?: number;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface BookRecommendation extends Book {
  timestamp: string;
  purchaseLinks?: Array<{ name: string; url: string }>;
  readLinks?: { [key: string]: string };
}

export interface BookQuery {
  genres?: string[];
  minRating?: number;
  maxPages?: number;
  searchTerm?: string;
  mood?: string;
  sortBy?: "rating" | "newest" | "title";
  lastDoc?: any; // QueryDocumentSnapshot<DocumentData>
  pageSize?: number;
}

export interface ReviewData {
  bookId: string;
  userId: string;
  rating: number;
  text: string;
  userName: string;
  userAvatar?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: any | null; // QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean;
}
