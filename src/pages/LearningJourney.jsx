
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Circle,
  LockKeyhole,
  Send,
  ShieldAlert,
} from "lucide-react";
import { useLearner } from "../context/LearnerContext.jsx";
import { getPathwayOrFirst } from "../data/learningPaths.js";
import { listTaskProgress, submitTask } from "../lib/db/progress.js";
import { latestReviewByTask, listReviews } from "../lib/db/reviews.js";
import {
  getProgressSummary,
  getWeekStatus,
  getNextTask,
} from "../utils/progress.js";
import ReviewFeedbackCard from "../components/ui/ReviewFeedbackCard.jsx";
import {
  ErrorMessage,
  StatusMessage,
} from "../components/ui/StatusBanner.jsx";
import Button from "../components/ui/Button.jsx";
import CollapsiblePanel from "../components/ui/CollapsiblePanel.jsx";

const WEEK_STATUS_LABELS = {
  available: "Ready",
  complete: "Reviewed",
  locked: "Locked",
  review: "In progress",
};

const WEEK_STATUS_PILL = {
  available: "pill-progress",
  complete: "pill-success",
  locked: "pill-locked",
  review: "pill-waiting",
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
  const [openWeek, setOpenWeek] = useState(null);

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
    if (learnerLoading || !learnerId) return undefined;

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

  const summary = getProgressSummary(pathway, rows);
  const next = getNextTask(pathway, rows);

  const latestReview = useMemo(
    () => latestReviewByTask(reviews),
    [reviews]
  );

  useEffect(() => {
    if (!loaded || openWeek !== null) return;

    if (next) {
      setOpenWeek(next.weekIndex);
    }
  }, [loaded, next, openWeek]);

  async function handleSubmit(task, designLink, note) {
    setError("");
    setNotice("");
    setBusyTask(task.id);

    try {
      const saved = await submitTask(
        learnerId,
        pathway.id,
        task.id,
        {
          designLink,
          note,
        }
      );

      setRows((current) => [
        ...current.filter((row) => row.task_id !== task.id),
        saved,
      ]);

      setNotice(
        "Sent to your supervisor. You can carry on with the next step."
      );
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusyTask("");
    }
  }

  if (learnerLoading) {
    return (
      <main id="main-content" className="page" aria-live="polite">
        <div className="page-inner">
          <p>Loading your journey...</p>
        </div>
      </main>
    );
  }

  if (!learner) {
    return (
      <main id="main-content" className="page" tabIndex="-1">
        <div className="page-inner">
          <p role="status" className="status-message">
            Finish setting up your record before starting the pathway.
          </p>

          <Button to="/onboarding">
            Continue setting up
          </Button>
        </div>
      </main>
    );
  }

  if (!loaded) {
    return (
      <main id="main-content" className="page" aria-live="polite">
        <div className="page-inner">
          <p>Loading your learning progress...</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="page" tabIndex="-1">
      <div className="page-inner">
        <div className="journey-back">
          <Link to="/dashboard">
            <ArrowLeft size={18} aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>

        <header className="page-header">
          <p className="page-eyebrow">Your learning journey</p>

          <h1 className="page-title">
            {pathway.title}
          </h1>

          <p className="page-lead">
            Learn each skill, study the example, and practise in Canva.
            When you finish a step, send your work to your supervisor
            for feedback. The next week opens once every step in this
            one is sent or reviewed.
          </p>
        </header>

        <section
          className="progress-card"
          aria-labelledby="progress-heading"
        >
          <div className="progress-card-copy">
            <p className="page-eyebrow">Progress</p>

            <h2
              id="progress-heading"
              className="progress-percentage"
            >
              {summary.percentage}% complete
            </h2>
          </div>

          <div className="progress-bar-wrap">
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.percentage}
              aria-valuetext={`${summary.doneCount} of ${summary.totalTasks} steps done`}
            >
              <span
                className="progress-bar-fill"
                style={{
                  width: `${summary.percentage}%`,
                }}
              />
            </div>

            <p className="progress-count">
              {summary.doneCount} of {summary.totalTasks} steps done
              {summary.reviewedCount > 0 &&
                `, ${summary.reviewedCount} reviewed`}
            </p>
          </div>

          {next && (
            <Button
              onClick={() => setOpenWeek(next.weekIndex)}
              variant="secondary"
              icon={<ArrowRight size={18} />}
            >
              Go to next step
            </Button>
          )}
        </section>

        <StatusMessage>{notice}</StatusMessage>
        <ErrorMessage>{error}</ErrorMessage>

        <section
          className="week-list"
          aria-label="Pathway weeks"
        >
          {pathway.weeks.map((week, weekIndex) => {
            const status = getWeekStatus(
              pathway,
              rows,
              weekIndex
            );

            const locked = status === "locked";

            const doneInWeek = week.tasks.filter((task) => {
              const row = rows.find(
                (item) => item.task_id === task.id
              );

              return (
                row?.status === "submitted" ||
                row?.status === "reviewed"
              );
            }).length;

            const statusIcon =
              status === "complete" ? (
                <Check size={13} aria-hidden="true" />
              ) : status === "review" ? (
                <Clock size={13} aria-hidden="true" />
              ) : status === "locked" ? (
                <LockKeyhole size={13} aria-hidden="true" />
              ) : null;

            return (
              <CollapsiblePanel
                key={week.id}
                id={week.id}
                title={`Week ${weekIndex + 1}: ${week.title.replace(
                  /^Week \d+: /,
                  ""
                )}`}
                summary={week.objective}
                leading={weekIndex + 1}
                open={openWeek === weekIndex}
                onOpenChange={(isOpen) =>
                  setOpenWeek(isOpen ? weekIndex : null)
                }
                status={
                  <span
                    className={`pill ${WEEK_STATUS_PILL[status]}`}
                  >
                    {statusIcon}
                    {WEEK_STATUS_LABELS[status]}
                  </span>
                }
                meta={`${doneInWeek}/${week.tasks.length}`}
              >
                {locked ? (
                  <p className="panel-locked">
                    Send every step in the previous week before
                    this week opens.
                  </p>
                ) : (
                  <ul className="task-list">
                    {week.tasks.map((task) => {
                      const row = rows.find(
                        (item) => item.task_id === task.id
                      );

                      const taskStatus =
                        row?.status ?? "not-started";

                      const review = latestReview.get(task.id);

                      return (
                        <li
                          className="task-item"
                          key={task.id}
                        >
                          <div className="task-row">
                            <span
                              className={`task-mark is-${taskStatus}`}
                              aria-hidden="true"
                            >
                              {taskStatus === "reviewed" ? (
                                <Check
                                  size={12}
                                  strokeWidth={3}
                                />
                              ) : taskStatus === "submitted" ? (
                                <Clock size={12} />
                              ) : taskStatus === "started" ? (
                                <ShieldAlert size={12} />
                              ) : (
                                <Circle size={12} />
                              )}
                            </span>

                            <div className="task-copy">
                              <strong>{task.title}</strong>
                              <span>{task.description}</span>
                            </div>

                            <span
                              className={`pill ${taskStatusPill(
                                taskStatus
                              )}`}
                            >
                              {taskStatusLabel(taskStatus)}
                            </span>
                          </div>

                          {task.lesson && (
                            <section
                              className="lesson-card"
                              aria-label={`Lesson: ${task.title}`}
                            >
                              <div className="lesson-card-heading">
                                <span className="page-eyebrow">
                                  LEARN THE SKILL
                                </span>

                                <h3>{task.title}</h3>

                                <p>{task.lesson}</p>
                              </div>

                              {task.reference && (
                                <div
                                  className="lesson-reference"
                                  aria-label={task.reference.label}
                                >
                                  <span className="lesson-reference-label">
                                    {task.reference.label}
                                  </span>

                                  <h4>
                                    {task.reference.headline}
                                  </h4>

                                  <p className="lesson-reference-subtitle">
                                    {task.reference.subtitle}
                                  </p>

                                  <p className="lesson-reference-body">
                                    {task.reference.body}
                                  </p>
                                </div>
                              )}

                              <div className="lesson-resources">
                                {task.resourceUrl && (
                                  <a
                                    href={task.resourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <strong>
                                      Learn the skill
                                    </strong>

                                    <span>
                                      Open the learning tutorial
                                    </span>
                                  </a>
                                )}

                                {task.canvaUrl && (
                                  <a
                                    href={task.canvaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <strong>
                                      Practise in Canva
                                    </strong>

                                    <span>
                                      Open the Canva workspace
                                    </span>
                                  </a>
                                )}
                              </div>
                            </section>
                          )}

                          <div className="task-actions">
                            <SubmitPanel
                              task={task}
                              busy={busyTask === task.id}
                              onSubmit={handleSubmit}
                              disabled={
                                taskStatus === "submitted"
                              }
                            />
                          </div>

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
                )}
              </CollapsiblePanel>
            );
          })}
        </section>

        <footer className="journey-footer">
          <p>
            The goal is meaningful progress, not speed. Ask for
            the support or access adjustments that help you take part.
          </p>

          <Button
            to="/account"
            variant="quiet"
            iconAfter={<ArrowRight size={17} />}
          >
            View learner account
          </Button>
        </footer>
      </div>
    </main>
  );
}

function taskStatusLabel(status) {
  if (status === "reviewed") return "Reviewed";
  if (status === "submitted") return "With supervisor";
  if (status === "started") return "Started";
  return "Not started";
}

function taskStatusPill(status) {
  if (status === "reviewed") return "pill-success";
  if (status === "submitted") return "pill-waiting";
  if (status === "started") return "pill-progress";
  return "pill-locked";
}

/**
 * The submission form for a learner's design link and note.
 */
function SubmitPanel({
  task,
  busy,
  onSubmit,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [designLink, setDesignLink] = useState("");
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        icon={<Send size={17} />}
      >
        Send for review
      </Button>
    );
  }

  return (
    <form
      className="submit-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(task, designLink, note);
      }}
    >
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
          onChange={(event) =>
            setDesignLink(event.target.value)
          }
        />
      </div>

      <div className="auth-field">
        <label htmlFor={`note-${task.id}`}>
          Note for your supervisor (optional)
        </label>

        <textarea
          id={`note-${task.id}`}
          rows={2}
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
        />
      </div>

      <div className="submit-panel-actions">
        <Button
          variant="quiet"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={busy}
          icon={<Send size={17} />}
        >
          {busy ? "Sending..." : "Send for review"}
        </Button>
      </div>
    </form>
  );
}
