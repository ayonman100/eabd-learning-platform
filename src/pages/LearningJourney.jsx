
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Flag,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { learningPaths } from "../data/learningPaths.js";
import {
  clearTaskReview,
  flagTaskForReview,
  getProgressSummary,
  getWeekStatus,
  loadProgress,
  saveProgress,
  updateTaskCompletion,
} from "../utils/progress.js";

export default function LearningJourney() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const requestedPathway = searchParams.get("pathway");
  const pathway =
    learningPaths.find((item) => item.id === requestedPathway) ||
    learningPaths[0];

  const learnerId = user?.id;

  const [progress, setProgress] = useState(() =>
    loadProgress(learnerId, pathway)
  );
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function persistProgress(nextProgress) {
    setError("");

    if (!learnerId) {
      setError("Sign in to save progress for your learner account.");
      return false;
    }

    const result = saveProgress(learnerId, pathway, nextProgress);

    if (!result.ok) {
      setError(result.error);
      return false;
    }

    setProgress(result.progress);
    return true;
  }

  function handleTaskChange(taskId, completed) {
    setNotice("");

    const result = updateTaskCompletion(
      pathway,
      progress,
      taskId,
      completed
    );

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (persistProgress(result.progress)) {
      setNotice("Your task progress has been saved in this browser.");
    }
  }

  function handleFlagForReview(taskId) {
    setNotice("");

    const result = flagTaskForReview(
      pathway,
      progress,
      taskId,
      "Learner has requested a review of this step."
    );

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (persistProgress(result.progress)) {
      setNotice(
        "Review requested. Later weeks remain locked until this review is cleared."
      );
    }
  }

  function handleDemoReviewClear(taskId) {
    setNotice("");

    const result = clearTaskReview(pathway, progress, taskId);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (persistProgress(result.progress)) {
      setNotice(
        "Demo review cleared. This simulates reviewer approval and is not a secure reviewer workflow."
      );
    }
  }

  const summary = getProgressSummary(pathway, progress);

  return (
    <main id="main-content" className="learning-page" tabIndex="-1">
      <div className="learning-page-inner">
        <Link className="learning-back-link" to="/dashboard">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to dashboard
        </Link>

        <header className="learning-intro">
          <p className="learning-eyebrow">YOUR LEARNING JOURNEY</p>
          <h1>{pathway.title}</h1>
          <p>{pathway.description}</p>
          <p>
            Work through each week at a pace that suits you. If a task needs
            review, the next week stays locked until the review is cleared.
          </p>
        </header>

        <section
          className="learning-progress-card"
          aria-labelledby="progress-heading"
        >
          <div className="learning-progress-heading">
            <div>
              <p className="learning-eyebrow">YOUR PROGRESS</p>
              <h2 id="progress-heading">Keep moving at your pace</h2>
            </div>
            <strong>{summary.percentage}%</strong>
          </div>

          <progress
            className="learning-progress-bar"
            value={summary.completedCount}
            max={summary.totalTasks || 1}
            aria-label={`${summary.completedCount} of ${summary.totalTasks} tasks completed`}
          />

          <p className="learning-progress-count">
            {summary.completedCount} of {summary.totalTasks} tasks completed
            {" · "}
            {summary.remainingCount} remaining
          </p>
        </section>

        <p className="learning-storage-note">
          Demo storage: progress is saved in this browser for your signed-in
          learner ID. It is not yet synchronised to Supabase.
        </p>

        {notice && (
          <p className="learning-notice" role="status">
            {notice}
          </p>
        )}

        {error && (
          <p className="learning-error" role="alert">
            {error}
          </p>
        )}

        <section
          className="learning-weeks"
          aria-label="Four-week learning pathway"
        >
          {pathway.weeks.map((week, weekIndex) => {
            const status = getWeekStatus(pathway, progress, weekIndex);
            const locked = status === "locked";

            const statusLabel = {
              available: "Available",
              complete: "Week complete",
              locked: "Locked",
              review: "Review pending",
            }[status];

            return (
              <article
                className={`learning-week learning-week-${status}`}
                key={week.id}
                aria-labelledby={`${week.id}-heading`}
              >
                <div className="learning-week-header">
                  <div>
                    <p className="learning-eyebrow">
                      WEEK {weekIndex + 1}
                    </p>
                    <h2 id={`${week.id}-heading`}>{week.title}</h2>
                    <p>{week.objective}</p>
                  </div>

                  <span className={`learning-week-status status-${status}`}>
                    {locked && <LockKeyhole size={15} aria-hidden="true" />}
                    {status === "complete" && (
                      <CheckCircle2 size={15} aria-hidden="true" />
                    )}
                    {status === "review" && (
                      <ShieldAlert size={15} aria-hidden="true" />
                    )}
                    {statusLabel}
                  </span>
                </div>

                {locked && (
                  <p className="learning-locked-message">
                    Complete the previous week and resolve any pending reviews
                    to unlock these tasks.
                  </p>
                )}

                <div className="learning-task-list">
                  {week.tasks.map((task) => {
                    const completed = progress.completedTasks.includes(task.id);
                    const review = progress.reviewFlags[task.id];
                    const pendingReview = review?.status === "pending";

                    return (
                      <div className="learning-task" key={task.id}>
                        <label className="learning-task-checkbox">
                          <input
                            type="checkbox"
                            checked={completed}
                            disabled={locked || pendingReview || !learnerId}
                            onChange={(event) =>
                              handleTaskChange(task.id, event.target.checked)
                            }
                          />

                          <span className="learning-task-icon" aria-hidden="true">
                            {completed ? (
                              <CheckCircle2 size={22} />
                            ) : (
                              <Circle size={22} />
                            )}
                          </span>

                          <span className="learning-task-copy">
                            <strong>{task.title}</strong>
                            <span>{task.description}</span>
                          </span>
                        </label>

                        {pendingReview && (
                          <div className="learning-review-notice">
                            <ShieldAlert size={18} aria-hidden="true" />
                            <div>
                              <strong>Awaiting review</strong>
                              <p>
                                This step needs review before the next week
                                can unlock.
                              </p>
                            </div>

                            <button
                              className="learning-demo-review-button"
                              type="button"
                              onClick={() => handleDemoReviewClear(task.id)}
                            >
                              Simulate reviewer approval
                            </button>
                            <small>
                              Demo only. This button is not a secure reviewer
                              permission system.
                            </small>
                          </div>
                        )}

                        {!pendingReview && !locked && (
                          <button
                            className="learning-flag-button"
                            type="button"
                            onClick={() => handleFlagForReview(task.id)}
                            aria-label={`Flag ${task.title} for review`}
                          >
                            <Flag size={16} aria-hidden="true" />
                            Flag for review
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {status === "complete" && (
                  <p className="learning-week-complete">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    All tasks in this week are complete.
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <footer className="learning-footer">
          <p>
            The goal is meaningful progress, not speed. Ask for the support or
            access adjustments that help you participate.
          </p>
          <Link to="/account">
            View learner account
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
