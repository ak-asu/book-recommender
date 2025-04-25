import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardBody,
  Button,
  Tooltip,
  Input,
  Spinner,
  Divider,
} from "@heroui/react";
import {
  Edit as EditIcon,
  Trash2 as TrashIcon,
  Share2 as ShareIcon,
  Clock as ClockIcon,
  Check as CheckIcon,
  X as XIcon,
  Download as DownloadIcon,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  recommendations?: number;
}

interface HistoryListProps {
  historyItems?: ChatHistory[];
  isLoading?: boolean;
  error?: string | null;
  onDeleteChat?: (chatId: string) => Promise<void>;
  onRenameChat?: (chatId: string, newTitle: string) => Promise<void>;
  onExportChat?: (chatId: string) => Promise<void>;
  onShareChat?: (chatId: string) => Promise<void>;
}

const HistoryList = ({
  historyItems = [],
  isLoading = false,
  error = null,
  onDeleteChat,
  onRenameChat,
  onExportChat,
  onShareChat,
}: HistoryListProps) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editedChatTitle, setEditedChatTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleEdit = (id: string, title: string) => {
    setEditingChatId(id);
    setEditedChatTitle(title);
  };

  const handleSaveEdit = async (id: string) => {
    if (!onRenameChat || editedChatTitle.trim() === "") return;

    try {
      setIsProcessing(true);
      await onRenameChat(id, editedChatTitle);
      setEditingChatId(null);
    } catch (error) {
      console.error("Error renaming chat:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteChat) return;

    try {
      setIsProcessing(true);
      await onDeleteChat(id);
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async (id: string) => {
    if (!onShareChat) return;

    try {
      await onShareChat(id);
    } catch (error) {
      console.error("Error sharing chat:", error);
    }
  };

  const handleExport = async (id: string) => {
    if (!onExportChat) return;

    try {
      await onExportChat(id);
    } catch (error) {
      console.error("Error exporting chat:", error);
    }
  };

  const navigateToChat = (id: string) => {
    router.push(`chat/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner label="Loading your conversation history..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-sm">
        <CardBody className="py-8 text-center">
          <p className="text-danger">{error}</p>
        </CardBody>
      </Card>
    );
  }

  if (historyItems.length === 0) {
    return (
      <Card className="w-full shadow-sm">
        <CardBody className="py-12 text-center">
          <p className="text-default-500">
            You don&apos;t have any conversations yet. Start searching for book
            recommendations!
          </p>
          <Button
            className="mt-4"
            color="primary"
            onClick={() => router.push("/")}
          >
            Get Recommendations
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-2xl font-bold mb-6">Your Conversation History</h2>

      {historyItems.map((chat) => (
        <Card
          key={chat.id}
          className="w-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          isPressable={editingChatId !== chat.id}
          onPress={
            editingChatId !== chat.id
              ? () => navigateToChat(chat.id)
              : undefined
          }
        >
          <CardBody className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                {editingChatId === chat.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      className="flex-grow"
                      placeholder="Chat title"
                      size="sm"
                      value={editedChatTitle}
                      onChange={(e) => setEditedChatTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(chat.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <Button
                      isIconOnly
                      aria-label="Save"
                      color="primary"
                      isLoading={isProcessing}
                      size="sm"
                      variant="light"
                      onClick={() => handleSaveEdit(chat.id)}
                    >
                      <CheckIcon size={18} />
                    </Button>
                    <Button
                      isIconOnly
                      aria-label="Cancel"
                      size="sm"
                      variant="light"
                      onClick={handleCancelEdit}
                    >
                      <XIcon size={18} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-medium line-clamp-1">
                      {chat.title}
                    </h3>
                    <p className="text-sm text-default-500 line-clamp-1 mt-1">
                      {chat.lastMessage}
                    </p>
                  </>
                )}
              </div>

              {editingChatId !== chat.id && (
                <div className="flex items-center gap-1">
                  <div className="text-xs text-default-400 flex items-center mr-2">
                    <ClockIcon className="mr-1" size={14} />
                    {formatDistanceToNow(new Date(chat.timestamp))}
                  </div>
                  <Tooltip content="Edit title">
                    <Button
                      isIconOnly
                      aria-label="Edit chat title"
                      size="sm"
                      variant="light"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(chat.id, chat.title);
                      }}
                    >
                      <EditIcon size={16} />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Delete">
                    <Button
                      isIconOnly
                      aria-label="Delete chat"
                      color="danger"
                      size="sm"
                      variant="light"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(chat.id);
                      }}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>

            {editingChatId !== chat.id && (
              <>
                <Divider className="my-3" />
                <div className="flex justify-between items-center">
                  {chat.recommendations && (
                    <div className="text-sm text-default-500">
                      {chat.recommendations} book recommendation
                      {chat.recommendations > 1 ? "s" : ""}
                    </div>
                  )}
                  <div className="flex gap-1 ml-auto">
                    <Tooltip content="Export">
                      <Button
                        isIconOnly
                        aria-label="Export chat"
                        size="sm"
                        variant="light"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(chat.id);
                        }}
                      >
                        <DownloadIcon size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Share">
                      <Button
                        isIconOnly
                        aria-label="Share chat"
                        size="sm"
                        variant="light"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(chat.id);
                        }}
                      >
                        <ShareIcon size={16} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default HistoryList;
