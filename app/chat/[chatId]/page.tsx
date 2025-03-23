"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Avatar, Tooltip } from "@heroui/react";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  Trash,
  Share,
  Download,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import BookCard from "@/components/book/BookCard";
// import ChatInput from "@/components/ui/ChatInput";
import Container from "@/components/ui/Container";
import ChatInput from "@/components/ui/ChatInput";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  recommendations?: Book[];
}

interface Book {
  id: string;
  title: string;
  author: string;
  image: string;
  publicationDate: string;
  rating: number;
  reviewsCount: number;
  description: string;
  isBookmarked?: boolean;
}

export default function ChatPage() {
  const { chatId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState("New Chat");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Fetch chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);

        // Get chat document
        const chatRef = doc(db, "chats", chatId as string);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          router.push("/");

          return;
        }

        const chatData = chatSnap.data();

        setChatTitle(chatData.title || "Untitled Chat");

        // Get messages for this chat
        const messagesRef = collection(
          db,
          "chats",
          chatId as string,
          "messages",
        );
        const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
        const messagesSnap = await getDocs(messagesQuery);

        const messagesList: Message[] = [];

        messagesSnap.forEach((doc) => {
          const data = doc.data();

          messagesList.push({
            id: doc.id,
            content: data.content,
            sender: data.sender,
            timestamp: data.timestamp.toDate(),
            recommendations: data.recommendations || [],
          });
        });

        setMessages(messagesList);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchChatHistory();
    }
  }, [chatId, router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    try {
      setSending(true);

      // Add user message to UI immediately for responsiveness
      const userMessage: Message = {
        id: Date.now().toString(),
        content: input,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Send message to backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          message: input,
          userId: user?.uid || "guest",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add assistant message with recommendations
      const assistantMessage: Message = {
        id: Date.now().toString() + "-assistant",
        content: data.message,
        sender: "assistant",
        timestamp: new Date(),
        recommendations: data.recommendations || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error notification
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async (
    recommendationId: string,
    feedback: "like" | "dislike",
  ) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          recommendationId,
          feedback,
          userId: user?.uid || "guest",
        }),
      });

      // Update UI to show feedback was recorded
      // This could be updating the message state to reflect the feedback
    } catch (error) {
      console.error("Error sending feedback:", error);
    }
  };

  const handleRegenerateRecommendations = async () => {
    try {
      setSending(true);

      // Get the last user message
      const lastUserMessageIndex = [...messages]
        .reverse()
        .findIndex((m) => m.sender === "user");

      if (lastUserMessageIndex === -1) return;

      const lastUserMessage =
        messages[messages.length - 1 - lastUserMessageIndex];

      // Call API to regenerate recommendations
      const response = await fetch("/api/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          messageId: lastUserMessage.id,
          userId: user?.uid || "guest",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate recommendations");
      }

      const data = await response.json();

      // Replace the last assistant message with new recommendations
      setMessages((prev) => {
        const newMessages = [...prev];
        // Find the last assistant message
        const lastAssistantIndex = newMessages.length - 1;

        if (
          lastAssistantIndex >= 0 &&
          newMessages[lastAssistantIndex].sender === "assistant"
        ) {
          newMessages[lastAssistantIndex] = {
            ...newMessages[lastAssistantIndex],
            content: data.message,
            recommendations: data.recommendations || [],
          };
        } else {
          // If no assistant message found, add a new one
          newMessages.push({
            id: Date.now().toString() + "-assistant",
            content: data.message,
            sender: "assistant",
            timestamp: new Date(),
            recommendations: data.recommendations || [],
          });
        }

        return newMessages;
      });
    } catch (error) {
      console.error("Error regenerating recommendations:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async () => {
    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        await fetch(`/api/chat/${chatId}`, {
          method: "DELETE",
        });
        router.push("/");
      } catch (error) {
        console.error("Error deleting chat:", error);
      }
    }
  };

  const handleExportChat = () => {
    // Format chat data for export
    const chatData = messages.map((msg) => ({
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      recommendations: msg.recommendations,
    }));

    const dataStr = JSON.stringify(chatData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `chat-${chatId}-${new Date().toISOString()}.json`;

    const linkElement = document.createElement("a");

    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleShareChat = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Show success notification
    } catch (error) {
      console.error("Error sharing chat:", error);
    }
  };

  if (loading) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Spinner label="Loading chat history..." size="lg" />
      </Container>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-background border-b border-divider p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            isIconOnly
            aria-label="Go back"
            variant="light"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
          </Button>
          <Button isIconOnly aria-label="Go forward" variant="light">
            <ArrowRight size={20} />
          </Button>
          <h1 className="text-xl font-semibold truncate">{chatTitle}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Tooltip content="Delete chat">
            <Button
              isIconOnly
              aria-label="Delete chat"
              variant="light"
              onClick={handleDeleteChat}
            >
              <Trash size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="Export chat">
            <Button
              isIconOnly
              aria-label="Export chat"
              variant="light"
              onClick={handleExportChat}
            >
              <Download size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="Share chat">
            <Button
              isIconOnly
              aria-label="Share chat"
              variant="light"
              onClick={handleShareChat}
            >
              <Share size={20} />
            </Button>
          </Tooltip>
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-3xl ${message.sender === "user" ? "bg-primary/10 rounded-tl-lg rounded-tr-lg rounded-bl-lg" : "bg-secondary/10 rounded-tl-lg rounded-tr-lg rounded-br-lg"} p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.sender === "assistant" ? (
                  <Avatar name="AI" size="sm" src="/logo.png" />
                ) : (
                  <Avatar
                    name={user?.displayName || "User"}
                    size="sm"
                    src={user?.photoURL || undefined}
                  />
                )}
                <span className="font-medium">
                  {message.sender === "assistant"
                    ? "Book Recommender"
                    : user?.displayName || "You"}
                </span>
              </div>

              <div className="prose dark:prose-invert">{message.content}</div>

              {message.recommendations &&
                message.recommendations.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Recommendations</h3>
                      <Button
                        isLoading={sending}
                        size="sm"
                        startContent={<RefreshCw size={16} />}
                        variant="light"
                        onClick={handleRegenerateRecommendations}
                      >
                        Regenerate
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {message.recommendations.map((book) => (
                        <BookCard
                          key={book.id}
                          book={book}
                          onBookmark={() => {
                            /* Implement bookmarking */
                          }}
                          onClick={() => router.push(`/book/${book.id}`)}
                          onShare={() => {
                            /* Implement sharing */
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        color="success"
                        size="sm"
                        startContent={<ThumbsUp size={16} />}
                        variant="flat"
                        onClick={() => handleFeedback(message.id, "like")}
                      >
                        Helpful
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<ThumbsDown size={16} />}
                        variant="flat"
                        onClick={() => handleFeedback(message.id, "dislike")}
                      >
                        Not helpful
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-divider p-4">
        <ChatInput
          isLoading={sending}
          placeholder="Ask for book recommendations..."
          onSubmit={handleSendMessage}
        />
      </div>
    </div>
  );
}
