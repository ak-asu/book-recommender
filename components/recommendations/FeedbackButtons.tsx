import { Button, Tooltip } from "@heroui/react";
import { useState } from "react";

import { useAuth } from "../../hooks/useAuth";

import { feedbackService, FeedbackType } from "@/services/feedbackService";
import { useToast } from "@/hooks/useToast";

interface FeedbackButtonsProps {
  bookId: string;
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  bookId,
  onLike,
  onDislike,
  onRegenerate,
}) => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleLike = async () => {
    // Toggle like state
    const newLikeState = !liked;

    setLiked(newLikeState);
    if (disliked) setDisliked(false);

    if (onLike) onLike();

    // Record feedback if user is authenticated
    if (isAuthenticated && user) {
      try {
        setIsSubmitting(true);
        await feedbackService.submitFeedback(
          bookId,
          FeedbackType.LIKE,
          user.uid,
        );
        toast({
          title: "Feedback Recorded",
          description: "Your like has been recorded.",
          variant: "success",
        });
      } catch (err: any) {
        toast({
          title: "Feedback Error",
          description: err.message || "Failed to record feedback.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDislike = async () => {
    // Toggle dislike state
    const newDislikeState = !disliked;

    setDisliked(newDislikeState);
    if (liked) setLiked(false);

    if (onDislike) onDislike();

    // Record feedback if user is authenticated
    if (isAuthenticated && user) {
      try {
        setIsSubmitting(true);
        await feedbackService.submitFeedback(
          bookId,
          FeedbackType.DISLIKE,
          user.uid,
        );
        toast({
          title: "Feedback Recorded",
          description: "Your dislike has been recorded.",
          variant: "success",
        });
      } catch (err: any) {
        toast({
          title: "Feedback Error",
          description: err.message || "Failed to record feedback.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Like this recommendation">
        <Button
          isIconOnly
          aria-label="Like this book"
          className={`${liked ? "bg-success text-white" : ""}`}
          color="success"
          isDisabled={isSubmitting}
          size="sm"
          variant={liked ? "solid" : "bordered"}
          onPress={handleLike}
        >
          <span className="text-xl">👍</span>
        </Button>
      </Tooltip>

      <Tooltip content="Dislike this recommendation">
        <Button
          isIconOnly
          aria-label="Dislike this book"
          className={`${disliked ? "bg-danger text-white" : ""}`}
          color="danger"
          isDisabled={isSubmitting}
          size="sm"
          variant={disliked ? "solid" : "bordered"}
          onPress={handleDislike}
        >
          <span className="text-xl">👎</span>
        </Button>
      </Tooltip>

      {onRegenerate && (
        <Tooltip content="Get new recommendation">
          <Button
            aria-label="Get new recommendation"
            className="ml-2"
            color="primary"
            isDisabled={isSubmitting}
            size="sm"
            variant="light"
            onPress={onRegenerate}
          >
            ↻ Regenerate
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export default FeedbackButtons;
