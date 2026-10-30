
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Check,
  Clock,
  ClipboardList,
  FileCheck,
  GraduationCap,
  Users,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  isPlatformAdmin,
  listAllLearners,
  listAssignments,
  listAudit,
  listAwaitingReview,
  listSupervisors,
  recordAudit,
  assignSupervisor,
} from "../../lib/db/admin.js";
import { createReview } from "../../lib/db/reviews.js";
import { getPathwayOrFirst } from "../../data/learningPaths.js";
import Button from "../../components/ui/Button.jsx";
import CollapsiblePanel from "../../components/ui/CollapsiblePanel.jsx";
import { ErrorMessage, StatusMessage } from "../../components/ui/StatusBanner.jsx";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "queue", label: "Approval queue" },
  { key: "learners", label: "Learners" },
  { key: "activity", label: "Activity" },
];

const ACTION_LABELS = {
  review_created: "Reviewed a step",
  learner_assigned: "Assigned a supervisor",
  learner_unassigned: "Removed a supervisor",
  supervisor_granted: "Granted supervisor access",
  supervisor_revoked: "Revoked supervisor access",
  document_deleted: "Deleted a document",
};

function findTask(pathwayId, taskId) {
  const pathway = getPathwayOrFirst(pathwayId);

  if (!pathway?.weeks) return null;

  for (const week of pathway.weeks) {
    const task = week.tasks.find((candidate) => candidate.id === taskId);
    if (task) return task;
  }

  return null;
}

function DashboardStat({ icon: Icon, label, value, note, color }) {
  return (
    <article className={`admin-stat-card admin-stat-${color}`}>
      <div className="admin-stat-top">
        <span className="admin-stat-label">{label}</span>
        <span className="admin-stat-icon">
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>

      <strong className="admin-stat-value">{value}</strong>
      <span className="admin-stat-note">{note}</span>
    </article>
  );
}

