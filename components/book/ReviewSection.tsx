import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Avatar,
  Textarea,
  Divider,
} from "@heroui/react";

import { useAuth } from "../../hooks/useAuth";
import { getBookReviews, addBookReview } from "../../services/bookService";
import Rating from "../ui/Rating";

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface ReviewSectionProps {
  bookId: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ bookId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, text: "" });
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const data = await getBookReviews(bookId);

        setReviews(data);
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [bookId]);

  const handleAddReview = async () => {
    if (!isAuthenticated || newReview.rating === 0) return;

    try {
      const reviewData = {
        bookId,
        userId: user?.uid as string,
        rating: newReview.rating,
        text: newReview.text,
      };

      await addBookReview(reviewData);

      // Add the new review to the list
      const addedReview = {
        id: Date.now().toString(), // Temporary ID until we get the real one from the backend
        userId: user?.uid as string,
        userName: user?.displayName || "Anonymous",
        userAvatar: user?.photoURL || undefined,
        rating: newReview.rating,
        text: newReview.text,
        createdAt: new Date().toISOString(),
      };

      setReviews([addedReview, ...reviews]);
      setNewReview({ rating: 0, text: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error adding review:", err);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Reviews</h2>
        {isAuthenticated && !showForm && (
          <Button color="primary" onPress={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
        {!isAuthenticated && (
          <Button color="primary" href="/login" variant="bordered">
            Sign In to Review
          </Button>
        )}
      </CardHeader>

      <CardBody>
        {showForm && (
          <div className="mb-6 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Your Review</h3>
            <div className="mb-4">
              <p className="text-sm mb-1">Rating</p>
              <Rating
                value={newReview.rating}
                onChange={(value) =>
                  setNewReview({ ...newReview, rating: value })
                }
              />
            </div>

            <Textarea
              className="mb-4"
              label="Your thoughts on this book"
              minRows={3}
              placeholder="Write your review here..."
              value={newReview.text}
              onChange={(e) =>
                setNewReview({ ...newReview, text: e.target.value })
              }
            />

            <div className="flex justify-end gap-2">
              <Button variant="flat" onPress={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                color="primary"
                isDisabled={newReview.rating === 0}
                onPress={handleAddReview}
              >
                Submit Review
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center py-4">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-center py-8 text-default-500">
            No reviews yet. Be the first to review this book!
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <div key={review.id}>
                <div className="flex gap-4">
                  <Avatar
                    size="md"
                    src={review.userAvatar || "/images/default-avatar.png"}
                  />
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.userName}</span>
                      <span className="text-xs text-default-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Rating
                      readOnly
                      className="my-1"
                      size="sm"
                      value={review.rating}
                    />
                    <p className="text-default-700 mt-1">{review.text}</p>
                  </div>
                </div>
                {index < reviews.length - 1 && <Divider className="mt-4" />}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default ReviewSection;
