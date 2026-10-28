import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getLearner } from "../../lib/db/learners.js";
import { listTaskProgress } from "../../lib/db/progress.js";
import { createReview, listReviews, latestReviewByTask } from "../../lib/db/reviews.js";
import { getPathwayOrFirst } from "../../data/learningPaths.js";
import PersonRoomSummary from "../../components/ui/PersonRoomSummary.jsx";
import ReviewFeedbackCard from "../../components/ui/ReviewFeedbackCard.jsx";
import { ErrorMessage, StatusMessage } from "../../components/ui/StatusBanner.jsx";

const RATINGS = [1, 2, 3, 4, 5];

export default function SupervisorLearner() {
  const { learnerId } = useParams();
  const [searchParams] = useSearchParams();
  const pathway = getPathwayOrFirst(searchParams.get("pathway"));

  const [learner, setLearner] = useState(null);
  const [progress, setProgress] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [savingTask, setSavingTask] = useState("");

  const load = useCallback(async () => {
    const [nextLearner, nextProgress, nextReviews] = await Promise.all([
      getLearner(learnerId),
      listTaskProgress(learnerId, pathway.id),
      listReviews(learnerId, pathway.id),
    ]);
    setLearner(nextLearner);
    setProgress(nextProgress);
    setReviews(nextReviews);
    setLoaded(true);
  }, [learnerId, pathway.id]);

  useEffect(() => {
    let active = true;

    load().catch((loadError) => {
      if (active) {
        setError(loadError.message);
        setLoaded(true);
      }
    });

    return () => {
      active = false;
    };
  }, [load]);

  const loading = !loaded;

  const progressByTask = new Map(progress.map((row) => [row.task_id, row]));
  const latestReview = latestReviewByTask(reviews);

  async function handleReview(taskId, formData) {
    setSavingTask(taskId);
    setError("");
    setStatus("");

    try {
      await createReview({
        learnerId,
        pathwayId: pathway.id,
        taskId,
        markedDone: formData.markedDone,
        rating: Number(formData.rating),
        review: formData.review,
        accessChange: formData.accessChange,
      });
      await load();
      setStatus("Review saved.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingTask("");
    }
  }

  if (loading) {
    return (
      <main id="main-content" className="supervisor-page" aria-live="polite">
        <p>Loading the learner record...</p>
      </main>
    );
  }

  if (!learner) {
    return (
      <main id="main-content" className="supervisor-page">
        <p role="alert" className="error-message">
          {error || "That learner record could not be found."}
        </p>
        <p>
          <Link to="/supervisor">Back to your learners</Link>
        </p>
      </main>
    );
  }

  return (
    <main id="main-content" className="supervisor-page" tabIndex="-1">
      <div className="supervisor-inner">
        <header className="supervisor-intro">
          <p className="auth-eyebrow">SUPERVISOR REVIEW</p>
          <h1>{learner.first_name}</h1>
          <p>Pathway: {pathway.title}</p>
          <Link to="/supervisor">Back to your learners</Link>
        </header>

        <StatusMessage>{status}</StatusMessage>
        <ErrorMessage>{error}</ErrorMessage>

        <PersonRoomSummary learner={learner} />

        <section aria-labelledby="goals-heading" className="profile-section">
          <h2 id="goals-heading">Goal</h2>
          <dl className="summary-list">
            <div>
              <dt>Goal</dt>
              <dd>{learner.goal || "Not given"}</dd>
            </div>
            <div>
              <dt>Starting point</dt>
              <dd>{learner.starting_point || "Not given"}</dd>
            </div>
            <div>
              <dt>Barriers</dt>
              <dd>{learner.barriers || "Not given"}</dd>
            </div>
            <div>
              <dt>Support</dt>
              <dd>{learner.support || "Not given"}</dd>
            </div>
            <div>
              <dt>Pace</dt>
              <dd>{learner.learning_pace || "Not given"}</dd>
            </div>
          </dl>
        </section>

        {pathway.weeks.map((week, weekIndex) => (
          <section
            key={week.id}
            aria-labelledby={`${week.id}-supervisor-heading`}
            className="profile-section"
          >
            <h2 id={`${week.id}-supervisor-heading`}>
              Week {weekIndex + 1}: {week.title.replace(/^Week \d+: /, "")}
            </h2>

            {week.tasks.map((task) => {
              const row = progressByTask.get(task.id);
              const review = latestReview.get(task.id);
              const awaiting = row?.status === "submitted";

              return (
                <article className="supervisor-task" key={task.id}>
                  <h3>{task.title}</h3>
                  <p className="auth-help">
                    Status: {row?.status ?? "not started"}
                  </p>

                  {row?.design_link && (
                    <p>
                      <a href={row.design_link} target="_blank" rel="noreferrer">
                        Open the learner's design
                      </a>
                    </p>
                  )}

                  {row?.learner_note && (
                    <p className="supervisor-note">{row.learner_note}</p>
                  )}

                  <p className="supervisor-prompt">
                    <strong>What to check:</strong> {task.reviewPrompt}
                  </p>

                  {awaiting ? (
                    <ReviewForm
                      taskId={task.id}
                      saving={savingTask === task.id}
                      onSubmit={handleReview}
                    />
                  ) : (
                    <p className="auth-help">
                      This step is not waiting for review.
                    </p>
                  )}

                  {review && <ReviewFeedbackCard review={review} />}
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </main>
  );
}

function ReviewForm({ taskId, saving, onSubmit }) {
  const [markedDone, setMarkedDone] = useState(true);
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [accessChange, setAccessChange] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!rating) {
      setLocalError("Choose a rating from 1 to 5.");
      return;
    }
    if (!review.trim()) {
      setLocalError("Write a short comment for the learner.");
      return;
    }

    setLocalError("");
    onSubmit(taskId, { markedDone, rating, review, accessChange });
  }

  return (
    <form className="supervisor-review-form" onSubmit={handleSubmit}>
      <fieldset className="onboarding-fieldset">
        <legend>Did they do the step?</legend>
        <label className="onboarding-option">
          <input
            type="radio"
            name={`done-${taskId}`}
            checked={markedDone}
            onChange={() => setMarkedDone(true)}
          />
          <span>
            <strong>Done</strong>
          </span>
        </label>
        <label className="onboarding-option">
          <input
            type="radio"
            name={`done-${taskId}`}
            checked={!markedDone}
            onChange={() => setMarkedDone(false)}
          />
          <span>
            <strong>Not yet</strong>
          </span>
        </label>
      </fieldset>

      <fieldset className="onboarding-fieldset">
        <legend>Rating from 1 to 5</legend>
        <div className="segmented-options" role="group" aria-label="Rating from 1 to 5">
          {RATINGS.map((value) => (
            <button
              key={value}
              type="button"
              className="segmented-option"
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="field-hint">
          1 is just starting, 5 is done with care and independence.
        </p>
      </fieldset>

      <div className="auth-field">
        <label htmlFor={`review-${taskId}`}>Comment for the learner</label>
        <textarea
          id={`review-${taskId}`}
          rows={3}
          value={review}
          onChange={(event) => setReview(event.target.value)}
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor={`access-${taskId}`}>
          What changed so the step could be done? (optional)
        </label>
        <textarea
          id={`access-${taskId}`}
          rows={2}
          value={accessChange}
          onChange={(event) => setAccessChange(event.target.value)}
        />
      </div>

      {localError && (
        <p role="alert" className="error-message">
          {localError}
        </p>
      )}

      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save review"}
      </button>
    </form>
  );
}
