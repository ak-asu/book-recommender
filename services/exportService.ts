import { SearchQuery } from "@/types";

export enum ExportFormat {
  JSON = "json",
  CSV = "csv",
  PDF = "pdf",
  TEXT = "txt",
}

export const exportService = {
  exportHistory: (history: SearchQuery[], format: ExportFormat): string => {
    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(history, null, 2);

      case ExportFormat.CSV:
        // Simple CSV export - headers and data rows
        const headers = "Query,Timestamp\n";
        const rows = history
          .map(
            (item) =>
              `"${item.query.replace(/"/g, '""')}",${new Date(item.timestamp).toISOString()}`,
          )
          .join("\n");
        return headers + rows;

      case ExportFormat.TEXT:
        // Simple text format
        return history
          .map(
            (item) =>
              `Query: ${item.query}\nTimestamp: ${new Date(item.timestamp).toLocaleString()}`,
          )
          .join("\n\n");

      default:
        throw new Error("Unsupported export format");
    }
  },

  downloadFile: (content: string, fileName: string, fileType: string): void => {
    // Create a blob with the content
    const blob = new Blob([content], { type: fileType });

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    // Append the link to the body, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Release the URL object
    URL.revokeObjectURL(url);
  },
};
