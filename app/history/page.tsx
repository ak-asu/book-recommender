import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, History, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { RootState } from "@/store";
import {
  removeFromHistory,
  setQuery,
  searchBooks,
} from "@/store/slices/booksSlice";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import HistoryActions from "@/components/HistoryActions";

const HistoryPage = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const { history } = useSelector((state: RootState) => state.books);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-booktrack-dark">
        <Navbar />
        <div className="container mx-auto py-16 px-4 text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Please login to view your search history
          </h2>
          <Link to="/">
            <Button className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRemoveHistoryItem = (id: string) => {
    dispatch(removeFromHistory(id));
    toast.success("Search removed from history");
  };

  const handleReloadSearch = (query: string) => {
    dispatch(setQuery(query));
    dispatch(searchBooks({ query }));
    toast.success("Search reloaded");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col bg-booktrack-dark">
      <Navbar />

      <div className="container mx-auto py-8 px-4">
        <Link
          className="flex items-center text-booktrack-gold mb-6 hover:underline"
          to="/"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Search History</h1>
          {history.length > 0 && <HistoryActions />}
        </div>

        {history.length === 0 ? (
          <div className="bg-booktrack-darkgray rounded-lg p-8 text-center">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-medium text-white mb-2">
              No search history
            </h3>
            <p className="text-gray-400 mb-4">
              Your search history will appear here
            </p>
            <Link to="/">
              <Button className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80">
                Start Searching
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-booktrack-darkgray rounded-lg overflow-hidden">
            <div className="p-4 border-b border-booktrack-lightgray">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-2 font-medium text-gray-400">Date</div>
                <div className="col-span-8 font-medium text-gray-400">
                  Search Query
                </div>
                <div className="col-span-2 font-medium text-gray-400">
                  Actions
                </div>
              </div>
            </div>

            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 border-b border-booktrack-lightgray hover:bg-booktrack-lightgray/30"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2 text-gray-300 text-sm">
                    {formatDate(item.timestamp)}
                  </div>
                  <div className="col-span-8">
                    <Link to="/" onClick={() => handleReloadSearch(item.query)}>
                      <p className="text-white hover:text-booktrack-gold">
                        {item.query}
                      </p>
                    </Link>
                  </div>
                  <div className="col-span-2 flex space-x-2">
                    <Button
                      className="text-booktrack-gold hover:bg-booktrack-gold/10"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleReloadSearch(item.query)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      className="text-red-400 hover:bg-red-400/10"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveHistoryItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
