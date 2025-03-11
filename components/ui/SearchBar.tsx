import { useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { IoMdClose, IoMdShare, IoMdDownload } from "react-icons/io";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterToggle: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onFilterToggle }) => {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-2 w-full max-w-3xl">
        <button className="p-2 text-gray-500 hover:text-black">
          <FaArrowLeft size={20} />
        </button>
        <input
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search for a book..."
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="p-2 text-gray-500 hover:text-black">
          <FaArrowRight size={20} />
        </button>
      </div>
      <div className="flex gap-4">
        <button className="p-2 bg-gray-200 rounded" onClick={onFilterToggle}>
          Filter
        </button>
        <button className="p-2 bg-gray-200 rounded">
          <IoMdClose size={20} />
        </button>
        <button className="p-2 bg-gray-200 rounded">
          <IoMdShare size={20} />
        </button>
        <button className="p-2 bg-gray-200 rounded">
          <IoMdDownload size={20} />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
