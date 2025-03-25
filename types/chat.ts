import { Book } from "./book";

export enum MessageType {
  QUERY = "query",
  RESPONSE = "response",
  SYSTEM = "system",
  ERROR = "error",
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  sender: "user" | "system";
  metadata?: {
    books?: Book[];
    queryOptions?: Record<string, any>;
    regenerate?: boolean;
  };
}