export default function AdminHome() {
  const { user } = useAuth();

  const [allowed, setAllowed] = useState(null);
  const [tab, setTab] = useState("overview");

  const [queue, setQueue] = useState([]);
  const [learners, setLearners] = useState([]);
  const [audit, setAudit] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const [
      nextQueue,
      nextLearners,
      nextAudit,
      nextSupervisors,
      nextAssignments,
    ] = await Promise.all([
      listAwaitingReview(),
      listAllLearners(),
      listAudit(30),
      listSupervisors(),
      listAssignments(),
    ]);

    setQueue(nextQueue);
    setLearners(nextLearners);
    setAudit(nextAudit);
    setSupervisors(nextSupervisors);
    setAssignments(nextAssignments);
  }, []);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const result = await isPlatformAdmin();

        if (!active) return;

        setAllowed(result);

        if (!result) return;

        try {
          await load();
        } catch (loadError) {
          if (active) setError(loadError.message);
        }
      } catch (checkError) {
        if (active) {
          setError(checkError.message);
          setAllowed(false);
        }
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [load]);

  async function handleReview(item, formData) {
    const reviewKey = `${item.learnerId}-${item.taskId}`;

    setBusy(reviewKey);
    setError("");
    setStatus("");

    try {
      await createReview({
        learnerId: item.learnerId,
        pathwayId: item.pathwayId,
        taskId: item.taskId,
        markedDone: formData.markedDone,
        rating: Number(formData.rating),
        review: formData.review,
        accessChange: formData.accessChange,
      });

      await recordAudit({
        action: "review_created",
        learnerId: item.learnerId,
        detail: {
          taskId: item.taskId,
          markedDone: formData.markedDone,
        },
      });

      await load();

      setStatus(`Review saved for ${item.learnerName}.`);
    } catch (reviewError) {
      setError(reviewError.message);
    } finally {
      setBusy("");
    }
  }

  async function handleAssign(learnerId, supervisorId) {
    setBusy(`assign-${learnerId}`);
    setError("");
    setStatus("");

    try {
      await assignSupervisor(learnerId, supervisorId);

      await recordAudit({
        action: "learner_assigned",
        learnerId,
        targetUserId: supervisorId,
      });

      await load();

      setStatus("Supervisor assigned.");
    } catch (assignError) {
      setError(assignError.message);
    } finally {
      setBusy("");
    }
  }

  if (allowed === null) {
    return (
      <main id="main-content" className="page" aria-live="polite">
        <div className="page-inner">
          <p>Checking your access...</p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main id="main-content" className="page" tabIndex="-1">
        <div className="page-inner">
          <div className="card">
            <h1 className="card-title">
              This area is for the EABD team
            </h1>

            <p className="card-subtitle">
              {user?.email
                ? `${user.email} does not have administrator access.`
                : "Your account does not have administrator access."}{" "}
              If you should be managing learners and approvals, ask the team to add you.
            </p>

            <ErrorMessage>{error}</ErrorMessage>

            <p>
              <Button to="/dashboard" variant="secondary">
                Go to your dashboard
              </Button>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Dashboard calculations use existing records only.
  const awaitingCount = queue.length;
  const totalLearners = learners.length;

  const onboardingComplete = learners.filter(
    (learner) => Boolean(learner.onboarding_completed_at)
  ).length;

  const onboardingInProgress = totalLearners - onboardingComplete;

  const activeLearners = learners.filter(
    (learner) => learner.counts.started > 0
  ).length;

  const learnersWithSupervisors = new Set(
    assignments.map((assignment) => assignment.learner_id)
  ).size;

  const totalStarted = learners.reduce(
    (total, learner) => total + learner.counts.started,
    0
  );

  const totalSubmitted = learners.reduce(
    (total, learner) => total + learner.counts.submitted,
    0
  );

  const totalReviewed = learners.reduce(
    (total, learner) => total + learner.counts.reviewed,
    0
  );

  const onboardingCompleteRate =
    totalLearners > 0
      ? Math.round((onboardingComplete / totalLearners) * 100)
      : 0;

  const supervisorCoverage =
    totalLearners > 0
      ? Math.round((learnersWithSupervisors / totalLearners) * 100)
      : 0;

  return (
    <main id="main-content" className="page" tabIndex="-1">
      <div className="page-inner">
        <header className="page-header">
          <p className="page-eyebrow">EABD team</p>

          <h1 className="page-title">Administration</h1>

          <p className="page-lead">
            Manage learner activity, review submissions, monitor onboarding
            and keep track of the EABD learning operation.
          </p>
        </header>

        <StatusMessage>{status}</StatusMessage>
        <ErrorMessage>{error}</ErrorMessage>

        <nav
          className="admin-tabs"
          role="tablist"
          aria-label="Administration sections"
        >
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              id={`admin-tab-${entry.key}`}
              aria-controls={`admin-panel-${entry.key}`}
              aria-selected={tab === entry.key}
              className="admin-tab"
              onClick={() => setTab(entry.key)}
            >
              {entry.label}

              {entry.key === "queue" && awaitingCount > 0 && (
                <span className="admin-tab-count">
                  {awaitingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* OVERVIEW DASHBOARD */}
        {tab === "overview" && (
          <section
            id="admin-panel-overview"
            role="tabpanel"
            aria-labelledby="admin-tab-overview"
            className="admin-section"
          >
            <div className="admin-overview-heading">
              <div>
                <h2 className="admin-heading">EABD at a glance</h2>
                <p className="admin-overview-description">
                  A snapshot of learner onboarding, participation and team activity.
                </p>
              </div>
            </div>

            <div className="admin-stat-grid">
              <DashboardStat
                icon={Users}
                label="Learner profiles"
                value={totalLearners}
                note="Profiles created"
                color="blue"
              />

              <DashboardStat
                icon={Check}
                label="Onboarding completed"
                value={onboardingComplete}
                note={`${onboardingCompleteRate}% of learner profiles`}
                color="green"
              />

              <DashboardStat
                icon={Clock}
                label="Onboarding in progress"
                value={onboardingInProgress}
                note="Profiles not yet completed"
                color="orange"
              />

              <DashboardStat
                icon={ClipboardList}
                label="Awaiting review"
                value={awaitingCount}
                note="Submissions requiring attention"
                color="purple"
              />
            </div>

            <div className="admin-overview-grid">
              <article className="admin-overview-panel">
                <div className="admin-panel-heading">
                  <div className="admin-panel-icon">
                    <Activity size={19} aria-hidden="true" />
                  </div>

                  <div>
                    <h3>Learning participation</h3>
                    <p className="admin-panel-description">
                      Activity recorded across learner task progress.
                    </p>
                  </div>
                </div>

                <div className="admin-metric-row">
                  <span>Learners who have started tasks</span>
                  <strong>{activeLearners}</strong>
                </div>

                <div className="admin-metric-row">
                  <span>Tasks started</span>
                  <strong>{totalStarted}</strong>
                </div>

                <div className="admin-metric-row">
                  <span>Tasks submitted</span>
                  <strong>{totalSubmitted}</strong>
                </div>

                <div className="admin-metric-row">
                  <span>Tasks reviewed</span>
                  <strong>{totalReviewed}</strong>
                </div>
              </article>

              <article className="admin-overview-panel">
                <div className="admin-panel-heading">
                  <div className="admin-panel-icon">
                    <FileCheck size={19} aria-hidden="true" />
                  </div>

                  <div>
                    <h3>Onboarding progress</h3>
                    <p className="admin-panel-description">
                      Completion status across all learner profiles.
                    </p>
                  </div>
                </div>

                <div
                  className="admin-progress-track"
                  role="img"
                  aria-label={`${onboardingCompleteRate}% of learner profiles have completed onboarding`}
                >
                  <div
                    className="admin-progress-fill"
                    style={{ width: `${onboardingCompleteRate}%` }}
                  />
                </div>

                <div className="admin-progress-legend">
                  <span>
                    <span className="admin-legend-dot admin-dot-green" />
                    Completed ({onboardingComplete})
                  </span>

                  <span>
                    <span className="admin-legend-dot admin-dot-orange" />
                    In progress ({onboardingInProgress})
                  </span>
                </div>

                <div className="admin-metric-row admin-coverage-row">
                  <span>Learners with supervisors</span>
                  <strong>
                    {learnersWithSupervisors} / {totalLearners}
                  </strong>
                </div>

                <div
                  className="admin-progress-track admin-progress-secondary"
                  role="img"
                  aria-label={`${supervisorCoverage}% of learner profiles have an assigned supervisor`}
                >
                  <div
                    className="admin-progress-fill admin-progress-fill-secondary"
                    style={{ width: `${supervisorCoverage}%` }}
                  />
                </div>

                <span className="admin-progress-caption">
                  {supervisorCoverage}% supervisor coverage
                </span>
              </article>
            </div>

            <article className="admin-overview-panel admin-review-summary">
              <div>
                <div className="admin-panel-heading">
                  <div className="admin-panel-icon">
                    <ClipboardList size={19} aria-hidden="true" />
                  </div>

                  <div>
                    <h3>Review queue</h3>
                    <p className="admin-panel-description">
                      Submissions waiting for an administrator or supervisor
                      to review.
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-review-summary-count">
                <strong>{awaitingCount}</strong>
                <span>Waiting</span>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setTab("queue")}
              >
                Open approval queue
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </article>

            <article className="admin-overview-panel">
              <div className="admin-panel-heading">
                <div className="admin-panel-icon">
                  <UserCheck size={19} aria-hidden="true" />
                </div>

                <div>
                  <h3>Team supervision</h3>
                  <p className="admin-panel-description">
                    Current supervisor availability and learner assignments.
                  </p>
                </div>
              </div>

              <div className="admin-metric-row">
                <span>Available supervisors</span>
                <strong>{supervisors.length}</strong>
              </div>

              <div className="admin-metric-row">
                <span>Learners with assignments</span>
                <strong>{learnersWithSupervisors}</strong>
              </div>

              <div className="admin-metric-row">
                <span>Learners without assignments</span>
                <strong>
                  {Math.max(0, totalLearners - learnersWithSupervisors)}
                </strong>
              </div>

              <button
                type="button"
                className="admin-text-link"
                onClick={() => setTab("learners")}
              >
                Manage learner assignments
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </article>

            <article className="admin-overview-panel">
              <div className="admin-panel-heading">
                <div className="admin-panel-icon">
                  <Activity size={19} aria-hidden="true" />
                </div>

                <div>
                  <h3>Recent administrative activity</h3>
                  <p className="admin-panel-description">
                    Latest recorded actions by the EABD team.
                  </p>
                </div>
              </div>

              {audit.length === 0 ? (
                <p className="admin-empty-note">
                  No administrative actions have been recorded yet.
                </p>
              ) : (
                <ol className="admin-activity admin-activity-preview">
                  {audit.slice(0, 5).map((entry) => (
                    <li key={entry.id}>
                      <span className="admin-activity-action">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>

                      <span className="admin-activity-time">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <button
                type="button"
                className="admin-text-link"
                onClick={() => setTab("activity")}
              >
                View all activity
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </article>
          </section>
        )}

        {/* APPROVAL QUEUE */}
        {tab === "queue" && (
          <section
            id="admin-panel-queue"
            role="tabpanel"
            aria-labelledby="admin-tab-queue"
            className="admin-section"
          >
            <h2 className="admin-heading">Waiting for review</h2>

            {queue.length === 0 ? (
              <p role="status" className="status-message">
                Nothing is waiting for review.
              </p>
            ) : (
              <div className="admin-queue">
                {queue.map((item) => {
                  const task = findTask(item.pathwayId, item.taskId);
                  const key = `${item.learnerId}-${item.taskId}`;

                  return (
                    <CollapsiblePanel
                      key={key}
                      id={`queue-${key}`}
                      defaultOpen={queue.length === 1}
                      title={`${item.learnerName}: ${task?.title ?? item.taskId}`}
                      summary={item.learnerNote || "No note from the learner."}
                      status={
                        <span className="pill pill-waiting">
                          <Clock size={13} aria-hidden="true" />
                          Waiting
                        </span>
                      }
                      meta={
                        item.submittedAt
                          ? new Date(item.submittedAt).toLocaleDateString()
                          : ""
                      }
                    >
                      {item.designLink && (
                        <p>
                          <a
                            href={item.designLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open the learner's design
                          </a>
                        </p>
                      )}

                      <p className="auth-help">
                        <strong>What to check:</strong>{" "}
                        {task?.reviewPrompt ??
                          "Check the step meets the pathway outcome."}
                      </p>

                      <ReviewForm
                        busy={busy === key}
                        onSubmit={(formData) =>
                          handleReview(item, formData)
                        }
                      />
                    </CollapsiblePanel>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* LEARNERS */}
        {tab === "learners" && (
          <section
            id="admin-panel-learners"
            role="tabpanel"
            aria-labelledby="admin-tab-learners"
            className="admin-section"
          >
            <h2 className="admin-heading">Learners</h2>

            <p className="admin-overview-description">
              View learner onboarding and task progress, and manage supervisor
              assignments.
            </p>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <caption className="visually-hidden">
                  Every learner record, with progress counts and assigned supervisors
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Learner</th>
                    <th scope="col">Account</th>
                    <th scope="col">Setup</th>
                    <th scope="col">Started</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Reviewed</th>
                    <th scope="col">Supervisor</th>
                  </tr>
                </thead>

                <tbody>
                  {learners.length === 0 ? (
                    <tr>
                      <td colSpan="7">No learner profiles found.</td>
                    </tr>
                  ) : (
                    learners.map((learner) => {
                      const assigned = assignments
                        .filter((row) => row.learner_id === learner.id)
                        .map((row) => row.supervisor_id);

                      const available = supervisors.filter(
                        (supervisor) =>
                          !assigned.includes(supervisor.user_id)
                      );

                      return (
                        <tr key={learner.id}>
                          <th scope="row">{learner.first_name}</th>

                          <td>
                            {learner.relationship === "self"
                              ? "Learner"
                              : "Guardian"}
                          </td>

                          <td>
                            {learner.onboarding_completed_at ? (
                              <span className="pill pill-success">
                                Complete
                              </span>
                            ) : (
                              <span className="pill pill-progress">
                                In progress
                              </span>
                            )}
                          </td>

                          <td>{learner.counts.started}</td>
                          <td>{learner.counts.submitted}</td>
                          <td>{learner.counts.reviewed}</td>

                          <td>
                            {assigned.length === 0 ? (
                              <div className="admin-assign">
                                <label
                                  className="visually-hidden"
                                  htmlFor={`assign-${learner.id}`}
                                >
                                  Assign a supervisor to {learner.first_name}
                                </label>

                                <select
                                  id={`assign-${learner.id}`}
                                  defaultValue=""
                                  onChange={(event) => {
                                    if (event.target.value) {
                                      handleAssign(
                                        learner.id,
                                        event.target.value
                                      );
                                    }
                                  }}
                                  disabled={
                                    available.length === 0 ||
                                    busy === `assign-${learner.id}`
                                  }
                                >
                                  <option value="">
                                    {available.length === 0
                                      ? "None available"
                                      : "Assign..."}
                                  </option>

                                  {available.map((supervisor) => (
                                    <option
                                      key={supervisor.user_id}
                                      value={supervisor.user_id}
                                    >
                                      {supervisor.profiles?.full_name ??
                                        supervisor.user_id.slice(0, 8)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span className="pill pill-success">
                                <Check size={12} aria-hidden="true" />
                                {assigned.length} assigned
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ACTIVITY */}
        {tab === "activity" && (
          <section
            id="admin-panel-activity"
            role="tabpanel"
            aria-labelledby="admin-tab-activity"
            className="admin-section"
          >
            <h2 className="admin-heading">Recent activity</h2>

            {audit.length === 0 ? (
              <p role="status" className="status-message">
                No administrative actions yet.
              </p>
            ) : (
              <ol className="admin-activity">
                {audit.map((entry) => (
                  <li key={entry.id}>
                    <span className="admin-activity-action">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>

                    <span className="admin-activity-time">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        <p className="admin-footer-note">
          Signed in as a member of the EABD team.{" "}
          <Link to="/dashboard">Return to your dashboard</Link>.
        </p>
      </div>
    </main>
  );
}

/**
 * The review form is kept local because the admin queue is the only place
 * that reviews on behalf of any supervisor.
 */
function ReviewForm({ busy, onSubmit }) {
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
    onSubmit({ markedDone, rating, review, accessChange });
  }

  return (
    <form className="admin-review" onSubmit={handleSubmit}>
      <fieldset className="onboarding-fieldset">
        <legend>Did they do the step?</legend>

        <label className="onboarding-option">
          <input
            type="radio"
            name="admin-done"
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
            name="admin-done"
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

        <div
          className="segmented-options"
          role="group"
          aria-label="Rating from 1 to 5"
        >
          {[1, 2, 3, 4, 5].map((value) => (
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
      </fieldset>

      <div className="auth-field">
        <label htmlFor="admin-review-text">Comment for the learner</label>

        <textarea
          id="admin-review-text"
          rows={3}
          value={review}
          onChange={(event) => setReview(event.target.value)}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="admin-access-change">
          What changed so the step could be done? (optional)
        </label>

        <textarea
          id="admin-access-change"
          rows={2}
          value={accessChange}
          onChange={(event) => setAccessChange(event.target.value)}
        />
      </div>

      <ErrorMessage>{localError}</ErrorMessage>

      <Button type="submit" disabled={busy}>
        {busy ? "Saving..." : "Save review"}
      </Button>
    </form>
  );
}
