import React, { useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
} from "react-icons/fa";
import { Button } from "@heroui/button";

const Sidebar = () => {
  const [chats, setChats] = useState([
    { id: 1, date: "Yesterday", name: "Comprehensive AI Topics List" },
    { id: 2, date: "Previous 30 Days", name: "Book Recommendation System" },
    { id: 3, date: "February", name: "Chat History" },
  ]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editedChatName, setEditedChatName] = useState("");

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEdit = (id: number, name: string) => {
    setEditingChatId(id);
    setEditedChatName(name);
  };

  const handleSaveEdit = (id: number) => {
    setChats(
      chats.map((chat) =>
        chat.id === id ? { ...chat, name: editedChatName } : chat,
      ),
    );
    setEditingChatId(null);
  };

  const handleDelete = (id: number) => {
    setChats(chats.filter((chat) => chat.id !== id));
  };

  const handleNewChat = () => {
    const newId = Math.max(...chats.map((chat) => chat.id), 0) + 1;

    setChats([{ id: newId, date: "Today", name: "New Chat" }, ...chats]);
  };

  return (
    <div
      className={`relative transition-all duration-300 ease-in-out h-full flex flex-col ${
        isExpanded ? "w-60" : "w-16"
      } border-r`}
    >
      <div className="flex justify-between items-center p-4 border-b">
        {isExpanded && <h2 className="text-lg font-bold">Chats</h2>}
        <button
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            !isExpanded && "mx-auto"
          }`}
          onClick={toggleSidebar}
        >
          {isExpanded ? <FaChevronLeft /> : <FaChevronRight />}
        </button>
      </div>

      {isExpanded && (
        <Button
          className="mx-4 mt-4 mb-2 flex items-center justify-center gap-2"
          color="primary"
          onClick={handleNewChat}
        >
          <FaPlus size={14} />
          <span>New Chat</span>
        </Button>
      )}

      {!isExpanded && (
        <Button
          isIconOnly
          className="mx-auto mt-4 mb-2 p-2 min-w-0 w-10 h-10 flex items-center justify-center"
          color="primary"
          onClick={handleNewChat}
        >
          <FaPlus size={14} />
        </Button>
      )}

      <div className="overflow-y-auto flex-grow">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="mb-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            {isExpanded ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">{chat.date}</span>
                  <div className="flex space-x-2">
                    <FaEdit
                      className="cursor-pointer hover:text-blue-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(chat.id, chat.name);
                      }}
                    />
                    <FaTrash
                      className="cursor-pointer hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(chat.id);
                      }}
                    />
                  </div>
                </div>
                <div className="ml-2 mt-1">
                  {editingChatId === chat.id ? (
                    <div className="flex items-center">
                      <input
                        className="text-sm p-1 border rounded w-full"
                        type="text"
                        value={editedChatName}
                        onBlur={() => handleSaveEdit(chat.id)}
                        onChange={(e) => setEditedChatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(chat.id);
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-sm line-clamp-1">{chat.name}</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-1">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {chat.name.charAt(0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
