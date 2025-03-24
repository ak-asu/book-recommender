"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import {
  deleteDoc,
  doc,
  collection,
  getDocs,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";

import HistoryList from "@/components/history/HistoryList";
import SearchBar from "@/components/ui/SearchBar";
import { useAuth } from "@/hooks/useAuth";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/hooks/useToast";

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  recommendations?: number;
}

export default function ChatHistoryPage() {
  const [historyItems, setHistoryItems] = useState<ChatHistory[]>([]);
  const [filteredItems, setFilteredItems] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setHistoryItems([]);
      setFilteredItems([]);
      setIsLoading(false);
      return;
    }

    const fetchChatHistory = async () => {
      try {
        setIsLoading(true);
        const chatsRef = collection(firestore, "users", user.uid, "chats");
        const q = query(chatsRef, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const chats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toMillis() || Date.now(),
        })) as ChatHistory[];
        setHistoryItems(chats);
        setFilteredItems(chats);
        setError(null);
      } catch {
        setError("Failed to load your chat history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatHistory();
  }, [user]);

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(firestore, "users", user.uid, "chats", chatId));
      setHistoryItems((prev) => prev.filter((item) => item.id !== chatId));
      setFilteredItems((prev) => prev.filter((item) => item.id !== chatId));
      toast({
        title: "Chat deleted",
        description: "Your conversation has been deleted successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete your conversation. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(firestore, "users", user.uid, "chats", chatId), {
        title: newTitle,
      });
      setHistoryItems((prev) =>
        prev.map((item) =>
          item.id === chatId ? { ...item, title: newTitle } : item,
        ),
      );
      setFilteredItems((prev) =>
        prev.map((item) =>
          item.id === chatId ? { ...item, title: newTitle } : item,
        ),
      );
      toast({
        title: "Chat renamed",
        description: "Your conversation has been renamed successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to rename your conversation. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleExportChat = async (chatId: string) => {
    if (!user) return;
    try {
      // Implementation would fetch the full chat data and export it
      toast({
        title: "Chat exported",
        description: "Your conversation has been exported successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to export your conversation. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleShareChat = async (chatId: string) => {
    if (!user) return;
    try {
      // Implementation would generate a shareable link
      const shareUrl = `${window.location.origin}/shared-chat/${chatId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this conversation with others.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to share your conversation. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredItems(historyItems);
      return;
    }
    if (!searchHistory.includes(query)) {
      setSearchHistory((prev) => [...prev, query]);
      setHistoryIndex(searchHistory.length);
    }
    const lowerCaseQuery = query.toLowerCase();
    const filtered = historyItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerCaseQuery) ||
        item.lastMessage.toLowerCase().includes(lowerCaseQuery),
    );
    setFilteredItems(filtered);
    setSearchTerm(query);
  };

  const handleNavigateHistory = (direction: "back" | "forward") => {
    if (direction === "back" && historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSearchTerm(searchHistory[historyIndex - 1]);
      handleSearch(searchHistory[historyIndex - 1]);
    } else if (
      direction === "forward" &&
      historyIndex < searchHistory.length - 1
    ) {
      setHistoryIndex(historyIndex + 1);
      setSearchTerm(searchHistory[historyIndex + 1]);
      handleSearch(searchHistory[historyIndex + 1]);
    }
  };

  const handleSearchWithOptions = (query: string, options: any) => {
    // For the history page, we're just using the search term and ignoring options
    handleSearch(query);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Conversation History</h1>
      <div className="mb-6">
        <SearchBar
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < searchHistory.length - 1}
          placeholder="Search your conversations..."
          onNavigateHistory={handleNavigateHistory}
          onSearch={handleSearchWithOptions}
        />
      </div>
      <HistoryList
        error={error}
        historyItems={filteredItems}
        isLoading={isLoading}
        onDeleteChat={handleDeleteChat}
        onExportChat={handleExportChat}
        onRenameChat={handleRenameChat}
        onShareChat={handleShareChat}
      />
      {!isLoading &&
        !error &&
        filteredItems.length === 0 &&
        historyItems.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              No conversations match your search.
            </p>
            <Button
              color="primary"
              variant="light"
              onClick={() => {
                setSearchTerm("");
                setFilteredItems(historyItems);
              }}
            >
              Show all conversations
            </Button>
          </div>
        )}
    </div>
  );
}
