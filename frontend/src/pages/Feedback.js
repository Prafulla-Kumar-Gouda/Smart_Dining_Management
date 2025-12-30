import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api";
import "./Feedback.css";

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = new URLSearchParams(location.search).get("order_id");

  useEffect(() => {
    if (!orderId) {
      setError("Invalid order ID. Please try again.");
      setTimeout(() => navigate("/food-ordering"), 3000);
    }
  }, [orderId, navigate]);

  const handleRating = (value) => {
    setRating(value);
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post("/submit-feedback", {
        order_id: orderId,
        rating,
        feedback,
      });
      if (response.data.success) {
        alert("Thank you for your feedback!");
        navigate("/food-ordering");
      } else {
        setError(response.data.message || "Failed to submit feedback.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-container">
      <div className="feedback-modal">
        <h2 className="feedback-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 17.75l-6.172 3.245 1.179-6.873-5-4.867 6.9-1 3.086-6.25 3.085 6.25 6.9 1-5 4.867 1.179 6.873z" />
          </svg>
          Rate Your Order
        </h2>
        <p className="feedback-subtitle">We value your feedback!</p>

        <div className="rating-section">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${rating >= star ? "filled" : ""}`}
              onClick={() => handleRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          className="feedback-textarea"
          placeholder="Share your feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows="5"
        />

        {error && (
          <div className="error-message">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="loading">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              Submitting...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Feedback;
