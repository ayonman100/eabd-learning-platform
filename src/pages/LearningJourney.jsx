import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import { useLearner } from "../context/LearnerContext.jsx";
import { getPathwayOrFirst } from "../data/learningPaths.js";
import { listTaskProgress, startTask, submitTask } from "../lib/db/progress.js";
import { latestReviewByTask, listReviews } from "../lib/db/reviews.js";
import {
  getProgressSummary,
  getWeekStatus,
  getNextTask,
} from "../utils/progress.js";
import ReviewFeedbackCard from "../components/ui/ReviewFeedbackCard.jsx";
import { ErrorMessage, StatusMessage } from "../components/ui/StatusBanner.jsx";

const WEEK_STATUS_LABELS = {
  available: "Available",
  complete: "Week complete",
  locked: "Locked",
  review: "With your supervisor",
};

export default function LearningJourney() {
  const { learner, loading: learnerLoading } = useLearner();
  const [searchParams] = useSearchParams();
  const pathway = getPathwayOrFirst(searchParams.get("pathway"));

  const [rows, setRows] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyTask, setBusyTask] = useState("");
  const [returnedFromCanva, setReturnedFromCanva] = useState("");

  const learnerId = learner?.id ?? null;

  const load = useCallback(async () => {
    if (!learnerId) return;
    const [nextRows, nextReviews] = await Promise.all([
      listTaskProgress(learnerId, pathway.id),
      listReviews(learnerId, pathway.id),
    ]);
    setRows(nextRows);
    setReviews(nextReviews);
    setLoaded(true);
  }, [learnerId, pathway.id]);

  useEffect(() => {
    if (learnerLoading) return undefined;
    if (!learnerId) return undefined;

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
  }, [learnerLoading, learnerId, load]);

  // Coming back from Canva is the moment to offer the submit form.
  useEffect(() => {
    function handleFocus() {
      if (document.visibilityState !== "visible") return;
      setReturnedFromCanva((current) => current || pendingTaskId());
    }

    function pendingTaskId() {
      try {
        return window.sessionStorage.getItem("eabd-pending-task") ?? "";
      } catch {
        return "";
      }
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const summary = getProgressSummary(pathway, rows);
  const next = getNextTask(pathway, rows);
  const latestReview = latestReviewByTask(reviews);

  async function handleStart(task) {
    setError("");
    setNotice("");
    setBusyTask(task.id);

    try {
      const saved = await startTask(learnerId, pathway.id, task.id);
      setRows((current) => {
        const without = current.filter((row) => row.task_id !== task.id);
        return [...without, saved];
      });

      try {
        window.sessionStorage.setItem("eabd-pending-task", task.id);
      } catch {
        // Session storage is a nicety, not a requirement.
      }

      window.open(task.canvaUrl, "_blank", "noopener,noreferrer");
      setNotice("Canva opened in a new tab. Come back when you are ready.");
    } catch (startError) {
      setError(startError.message);
    } finally {
      setBusyTask("");
    }
  }

  async function handleSubmit(task, designLink, note) {
    setError("");
    setNotice("");
    setBusyTask(task.id);

    try {
      const saved = await submitTask(learnerId, pathway.id, task.id, {
        designLink,
        note,
      });
      setRows((current) => {
        const without = current.filter((row) => row.task_id !== task.id);
        return [...without, saved];
      });
      setReturnedFromCanva("");
      try {
        window.sessionStorage.removeItem("eabd-pending-task");
      } catch {
        // Ignore storage failures.
      }
      setNotice("Sent to your supervisor. You can carry on with the next step.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusyTask("");
    }
  }

  if (learnerLoading || !loaded) {
    return (
      <main id="main-content" className="learning-page" aria-live="polite">
        <p>Loading your journey...</p>
      </main>
    );
  }

  if (!learner) {
    return (
      <main id="main-content" className="learning-page">
        <p role="status" className="status-message">
          Finish setting up your record before starting the pathway.
        </p>
        <p>
          <Link to="/onboarding">Continue setting up</Link>
        </p>
      </main>
    );
  }

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
            Each step opens in Canva. When you are ready, send it to your
            supervisor, who marks it done or asks for another try. The next week
            opens once every step in this one is sent or reviewed.
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
            value={summary.doneCount}
            max={summary.totalTasks || 1}
            aria-label={`${summary.doneCount} of ${summary.totalTasks} steps done`}
          />

          <p className="learning-progress-count">
            {summary.doneCount} of {summary.totalTasks} steps done
            {" · "}
            {summary.reviewedCount} reviewed by your supervisor
            {" · "}
            {summary.remainingCount} left
          </p>

          {next && (
            <p className="learning-next">
              Next step: <strong>{next.task.title}</strong>
            </p>
          )}
        </section>

        <StatusMessage>{notice}</StatusMessage>
        <ErrorMessage>{error}</ErrorMessage>

        {returnedFromCanva && (
          <SubmitPanel
            task={findTask(pathway, returnedFromCanva)}
            busy={busyTask === returnedFromCanva}
            onSubmit={handleSubmit}
            onDismiss={() => setReturnedFromCanva("")}
          />
        )}

        <section className="learning-weeks" aria-label="Learning pathway weeks">
          {pathway.weeks.map((week, weekIndex) => {
            const status = getWeekStatus(pathway, rows, weekIndex);
            const locked = status === "locked";

            return (
              <article
                key={week.id}
                className={`learning-week learning-week-${status}`}
                aria-labelledby={`${week.id}-heading`}
              >
                <div className="learning-week-header">
                  <div>
                    <p className="learning-eyebrow">WEEK {weekIndex + 1}</p>
                    <h2 id={`${week.id}-heading`}>{week.title}</h2>
                    <p>{week.objective}</p>
                  </div>

                  <span className={`learning-week-status status-${status}`}>
                    {locked && <LockKeyhole size={15} aria-hidden="true" />}
                    {status === "complete" && (
                      <CheckCircle2 size={15} aria-hidden="true" />
                    )}
                    {status === "review" && (
                      <Clock size={15} aria-hidden="true" />
                    )}
                    {WEEK_STATUS_LABELS[status]}
                  </span>
                </div>

                {locked && (
                  <p className="learning-locked-message">
                    Send every step in the previous week before this week opens.
                  </p>
                )}

                <ul className="learning-task-list">
                  {week.tasks.map((task) => {
                    const row = rows.find((item) => item.task_id === task.id);
                    const taskStatus = row?.status ?? "not-started";
                    const review = latestReview.get(task.id);

                    return (
                      <li className="learning-task" key={task.id}>
                        <div className="learning-task-head">
                          <span className="learning-task-icon" aria-hidden="true">
                            {taskStatus === "reviewed" ? (
                              <CheckCircle2 size={22} />
                            ) : taskStatus === "submitted" ? (
                              <Clock size={22} />
                            ) : taskStatus === "started" ? (
                              <ShieldAlert size={22} />
                            ) : (
                              <Circle size={22} />
                            )}
                          </span>

                          <div className="learning-task-copy">
                            <strong>{task.title}</strong>
                            <span>{task.description}</span>
                            <span className="learning-task-status">
                              {statusLabel(taskStatus)}
                            </span>
                          </div>
                        </div>

                        {!locked && (
                          <div className="learning-task-actions">
                            <button
                              type="button"
                              className="learning-flag-button"
                              onClick={() => handleStart(task)}
                              disabled={busyTask === task.id || taskStatus === "submitted"}
                            >
                              Start in Canva
                              <ArrowRight size={16} aria-hidden="true" />
                            </button>

                            <SubmitPanel
                              task={task}
                              busy={busyTask === task.id}
                              onSubmit={handleSubmit}
                              inline
                              disabled={taskStatus === "submitted"}
                            />
                          </div>
                        )}

                        {review && (
                          <ReviewFeedbackCard
                            review={review}
                            heading={`Feedback for ${task.title}`}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>

                {status === "complete" && (
                  <p className="learning-week-complete">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    Every step this week is reviewed.
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <footer className="learning-footer">
          <p>
            The goal is meaningful progress, not speed. Ask for the support or
            access adjustments that help you take part.
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

function statusLabel(status) {
  if (status === "reviewed") return "Reviewed";
  if (status === "submitted") return "With your supervisor";
  if (status === "started") return "Started";
  return "Not started";
}

function findTask(pathway, taskId) {
  for (const week of pathway.weeks) {
    const task = week.tasks.find((candidate) => candidate.id === taskId);
    if (task) return task;
  }
  return null;
}

/**
 * The submit form, used both in the "Back from Canva?" panel and inline on each
 * task, so the design link and note fields are written once.
 */
function SubmitPanel({
  task,
  busy,
  onSubmit,
  onDismiss,
  inline = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(inline ? false : true);
  const [designLink, setDesignLink] = useState("");
  const [note, setNote] = useState("");

  if (!task) return null;

  if (!open && inline) {
    return (
      <button
        type="button"
        className="button-quiet"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Send for review
      </button>
    );
  }

  return (
    <form
      className={inline ? "submit-panel submit-panel-inline" : "submit-panel"}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(task, designLink, note);
      }}
    >
      <h3>{inline ? "Send this step for review" : "Back from Canva?"}</h3>
      <p className="auth-help">
        Add a link to your design if you have one, and anything you want your
        supervisor to know.
      </p>

      <div className="auth-field">
        <label htmlFor={`design-link-${task.id}`}>
          Link to your design (optional)
        </label>
        <input
          id={`design-link-${task.id}`}
          type="url"
          inputMode="url"
          placeholder="https://www.canva.com/design/..."
          value={designLink}
          onChange={(event) => setDesignLink(event.target.value)}
        />
      </div>

      <div className="auth-field">
        <label htmlFor={`note-${task.id}`}>Note for your supervisor (optional)</label>
        <textarea
          id={`note-${task.id}`}
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <div className="onboarding-actions">
        {onDismiss && (
          <button type="button" className="button-quiet" onClick={onDismiss}>
            Not yet
          </button>
        )}
        <button type="submit" disabled={busy}>
          {busy ? "Sending..." : "Send for review"}
        </button>
      </div>
    </form>
  );
}
