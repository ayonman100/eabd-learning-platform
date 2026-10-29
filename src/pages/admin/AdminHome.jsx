import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock } from "lucide-react";
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
  for (const week of pathway.weeks) {
    const task = week.tasks.find((candidate) => candidate.id === taskId);
    if (task) return task;
  }
  return null;
}

export default function AdminHome() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(null);
  const [tab, setTab] = useState("queue");

  const [queue, setQueue] = useState([]);
  const [learners, setLearners] = useState([]);
  const [audit, setAudit] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const [nextQueue, nextLearners, nextAudit, nextSupervisors, nextAssignments] =
      await Promise.all([
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

    isPlatformAdmin()
      .then(async (result) => {
        if (!active) return;
        setAllowed(result);
        if (!result) return;
        try {
          await load();
        } catch (loadError) {
          if (active) setError(loadError.message);
        }
      })
      .catch((checkError) => {
        if (active) {
          setError(checkError.message);
          setAllowed(false);
        }
      });

    return () => {
      active = false;
    };
  }, [load]);

  async function handleReview(item, formData) {
    setBusy(`${item.learnerId}-${item.taskId}`);
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
        detail: { taskId: item.taskId, markedDone: formData.markedDone },
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
            <h1 className="card-title">This area is for the EABD team</h1>
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

  const awaitingCount = queue.length;

  return (
    <main id="main-content" className="page" tabIndex="-1">
      <div className="page-inner">
        <header className="page-header">
          <p className="page-eyebrow">EABD team</p>
          <h1 className="page-title">Administration</h1>
          <p className="page-lead">
            Review what learners have sent, see who is signed up, and check what has changed.
            Every decision is recorded and cannot be edited afterwards.
          </p>
        </header>

        <StatusMessage>{status}</StatusMessage>
        <ErrorMessage>{error}</ErrorMessage>

        <div className="admin-tabs" role="tablist" aria-label="Administration sections">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={tab === entry.key}
              className="admin-tab"
              onClick={() => setTab(entry.key)}
            >
              {entry.label}
              {entry.key === "queue" && awaitingCount > 0 && (
                <span className="admin-tab-count">{awaitingCount}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "queue" && (
          <section aria-labelledby="queue-heading" className="admin-section">
            <h2 id="queue-heading" className="admin-heading">
              Waiting for review
            </h2>

            {queue.length === 0 ? (
              <p role="status" className="status-message">
                Nothing is waiting. Every step has been reviewed.
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
                          <a href={item.designLink} target="_blank" rel="noreferrer">
                            Open the learner's design
                          </a>
                        </p>
                      )}

                      <p className="auth-help">
                        <strong>What to check:</strong>{" "}
                        {task?.reviewPrompt ?? "Check the step meets the pathway outcome."}
                      </p>

                      <ReviewForm
                        busy={busy === key}
                        onSubmit={(formData) => handleReview(item, formData)}
                      />
                    </CollapsiblePanel>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "learners" && (
          <section aria-labelledby="learners-heading" className="admin-section">
            <h2 id="learners-heading" className="admin-heading">
              Learners
            </h2>

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
                    <th scope="col">With supervisor</th>
                    <th scope="col">Reviewed</th>
                    <th scope="col">Supervisor</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((learner) => {
                    const assigned = assignments
                      .filter((row) => row.learner_id === learner.id)
                      .map((row) => row.supervisor_id);

                    const available = supervisors.filter(
                      (supervisor) => !assigned.includes(supervisor.user_id)
                    );

                    return (
                      <tr key={learner.id}>
                        <th scope="row">{learner.first_name}</th>
                        <td>{learner.relationship === "self" ? "Learner" : "Guardian"}</td>
                        <td>
                          {learner.onboarding_completed_at ? (
                            <span className="pill pill-success">Complete</span>
                          ) : (
                            <span className="pill pill-progress">In progress</span>
                          )}
                        </td>
                        <td>{learner.counts.started}</td>
                        <td>{learner.counts.submitted}</td>
                        <td>{learner.counts.reviewed}</td>
                        <td>
                          {assigned.length === 0 ? (
                            <div className="admin-assign">
                              <label className="visually-hidden" htmlFor={`assign-${learner.id}`}>
                                Assign a supervisor to {learner.first_name}
                              </label>
                              <select
                                id={`assign-${learner.id}`}
                                defaultValue=""
                                onChange={(event) => {
                                  if (event.target.value) {
                                    handleAssign(learner.id, event.target.value);
                                  }
                                }}
                                disabled={available.length === 0 || busy === `assign-${learner.id}`}
                              >
                                <option value="">
                                  {available.length === 0 ? "None available" : "Assign..."}
                                </option>
                                {available.map((supervisor) => (
                                  <option key={supervisor.user_id} value={supervisor.user_id}>
                                    {supervisor.profiles?.full_name ?? supervisor.user_id.slice(0, 8)}
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
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "activity" && (
          <section aria-labelledby="activity-heading" className="admin-section">
            <h2 id="activity-heading" className="admin-heading">
              Recent activity
            </h2>

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
 * The review form, kept local because the admin queue is the only place that
 * reviews on behalf of any supervisor. A supervisor reviews from their own page.
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
        <div className="segmented-options" role="group" aria-label="Rating from 1 to 5">
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
