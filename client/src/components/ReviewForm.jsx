import { useState } from "react";
import api from "../services/api";
import "./ReviewForm.css";

const ReviewForm = ({
  orderId,
  productId,
  productName,
  onSubmitted,
}) => {
  const [rating, setRating] =
    useState(5);

  const [comment, setComment] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const submitReview = async () => {
    try {
      setLoading(true);

      await api.post("/reviews", {
        orderId,
        productId,
        rating,
        comment,
      });

      alert(
        "Review submitted successfully"
      );

      setComment("");

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to submit review"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form">
      <h4>
        Review {productName}
      </h4>

      <div className="rating-buttons">
        {[1, 2, 3, 4, 5].map(
          (number) => (
            <button
              key={number}
              type="button"
              onClick={() =>
                setRating(number)
              }
              className={
                number <= rating
                  ? "active-star"
                  : ""
              }
            >
              ★
            </button>
          )
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) =>
          setComment(e.target.value)
        }
        placeholder="Write your feedback..."
        maxLength={500}
      />

      <button
        onClick={submitReview}
        disabled={loading}
      >
        {loading
          ? "Submitting..."
          : "Submit Review"}
      </button>
    </div>
  );
};

export default ReviewForm;