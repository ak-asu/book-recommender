import React, { useState, useRef, KeyboardEvent } from "react";
import {
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { Search, ChevronDown, Send } from "lucide-react";

type SearchOption = {
  key: string;
  name: string;
};

type ChatInputProps = {
  onSubmit: (query: string, options: string[]) => void;
  isLoading?: boolean;
  placeholder?: string;
};

const searchOptions: SearchOption[] = [
  { key: "genre", name: "Genre" },
  { key: "length", name: "Length" },
  { key: "mood", name: "Mood" },
  { key: "author", name: "Author" },
  { key: "release-date", name: "Release Date" },
  { key: "popularity", name: "Popularity" },
];

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  isLoading = false,
  placeholder = "What kind of book are you looking for?",
}) => {
  const [query, setQuery] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set([]),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && query.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      onSubmit(query, Array.from(selectedOptions));
      // Optionally clear the input after submission
      // setQuery('');
    }
  };

  const handleSelectionChange = (keys: Set<string>) => {
    setSelectedOptions(keys);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 relative">
      <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            className="flex-grow"
            endContent={
              <Button
                isIconOnly
                aria-label="Submit"
                color="primary"
                isDisabled={!query.trim() || isLoading}
                isLoading={isLoading}
                variant="flat"
                onClick={handleSubmit}
              >
                <Send size={18} />
              </Button>
            }
            placeholder={placeholder}
            radius="lg"
            size="lg"
            startContent={<Search className="text-gray-400" size={20} />}
            value={query}
            variant="bordered"
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="flex justify-between items-center px-2">
          <Dropdown>
            <DropdownTrigger>
              <Button
                endContent={<ChevronDown size={16} />}
                size="sm"
                variant="light"
              >
                Search Options
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Search options"
              selectedKeys={selectedOptions}
              selectionMode="multiple"
              onSelectionChange={(keys) =>
                handleSelectionChange(keys as Set<string>)
              }
            >
              {searchOptions.map((option) => (
                <DropdownItem key={option.key}>{option.name}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <div className="flex gap-1">
            {Array.from(selectedOptions).map((key) => (
              <div
                key={key}
                className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
              >
                {searchOptions.find((option) => option.key === key)?.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
