import {
  raiseUserSafeError,
  requireSupabaseClient,
  requireUserId,
  unwrap,
} from "./helpers.js";

/**
 * Reviews for one learner on one pathway, newest first.
 */
export async function listReviews(learnerId, pathwayId) {
  const client = requireSupabaseClient();

  const response = await client
    .from("task_reviews")
    .select("*")
    .eq("learner_id", learnerId)
    .eq("pathway_id", pathwayId)
    .order("created_at", { ascending: false });

  const rows = unwrap(
    response,
    "Could not load reviews",
    "We could not load the reviews. Please try again."
  );

  return rows ?? [];
}

/**
 * The newest review per task, so a page can show one line per step.
 */
export function latestReviewByTask(reviews) {
  const latest = new Map();
  for (const review of reviews ?? []) {
    if (!latest.has(review.task_id)) {
      latest.set(review.task_id, review);
    }
  }
  return latest;
}

export async function createReview({
  learnerId,
  pathwayId,
  taskId,
  markedDone,
  rating,
  review,
  accessChange = "",
}) {
  const client = requireSupabaseClient();
  const reviewerId = await requireUserId();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    raiseUserSafeError(
      "Rejected a review with an invalid rating",
      "Choose a rating from 1 to 5."
    );
  }

  if (!review?.trim()) {
    raiseUserSafeError(
      "Rejected a review with no comment",
      "Write a short comment for the learner."
    );
  }

  const response = await client
    .from("task_reviews")
    .insert({
      learner_id: learnerId,
      pathway_id: pathwayId,
      task_id: taskId,
      reviewer_id: reviewerId,
      marked_done: markedDone,
      rating,
      review: review.trim(),
      access_change: accessChange.trim() || null,
    })
    .select("*")
    .single();

  return unwrap(
    response,
    "Could not save the review",
    "We could not save that review. Please try again."
  );
}
