function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Supervisor feedback for one step: the outcome, rating, comment, and any access
 * change that was recorded.
 *
 * Used by the dashboard, the learning journey, and the supervisor's own history
 * so a review always reads the same way.
 */
export default function ReviewFeedbackCard({ review, heading = "Supervisor feedback" }) {
  if (!review) return null;

  const rating = Number(review.rating);
  const outcome = review.marked_done ? "Marked done" : "Sent back to try again";

  return (
    <section
      className={`review-feedback${review.marked_done ? "" : " review-feedback-retry"}`}
      aria-label={heading}
    >
      <div className="review-feedback-head">
        <strong>{outcome}</strong>
        <span className="review-rating">
          <span aria-hidden="true">
            {"\u2605".repeat(rating)}
            {"\u2606".repeat(Math.max(0, 5 - rating))}
          </span>
          <span className="review-rating-text">{rating} out of 5</span>
        </span>
      </div>

      <p className="review-feedback-text">{review.review}</p>

      {review.access_change && (
        <p className="review-feedback-access">
          <strong>What changed so the step could be done:</strong>{" "}
          {review.access_change}
        </p>
      )}

      <p className="review-feedback-date">
        <time dateTime={review.created_at}>{formatDate(review.created_at)}</time>
      </p>
    </section>
  );
}
