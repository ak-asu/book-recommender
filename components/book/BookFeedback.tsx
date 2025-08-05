import { useState } from "react";
import { ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";

import { Button } from "@heroui/button";
import { FeedbackType } from "@/services/feedbackService";

interface BookFeedbackProps {
  bookId: string;
  onFeedback: (bookId: string, type: FeedbackType) => Promise<void>;
  disabled?: boolean;
}

const BookFeedback = ({
  bookId,
  onFeedback,
  disabled = false,
}: BookFeedbackProps) => {
  const [submitting, setSubmitting] = useState<FeedbackType | null>(null);

  const handleFeedback = async (type: FeedbackType) => {
    if (disabled || submitting) return;

    setSubmitting(type);
    try {
      await onFeedback(bookId, type);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        className="text-green-500 hover:bg-green-500/10"
        disabled={disabled || submitting === FeedbackType.LIKE}
        size="sm"
        variant="ghost"
        onClick={() => handleFeedback(FeedbackType.LIKE)}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        Like
      </Button>
      <Button
        className="text-red-500 hover:bg-red-500/10"
        disabled={disabled || submitting === FeedbackType.DISLIKE}
        size="sm"
        variant="ghost"
        onClick={() => handleFeedback(FeedbackType.DISLIKE)}
      >
        <ThumbsDown className="h-4 w-4 mr-1" />
        Dislike
      </Button>
      <Button
        className="text-blue-500 hover:bg-blue-500/10 ml-auto"
        disabled={disabled || submitting === FeedbackType.REGENERATE}
        size="sm"
        variant="ghost"
        onClick={() => handleFeedback(FeedbackType.REGENERATE)}
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Regenerate
      </Button>
    </div>
  );
};

export default BookFeedback;
