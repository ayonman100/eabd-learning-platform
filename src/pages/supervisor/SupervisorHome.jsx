import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSupervisedLearners } from "../../lib/db/learners.js";
import { ErrorMessage } from "../../components/ui/StatusBanner.jsx";

export default function SupervisorHome() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    listSupervisedLearners()
      .then((rows) => {
        if (active) setLearners(rows);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main id="main-content" className="supervisor-page" tabIndex="-1">
      <div className="supervisor-inner">
        <header className="supervisor-intro">
          <p className="auth-eyebrow">SUPERVISOR</p>
          <h1>Learners you support</h1>
          <p>
            Open a learner to see their record and the steps waiting for your
            review.
          </p>
        </header>

        <ErrorMessage>{error}</ErrorMessage>

        {loading ? (
          <p aria-live="polite">Loading your learners...</p>
        ) : learners.length === 0 ? (
          <p role="status" className="status-message">
            No learners are assigned to you yet. Ask the EABD team to add you.
          </p>
        ) : (
          <ul className="supervisor-list">
            {learners.map((learner) => (
              <li key={learner.id}>
                <Link to={`/supervisor/learners/${learner.id}`}>
                  <strong>{learner.firstName}</strong>
                  <span>
                    {learner.awaitingReview === 0
                      ? "Nothing waiting for review"
                      : `${learner.awaitingReview} ${
                          learner.awaitingReview === 1 ? "step" : "steps"
                        } waiting for review`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="profile-back">
          <Link to="/dashboard">Back to your dashboard</Link>
        </p>
      </div>
    </main>
  );
}
