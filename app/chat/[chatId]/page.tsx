"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Avatar, Tooltip, Input } from "@heroui/react";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
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
  Edit,
  Check,
  Plus,
} from "lucide-react";

import { firestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import BookCard from "@/components/book/BookCard";
import Container from "@/components/ui/Container";
import ChatInput from "@/components/ui/ChatInput";
import { useToast } from "@/hooks/useToast";

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
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const chatRef = doc(firestore, "chats", chatId as string);
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
          router.push("/");
          return;
        }
        const chatData = chatSnap.data();
        setChatTitle(chatData.title || "Untitled Chat");
        const messagesRef = collection(
          firestore,
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
      } catch {
        toast({
          title: "Error",
          description: "Failed to load chat history. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    if (chatId) {
      fetchChatHistory();
    }
  }, [chatId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    try {
      setSending(true);
      const userMessage: Message = {
        id: Date.now().toString(),
        content: input,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
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
      const assistantMessage: Message = {
        id: Date.now().toString() + "-assistant",
        content: data.message,
        sender: "assistant",
        timestamp: new Date(),
        recommendations: data.recommendations || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
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
    } catch {
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateRecommendations = async () => {
    try {
      setSending(true);
      const lastUserMessageIndex = [...messages]
        .reverse()
        .findIndex((m) => m.sender === "user");
      if (lastUserMessageIndex === -1) return;
      const lastUserMessage =
        messages[messages.length - 1 - lastUserMessageIndex];
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
      setMessages((prev) => {
        const newMessages = [...prev];
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
    } catch {
      toast({
        title: "Error",
        description: "Failed to regenerate recommendations. Please try again.",
        variant: "destructive",
      });
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
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete chat. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleExportChat = () => {
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
      toast({
        title: "Success",
        description: "Chat link copied to clipboard!",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to share chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTitle = () => {
    setEditedTitle(chatTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const chatRef = doc(firestore, "chats", chatId as string);
      await updateDoc(chatRef, {
        title: editedTitle,
      });
      setChatTitle(editedTitle);
      setIsEditingTitle(false);
      toast({
        title: "Success",
        description: "Chat title updated",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive",
      });
    }
  };

  const handleNewChat = () => {
    router.push("/");
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
      <header className="bg-background border-b border-divider p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            isIconOnly
            aria-label="Go back"
            variant="light"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} />
          </Button>
          <Button isIconOnly aria-label="Go forward" variant="light">
            <ArrowRight size={20} />
          </Button>
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                className="w-64"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveTitle();
                  } else if (e.key === "Escape") {
                    setIsEditingTitle(false);
                  }
                }}
              />
              <Button
                isIconOnly
                aria-label="Save title"
                variant="light"
                onPress={handleSaveTitle}
              >
                <Check size={20} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold truncate">{chatTitle}</h1>
              <Button
                isIconOnly
                aria-label="Edit chat title"
                variant="light"
                onPress={handleEditTitle}
              >
                <Edit size={16} />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Tooltip content="New Chat">
            <Button
              aria-label="New Chat"
              startContent={<Plus size={20} />}
              variant="light"
              onPress={handleNewChat}
            >
              New Chat
            </Button>
          </Tooltip>
          <Tooltip content="Delete chat">
            <Button
              isIconOnly
              aria-label="Delete chat"
              variant="light"
              onPress={handleDeleteChat}
            >
              <Trash size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="Export chat">
            <Button
              isIconOnly
              aria-label="Export chat"
              variant="light"
              onPress={handleExportChat}
            >
              <Download size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="Share chat">
            <Button
              isIconOnly
              aria-label="Share chat"
              variant="light"
              onPress={handleShareChat}
            >
              <Share size={20} />
            </Button>
          </Tooltip>
        </div>
      </header>
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
                        onPress={handleRegenerateRecommendations}
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
                        onPress={() => handleFeedback(message.id, "like")}
                      >
                        Helpful
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<ThumbsDown size={16} />}
                        variant="flat"
                        onPress={() => handleFeedback(message.id, "dislike")}
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
