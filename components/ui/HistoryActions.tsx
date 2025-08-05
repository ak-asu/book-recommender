import { useState } from "react";
import { Share, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RootState } from "@/store";
import { clearHistory } from "@/store/slices/booksSlice";
import { exportService, ExportFormat } from "@/services/exportService";

interface HistoryActionsProps {
  onClear?: () => void;
}

const HistoryActions = ({ onClear }: HistoryActionsProps) => {
  const dispatch = useDispatch();
  const [exportFormat, setExportFormat] = useState<ExportFormat>(
    ExportFormat.JSON,
  );
  const { history } = useSelector((state: RootState) => state.books);

  const handleExport = () => {
    try {
      if (history.length === 0) {
        toast.error("No search history to export");
        return;
      }

      const content = exportService.exportHistory(history, exportFormat);
      const fileExtension =
        exportFormat === ExportFormat.PDF ? "pdf" : exportFormat;
      const mimeTypes: Record<ExportFormat, string> = {
        [ExportFormat.JSON]: "application/json",
        [ExportFormat.CSV]: "text/csv",
        [ExportFormat.PDF]: "application/pdf",
        [ExportFormat.TEXT]: "text/plain",
      };

      exportService.downloadFile(
        content,
        `booktrack-history-${new Date().toISOString().split("T")[0]}.${fileExtension}`,
        mimeTypes[exportFormat],
      );

      toast.success("History exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export history");
    }
  };

  const handleShare = async () => {
    try {
      if (history.length === 0) {
        toast.error("No search history to share");
        return;
      }

      // If Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: "My BookTrack Search History",
          text: "Check out my book search history from BookTrack",
          url: window.location.href,
        });
        toast.success("Shared successfully");
      } else {
        // Fallback to copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share history");
    }
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to clear your entire search history?",
      )
    ) {
      dispatch(clearHistory());
      if (onClear) onClear();
      toast.success("Search history cleared");
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="border-booktrack-lightgray text-white hover:bg-booktrack-lightgray/30"
            size="sm"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 bg-booktrack-darkgray border-booktrack-lightgray text-white">
          <div className="space-y-4">
            <h3 className="font-medium">Export History</h3>
            <Select
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="bg-booktrack-darkgray border-booktrack-lightgray text-white">
                <SelectItem value={ExportFormat.JSON}>JSON</SelectItem>
                <SelectItem value={ExportFormat.CSV}>CSV</SelectItem>
                <SelectItem value={ExportFormat.TEXT}>Plain Text</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="w-full bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80"
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        className="border-booktrack-lightgray text-white hover:bg-booktrack-lightgray/30"
        size="sm"
        variant="outline"
        onClick={handleShare}
      >
        <Share className="h-4 w-4 mr-1" />
        Share
      </Button>

      <Button
        className="border-red-500 text-red-500 hover:bg-red-500/10"
        size="sm"
        variant="outline"
        onClick={handleClearHistory}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Clear
      </Button>
    </div>
  );
};

export default HistoryActions;
